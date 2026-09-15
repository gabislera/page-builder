import type { SerializedNode, SerializedNodes } from "@craftjs/core";
import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { mergePage, type SectionTree } from "#/builder/core/tree";
import { blankPage } from "#/builder/templates/pages";
import { db } from "#/db";
import { page, pageSection, project, section } from "#/db/schema";
import { isValidSlug, slugify } from "#/lib/slug";
import { requirePageAccess, requireProjectAccess } from "./access.ts";
import { authMiddleware } from "./middleware.ts";
import {
	deleteOrphanSections,
	insertSections,
	loadSections,
	publishPageById,
	uniqueSlug,
	upsertSections,
} from "./page-store.ts";

const nodesSchema = z.record(
	z.string(),
	z.any(),
) as unknown as z.ZodType<SerializedNodes>;
const nodeSchema = z.record(
	z.string(),
	z.any(),
) as unknown as z.ZodType<SerializedNode>;

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

export const createPage = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(
		z.object({
			projectId: z.string(),
			name: z.string().trim().min(1).max(120),
			slug: z.string().trim().optional(),
		}),
	)
	.handler(async ({ data, context }) => {
		await requireProjectAccess(context.user.id, data.projectId);
		const slug = await uniqueSlug(
			data.projectId,
			slugify(data.slug || data.name) || "pagina",
		);
		const tree = blankPage();
		return db.transaction(async (tx) => {
			const [created] = await tx
				.insert(page)
				.values({
					projectId: data.projectId,
					name: data.name,
					slug,
					root: tree.root,
					seo: { title: data.name },
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
			await tx
				.update(page)
				.set({ deletedAt: new Date() })
				.where(eq(page.id, row.id));
			const ids = (
				await tx
					.select({ id: pageSection.sectionId })
					.from(pageSection)
					.where(eq(pageSection.pageId, row.id))
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
		const proj = await db.query.project.findFirst({
			where: eq(project.id, row.projectId),
		});
		const sections = await loadSections(row.id);
		return {
			page: {
				id: row.id,
				projectId: row.projectId,
				projectSlug: proj?.slug ?? "",
				name: row.name,
				slug: row.slug,
				status: row.status,
				seo: row.seo,
				tracking: row.tracking,
				version: row.version,
				updatedAt: row.updatedAt.toISOString(),
				publishedAt: row.publishedAt?.toISOString() ?? null,
			},
			nodes: mergePage(row.root, sections),
		};
	});

const sectionInput = z.object({
	rootNodeId: z.string().min(1),
	kind: z.enum(["section", "header", "footer"]),
	name: z.string().max(120),
	isGlobal: z.boolean(),
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
			if (!data.force && locked.version !== data.version)
				throw new VersionConflictError();

			const previous = (
				await tx
					.select({ id: pageSection.sectionId })
					.from(pageSection)
					.where(eq(pageSection.pageId, current.id))
			).map((r) => r.id);

			const { sectionIds, touchedGlobalIds } = await upsertSections(
				tx,
				current.projectId,
				data.sections,
			);

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
				.set({ root: { ...data.root, nodes: [] }, version: locked.version + 1 })
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
			return { ...updated, affectedPageIds: affected.map((a) => a.id) };
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
			if (!isValidSlug(data.slug))
				throw new Error(
					"Slug inválido: use letras minúsculas, números e hífen",
				);
			const taken = await db.query.page.findFirst({
				where: and(
					eq(page.projectId, row.projectId),
					eq(page.slug, data.slug),
					isNull(page.deletedAt),
				),
			});
			if (taken) throw new Error("Já existe uma página com esse endereço");
			patch.slug = data.slug;
		}
		const [updated] = await db
			.update(page)
			.set(patch)
			.where(eq(page.id, row.id))
			.returning();
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
	.validator(
		z.object({ pageId: z.string(), republish: z.array(z.string()).optional() }),
	)
	.handler(async ({ data, context }) => {
		const row = await requirePageAccess(context.user.id, data.pageId);
		const result = await publishPageById(row.id);
		// republica páginas afetadas por seções globais editadas nesta página
		for (const id of data.republish ?? []) {
			const other = await db.query.page.findFirst({ where: eq(page.id, id) });
			if (
				other &&
				other.projectId === row.projectId &&
				other.status === "published"
			) {
				await publishPageById(id);
			}
		}
		return result;
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
				and(eq(section.projectId, data.projectId), eq(section.isGlobal, true)),
			)
			.orderBy(asc(section.name));
		return rows;
	});
