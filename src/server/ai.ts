/**
 * AI generation. The model returns AI-Spec (validated by the schema) and
 * the compiler turns it into nodes, so responses stay small and a spec
 * can be recompiled when the compiler improves.
 */
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { compileSection } from "#/builder/ai/compile";
import {
  BriefSpec,
  briefText,
  PAGE_PLAN_INSTRUCTIONS,
  PagePlanSpec,
  pageSectionUserPrompt,
  pageTypeOf,
  planUserPrompt,
} from "#/builder/ai/page";
import { SECTION_INSTRUCTIONS, sectionUserPrompt, VARIATIONS } from "#/builder/ai/prompt";
import { SectionSpec } from "#/builder/ai/spec";
import {
  fixContrast,
  fromSiteTheme,
  THEME_INSTRUCTIONS,
  ThemeColorsSpec,
  ThemeOptionSpec,
  ThemeOptionsSpec,
  themeUserPrompt,
  toSiteTheme,
} from "#/builder/ai/theme";
import { buildRoot, buildTree } from "#/builder/core/build";
import { DEFAULT_IDENTITY } from "#/builder/core/theme";
import { ROOT_ID, type SectionTree } from "#/builder/core/tree";
import { miniFooter } from "#/builder/templates/pages/shared";
import { db } from "#/db";
import { page, project } from "#/db/schema";
import { requirePageAccess, requireProjectAccess } from "./access.ts";
import { assertAiQuota, generateStructured, strictSchema } from "./ai-store.ts";
import { authMiddleware } from "./middleware.ts";
import { insertSections, loadSiteSettings, newPageSlug } from "./page-store.ts";

const sectionSchema = strictSchema(SectionSpec);
const planSchema = strictSchema(PagePlanSpec);
const themesSchema = strictSchema(ThemeOptionsSpec);
const SECTION_FAIL = "Não foi possível gerar a seção agora. Tente novamente.";

/* ------------------------------------------------------------------ */
/* Single section (section library)                                    */
/* ------------------------------------------------------------------ */

export const generateSection = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      pageId: z.string(),
      prompt: z.string().trim().min(3).max(2000),
      /** Titles of the sections already on the page. */
      pageOutline: z.array(z.string().max(200)).max(40),
      variation: z
        .number()
        .int()
        .min(0)
        .max(VARIATIONS.length - 1),
    }),
  )
  .handler(async ({ data, context }) => {
    const row = await requirePageAccess(context.user.id, data.pageId);
    await assertAiQuota(context.user.id);
    const { settings } = await loadSiteSettings(row.projectId);
    const spec = await generateStructured({
      tier: "fast",
      schema: sectionSchema,
      instructions: SECTION_INSTRUCTIONS,
      prompt: sectionUserPrompt({
        prompt: data.prompt,
        siteName: settings.identity.name,
        pageName: row.name,
        pageOutline: data.pageOutline,
        variation: data.variation,
      }),
      log: { userId: context.user.id, projectId: row.projectId, kind: "section", prompt: data.prompt },
      failMessage: SECTION_FAIL,
    });
    return { spec };
  });

/* ------------------------------------------------------------------ */
/* Whole page: plan → sections → create                                */
/* ------------------------------------------------------------------ */

/** Outline from the brief (stronger model: structure matters most here). */
export const planPage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ projectId: z.string(), brief: BriefSpec }))
  .handler(async ({ data, context }) => {
    await requireProjectAccess(context.user.id, data.projectId);
    await assertAiQuota(context.user.id);
    const { settings } = await loadSiteSettings(data.projectId);
    const plan = await generateStructured({
      tier: "smart",
      schema: planSchema,
      instructions: PAGE_PLAN_INSTRUCTIONS,
      prompt: planUserPrompt(data.brief, settings.identity.name),
      log: { userId: context.user.id, projectId: data.projectId, kind: "page-plan", prompt: data.brief.business },
      failMessage: "Não foi possível montar o roteiro agora. Tente novamente.",
    });
    return { plan: { ...plan, sections: plan.sections.slice(0, 12) } };
  });

