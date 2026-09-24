import type { SerializedNode, SerializedNodes } from "@craftjs/core";
import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { SiteSettings } from "#/builder/core/theme";
import { mergePage, type SectionTree, type SitePart } from "#/builder/core/tree";
import { blankPage, buildPageTemplate, PAGE_TEMPLATES } from "#/builder/templates/pages";
import { db } from "#/db";
import { page, pageSection, project, section } from "#/db/schema";
import { isValidSlug, slugify } from "#/lib/slug";
import { requirePageAccess, requireProjectAccess } from "./access.ts";
import { authMiddleware } from "./middleware.ts";
import {
  deleteOrphanSections,
  insertSections,
  loadPageSections,
  loadSections,
  loadSitePart,
  loadSiteSettings,
  publishPageById,
  renderTemplatePreview,
  uniqueSlug,
  upsertSections,
} from "./page-store.ts";

const nodesSchema = z.record(z.string(), z.any()) as unknown as z.ZodType<SerializedNodes>;
const nodeSchema = z.record(z.string(), z.any()) as unknown as z.ZodType<SerializedNode>;

/* ------------------------------------------------------------------ */
/* Listagem e criação                                                  */
/* ------------------------------------------------------------------ */

export const listPages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ projectId: z.string() }))
  .handler(async ({ data, context }) => {
    await requireProjectAccess(context.user.id, data.projectId);
    return db
      .select({
        id: page.id,
        name: page.name,
        slug: page.slug,
        status: page.status,
        updatedAt: page.updatedAt,
        publishedAt: page.publishedAt,
      })
      .from(page)
      .where(and(eq(page.projectId, data.projectId), isNull(page.deletedAt)))
      .orderBy(desc(page.updatedAt));
  });

/** Modelos de página disponíveis (para todos os usuários). */
export const listPageTemplates = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () =>
    PAGE_TEMPLATES.map(({ id, name, description }) => ({
      id,
      name,
      description,
    })),
  );

/** Prévia (HTML) de um modelo com o tema do projeto. */
export const previewPageTemplate = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ projectId: z.string(), templateId: z.string() }))
  .handler(async ({ data, context }) => {
    await requireProjectAccess(context.user.id, data.projectId);
    const template = PAGE_TEMPLATES.find((t) => t.id === data.templateId);
    if (!template) throw new Error("Modelo não encontrado");
    return renderTemplatePreview(data.projectId, template);
  });

export const createPage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      projectId: z.string(),
      name: z.string().trim().min(1).max(120),
      slug: z.string().trim().optional(),
      /** Modelo de página (vazio: página em branco com um hero). */
      templateId: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await requireProjectAccess(context.user.id, data.projectId);
    const chosen = data.slug ? slugify(data.slug) : "";
    if (chosen) {
      const taken = await db.query.page.findFirst({
        where: and(eq(page.projectId, data.projectId), eq(page.slug, chosen), isNull(page.deletedAt)),
      });
      if (taken) throw new Error("Já existe uma página com esse endereço");
    }
    const slug = chosen || (await uniqueSlug(data.projectId, slugify(data.name) || "pagina"));
    const template = PAGE_TEMPLATES.find((t) => t.id === data.templateId);
    const tree = template ? buildPageTemplate(template) : blankPage();
    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(page)
        .values({
          projectId: data.projectId,
          name: data.name,
          slug,
          root: tree.root,
          seo: { title: data.name },
          ...(template
            ? {
                headerMode: template.headerMode,
                footerMode: template.footerMode,
              }
            : {}),
        })
        .returning({ id: page.id });
      await insertSections(tx, data.projectId, created.id, tree.sections);
      return created;
    });
  });

export const duplicatePage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ pageId: z.string() }))
  .handler(async ({ data, context }) => {
    const source = await requirePageAccess(context.user.id, data.pageId);
    const { cloneTree } = await import("#/builder/core/tree");
    const sections = await loadSections(source.id);
    const copies: SectionTree[] = sections.map((s) => {
      // seções globais continuam compartilhadas; as demais são copiadas
      if (s.isGlobal) return s;
      const cloned = cloneTree(s.nodes, s.rootNodeId, "ROOT");
      return { ...s, rootNodeId: cloned.rootNodeId, nodes: cloned.nodes };
    });
    const slug = await uniqueSlug(source.projectId, `${source.slug}-copia`);
    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(page)
        .values({
          projectId: source.projectId,
          name: `${source.name} (cópia)`,
          slug,
          root: source.root,
          seo: source.seo,
          tracking: source.tracking,
          headerMode: source.headerMode,
          footerMode: source.footerMode,
        })
        .returning({ id: page.id });
      await insertSections(tx, source.projectId, created.id, copies);
      return created;
    });
  });

export const deletePage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ pageId: z.string() }))
  .handler(async ({ data, context }) => {
    const row = await requirePageAccess(context.user.id, data.pageId);
    await db.transaction(async (tx) => {
      await tx.update(page).set({ deletedAt: new Date() }).where(eq(page.id, row.id));
      const ids = (
        await tx.select({ id: pageSection.sectionId }).from(pageSection).where(eq(pageSection.pageId, row.id))
      ).map((r) => r.id);
      await tx.delete(pageSection).where(eq(pageSection.pageId, row.id));
      await deleteOrphanSections(tx, ids);
    });
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Editor: carregar e salvar                                           */
/* ------------------------------------------------------------------ */

export const getEditorPage = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ pageId: z.string() }))
  .handler(async ({ data, context }) => {
    const row = await requirePageAccess(context.user.id, data.pageId);
    const { project: proj, settings } = await loadSiteSettings(row.projectId);
    const [sections, header, footer] = await Promise.all([
      loadPageSections(row, settings),
      loadSitePart(row.projectId, settings.headerSectionId, "header"),
      loadSitePart(row.projectId, settings.footerSectionId, "footer"),
    ]);
    return {
      page: {
        id: row.id,
        projectId: row.projectId,
        projectSlug: proj.slug,
        name: row.name,
        slug: row.slug,
        status: row.status,
        seo: row.seo,
        tracking: row.tracking,
        version: row.version,
        updatedAt: row.updatedAt.toISOString(),
        publishedAt: row.publishedAt?.toISOString() ?? null,
      },
      site: settings,
      /** Cabeçalho/rodapé do site, para reinserir numa página que não usa. */
      siteParts: { header, footer },
      nodes: mergePage(row.root, sections),
    };
  });

const sectionInput = z.object({
  rootNodeId: z.string().min(1),
  kind: z.enum(["section", "header", "footer"]),
  name: z.string().max(120),
  isGlobal: z.boolean(),
  sitePart: z.enum(["header", "footer"]).optional(),
  nodes: nodesSchema,
});

export class VersionConflictError extends Error {
  constructor() {
    super("VERSION_CONFLICT");
  }
}

/**
 * Salva a página inteira numa transação. `version` precisa bater com a do
 * banco; se outra aba/pessoa salvou antes, retorna conflito.
 */
export const savePage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      pageId: z.string(),
      version: z.number().int(),
      root: nodeSchema,
      sections: z.array(sectionInput).max(200),
      force: z.boolean().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const current = await requirePageAccess(context.user.id, data.pageId);
    const result = await db.transaction(async (tx) => {
      const [locked] = await tx
        .select({ version: page.version })
        .from(page)
        .where(eq(page.id, current.id))
        .for("update");
      if (!data.force && locked.version !== data.version) throw new VersionConflictError();

      const previous = (
        await tx.select({ id: pageSection.sectionId }).from(pageSection).where(eq(pageSection.pageId, current.id))
      ).map((r) => r.id);

      const siteParts = data.sections.filter((s) => s.sitePart);
      const own = data.sections.filter((s) => !s.sitePart);
      const { sectionIds, touchedGlobalIds } = await upsertSections(tx, current.projectId, own);

      // cabeçalho/rodapé do site: seção global apontada nas configurações do projeto
      const { settings } = await loadSiteSettings(current.projectId);
      const sitePatch: Partial<SiteSettings> = {};
      const touchedParts: SitePart[] = [];
      for (const part of siteParts) {
        const {
          sectionIds: [id],
        } = await upsertSections(tx, current.projectId, [{ ...part, isGlobal: true }]);
        const key = part.sitePart === "header" ? "headerSectionId" : "footerSectionId";
        if (settings[key] !== id) sitePatch[key] = id;
        touchedParts.push(part.sitePart as SitePart);
      }
      if (Object.keys(sitePatch).length) {
        await tx
          .update(project)
          .set({ settings: { ...settings, ...sitePatch } })
          .where(eq(project.id, current.projectId));
      }
      const modeOf = (part: SitePart) =>
        siteParts.some((s) => s.sitePart === part)
          ? ("site" as const)
          : own.some((s) => s.kind === part)
            ? ("custom" as const)
            : ("none" as const);
      const headerMode = modeOf("header");
      const footerMode = modeOf("footer");

      await tx.delete(pageSection).where(eq(pageSection.pageId, current.id));
      if (sectionIds.length) {
        await tx.insert(pageSection).values(
          sectionIds.map((sectionId, position) => ({
            pageId: current.id,
            sectionId,
            position,
          })),
        );
      }
      await deleteOrphanSections(
        tx,
        previous.filter((id) => !sectionIds.includes(id)),
      );

      const [updated] = await tx
        .update(page)
        .set({
          root: { ...data.root, nodes: [] },
          version: locked.version + 1,
          headerMode,
          footerMode,
        })
        .where(eq(page.id, current.id))
        .returning({ version: page.version, updatedAt: page.updatedAt });

      // outras páginas publicadas que usam seções globais alteradas
      const affected = touchedGlobalIds.length
        ? await tx
            .selectDistinct({ id: page.id })
            .from(pageSection)
            .innerJoin(page, eq(page.id, pageSection.pageId))
            .where(
              and(
                inArray(pageSection.sectionId, touchedGlobalIds),
                ne(page.id, current.id),
                eq(page.status, "published"),
                isNull(page.deletedAt),
              ),
            )
        : [];
      // páginas publicadas que usam o cabeçalho/rodapé do site alterado
      const usingSiteParts = touchedParts.length
        ? await tx
            .select({ id: page.id })
            .from(page)
            .where(
              and(
                eq(page.projectId, current.projectId),
                ne(page.id, current.id),
                eq(page.status, "published"),
                isNull(page.deletedAt),
                or(
                  touchedParts.includes("header") ? eq(page.headerMode, "site") : undefined,
                  touchedParts.includes("footer") ? eq(page.footerMode, "site") : undefined,
                ),
              ),
            )
        : [];
      const affectedIds = [...new Set([...affected, ...usingSiteParts].map((a) => a.id))];
      return { ...updated, affectedPageIds: affectedIds };
    });

    return {
      version: result.version,
      updatedAt: result.updatedAt.toISOString(),
      affectedPageIds: result.affectedPageIds,
    };
  });