/** 3 visual directions (palette + fonts). Runs alongside `planPage`. */
export const generateThemes = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      projectId: z.string(),
      brief: BriefSpec,
      /** Options already shown ("Nome: primária, fontes"), to get new ones. */
      avoid: z.array(z.string().max(160)).max(12).default([]),
    }),
  )
  .handler(async ({ data, context }) => {
    await requireProjectAccess(context.user.id, data.projectId);
    await assertAiQuota(context.user.id);
    const { settings } = await loadSiteSettings(data.projectId);
    const { options } = await generateStructured({
      tier: "fast",
      schema: themesSchema,
      instructions: THEME_INSTRUCTIONS,
      prompt: themeUserPrompt(briefText(data.brief, settings.identity.name), data.avoid),
      log: { userId: context.user.id, projectId: data.projectId, kind: "page-theme", prompt: data.brief.business },
      failMessage: "Não foi possível criar as opções de tema agora.",
    });
    return {
      options: options.slice(0, 3).map((o) => ({ ...o, colors: fixContrast(o.colors) })),
      current: fromSiteTheme(settings.theme),
    };
  });

/** One outline item. The client calls it in parallel for every section. */
export const generatePageSection = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      projectId: z.string(),
      brief: BriefSpec,
      plan: PagePlanSpec.extend({ sections: PagePlanSpec.shape.sections.max(12) }),
      index: z.number().int().min(0).max(11),
      /** Chosen visual direction, so the copy matches the look. */
      style: z.string().max(300).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await requireProjectAccess(context.user.id, data.projectId);
    const item = data.plan.sections[data.index];
    if (!item) throw new Error("Seção fora do roteiro");
    await assertAiQuota(context.user.id);
    const { settings } = await loadSiteSettings(data.projectId);
    const spec = await generateStructured({
      tier: "fast",
      schema: sectionSchema,
      instructions: SECTION_INSTRUCTIONS,
      prompt: pageSectionUserPrompt(data.brief, settings.identity.name, data.plan, data.index, data.style),
      log: { userId: context.user.id, projectId: data.projectId, kind: "page-section", prompt: item.purpose },
      failMessage: SECTION_FAIL,
    });
    // the outline decides background rhythm and anchors, not each section alone
    return { spec: { ...spec, name: item.name || spec.name, tone: item.tone, anchor: item.anchor } };
  });

/** Creates the page from the generated sections (compiled here, on the server). */
export const createAiPage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      projectId: z.string(),
      name: z.string().trim().min(1).max(120),
      slug: z.string().trim().optional(),
      pageType: BriefSpec.shape.pageType,
      sections: z.array(SectionSpec).min(1).max(12),
      /** Chosen theme option; null keeps the current site theme. */
      theme: ThemeOptionSpec.pick({ fonts: true }).extend({ colors: ThemeColorsSpec }).nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    await requireProjectAccess(context.user.id, data.projectId);
    const slug = await newPageSlug(data.projectId, data.slug, data.name);
    const type = pageTypeOf(data.pageType);
    const { settings } = await loadSiteSettings(data.projectId);
    // the theme is site-wide: every page of the project follows it
    const theme = data.theme
      ? toSiteTheme({ ...data.theme, colors: fixContrast(data.theme.colors) }, settings.theme)
      : settings.theme;
    // a brand-new site still called "Sua marca" takes the business name
    const identity =
      settings.identity.name === DEFAULT_IDENTITY.name ? { ...settings.identity, name: data.name } : settings.identity;
    if (theme !== settings.theme || identity !== settings.identity) {
      await db
        .update(project)
        .set({ settings: { ...settings, theme, identity } })
        .where(eq(project.id, data.projectId));
    }

    const specs = data.sections.map(compileSection);
    // focus pages have no site footer: close with a simple copyright line
    if (type.footerMode === "none") {
      const brand = settings.identity.name || data.name;
      specs.push(miniFooter(`© ${new Date().getFullYear()} ${brand}. Todos os direitos reservados.`));
    }
    const sections: SectionTree[] = specs.map((spec) => {
      const tree = buildTree(spec, ROOT_ID);
      return { ...tree, kind: "section", name: spec.name ?? spec.type, isGlobal: false };
    });

    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(page)
        .values({
          projectId: data.projectId,
          name: data.name,
          slug,
          root: buildRoot(),
          seo: { title: data.name },
          headerMode: type.headerMode,
          footerMode: type.footerMode,
        })
        .returning({ id: page.id });
      await insertSections(tx, data.projectId, created.id, sections);
      return created;
    });
  });