export const updatePageSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      pageId: z.string(),
      name: z.string().trim().min(1).max(120).optional(),
      slug: z.string().trim().optional(),
      seo: z
        .object({
          title: z.string().max(120).optional(),
          description: z.string().max(300).optional(),
          faviconUrl: z.string().optional(),
          ogImageUrl: z.string().optional(),
          noIndex: z.boolean().optional(),
        })
        .optional(),
      tracking: z
        .object({
          facebookPixelId: z.string().max(40).optional(),
          googleTagId: z.string().max(40).optional(),
          tiktokPixelId: z.string().max(40).optional(),
          headScripts: z.string().max(50_000).optional(),
          bodyScripts: z.string().max(50_000).optional(),
        })
        .optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const row = await requirePageAccess(context.user.id, data.pageId);
    const patch: Partial<typeof page.$inferInsert> = {};
    if (data.name) patch.name = data.name;
    if (data.seo) patch.seo = data.seo;
    if (data.tracking) patch.tracking = data.tracking;
    if (data.slug !== undefined && data.slug !== row.slug) {
      if (!isValidSlug(data.slug)) throw new Error("Slug inválido: use letras minúsculas, números e hífen");
      const taken = await db.query.page.findFirst({
        where: and(eq(page.projectId, row.projectId), eq(page.slug, data.slug), isNull(page.deletedAt)),
      });
      if (taken) throw new Error("Já existe uma página com esse endereço");
      patch.slug = data.slug;
    }
    const [updated] = await db.update(page).set(patch).where(eq(page.id, row.id)).returning();
    return {
      name: updated.name,
      slug: updated.slug,
      seo: updated.seo,
      tracking: updated.tracking,
    };
  });

/* ------------------------------------------------------------------ */
/* Publicação                                                          */
/* ------------------------------------------------------------------ */

export const publishPage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ pageId: z.string(), republish: z.array(z.string()).optional() }))
  .handler(async ({ data, context }) => {
    const row = await requirePageAccess(context.user.id, data.pageId);
    const result = await publishPageById(row.id);
    // republica páginas afetadas por seções globais editadas nesta página
    for (const id of data.republish ?? []) {
      const other = await db.query.page.findFirst({ where: eq(page.id, id) });
      if (other && other.projectId === row.projectId && other.status === "published") {
        await publishPageById(id);
      }
    }
    return result;
  });

/** Tira a página do ar: volta a rascunho e o endereço deixa de responder. */
export const unpublishPage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ pageId: z.string() }))
  .handler(async ({ data, context }) => {
    const row = await requirePageAccess(context.user.id, data.pageId);
    await db.update(page).set({ status: "draft", publishedHtml: null, publishedAt: null }).where(eq(page.id, row.id));
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Seções globais e modelos                                            */
/* ------------------------------------------------------------------ */

export const listGlobalSections = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ projectId: z.string() }))
  .handler(async ({ data, context }) => {
    await requireProjectAccess(context.user.id, data.projectId);
    const rows = await db
      .select({
        id: section.id,
        name: section.name,
        kind: section.kind,
        rootNodeId: section.rootNodeId,
        nodes: section.nodes,
        updatedAt: section.updatedAt,
        usage: sql<number>`(select count(*)::int from ${pageSection} where ${pageSection.sectionId} = ${section.id})`,
      })
      .from(section)
      .where(
        and(
          eq(section.projectId, data.projectId),
          eq(section.isGlobal, true),
          // cabeçalho e rodapé do site são geridos à parte
          eq(section.kind, "section"),
        ),
      )
      .orderBy(asc(section.name));
    return rows;
  });
