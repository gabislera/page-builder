/**
 * Leads (envios de formulário) e visitas das páginas publicadas, por projeto.
 */
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { formSubmission, page, pageView } from "#/db/schema";
import { requireProjectAccess } from "./access.ts";
import { authMiddleware } from "./middleware.ts";

/** Dias agrupados no horário de Brasília. */
const TZ = "America/Sao_Paulo";
/**
 * O fuso vai literal no SQL (é constante): como parâmetro, o SELECT e o
 * GROUP BY viram $1 e $2 e o Postgres não os reconhece como a mesma coluna.
 */
const TZ_SQL = sql.raw(`'${TZ}'`);
const PAGE_SIZE = 50;

const since = (days: number | null) => (days ? new Date(Date.now() - days * 86_400_000) : null);

/* ------------------------------------------------------------------ */
/* Leads                                                               */
/* ------------------------------------------------------------------ */

const leadFilters = z.object({
  projectId: z.string(),
  pageId: z.string().optional(),
  formName: z.string().optional(),
  /** Últimos N dias; vazio = tudo. */
  days: z.number().int().positive().max(3650).optional(),
  q: z.string().trim().max(200).optional(),
});

type LeadFilters = z.infer<typeof leadFilters>;

function leadWhere(f: LeadFilters) {
  const from = since(f.days ?? null);
  return and(
    eq(formSubmission.projectId, f.projectId),
    f.pageId ? eq(formSubmission.pageId, f.pageId) : undefined,
    f.formName ? eq(formSubmission.formName, f.formName) : undefined,
    from ? gte(formSubmission.createdAt, from) : undefined,
    f.q ? sql`${formSubmission.data}::text ilike ${`%${f.q.replace(/[%_]/g, "\\$&")}%`}` : undefined,
  );
}

/** Campos mais comuns primeiro, na ordem em que costumam aparecer. */
const PREFERRED = ["nome", "name", "email", "e_mail", "whatsapp", "telefone", "phone"];
function orderColumns(keys: Iterable<string>) {
  const all = [...new Set(keys)].filter((k) => !/^(utm_|fbclid|gclid|tags$)/.test(k));
  return all.sort((a, b) => {
    const ia = PREFERRED.indexOf(a);
    const ib = PREFERRED.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.localeCompare(b);
  });
}

/** Origem do lead: utm_source ou o domínio de quem indicou. */
function leadSource(data: Record<string, string>) {
  return data.utm_source || null;
}

export const listLeads = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(leadFilters.extend({ offset: z.number().int().min(0).default(0) }))
  .handler(async ({ data, context }) => {
    await requireProjectAccess(context.user.id, data.projectId);
    const where = leadWhere(data);
    const [rows, [{ total }], forms, pages] = await Promise.all([
      db
        .select({
          id: formSubmission.id,
          pageId: formSubmission.pageId,
          pageName: page.name,
          formName: formSubmission.formName,
          data: formSubmission.data,
          meta: formSubmission.meta,
          createdAt: formSubmission.createdAt,
        })
        .from(formSubmission)
        .innerJoin(page, eq(page.id, formSubmission.pageId))
        .where(where)
        .orderBy(desc(formSubmission.createdAt), desc(formSubmission.id))
        .limit(PAGE_SIZE + 1)
        .offset(data.offset),
      db.select({ total: sql<number>`count(*)::int` }).from(formSubmission).where(where),
      db
        .selectDistinct({ formName: formSubmission.formName })
        .from(formSubmission)
        .where(eq(formSubmission.projectId, data.projectId)),
      db
        .select({ id: page.id, name: page.name })
        .from(page)
        .where(and(eq(page.projectId, data.projectId), isNull(page.deletedAt)))
        .orderBy(page.name),
    ]);
    const more = rows.length > PAGE_SIZE;
    const str = (v: unknown) => (typeof v === "string" ? v : null);
    const items = rows.slice(0, PAGE_SIZE).map(({ meta, ...r }) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      source: leadSource(r.data),
      /** Endereço de onde o formulário foi enviado (com UTMs). */
      url: str(meta.url),
      userAgent: str(meta.ua),
    }));
    return {
      items,
      total,
      nextOffset: more ? data.offset + PAGE_SIZE : null,
      columns: orderColumns(items.flatMap((i) => Object.keys(i.data))),
      forms: forms.map((f) => f.formName).sort(),
      pages,
    };
  });

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // evita que planilhas executem fórmulas vindas do formulário
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** CSV (separado por ";", como o Excel em português espera). */
export const exportLeadsCsv = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(leadFilters)
  .handler(async ({ data, context }) => {
    await requireProjectAccess(context.user.id, data.projectId);
    const rows = await db
      .select({
        pageName: page.name,
        formName: formSubmission.formName,
        data: formSubmission.data,
        createdAt: formSubmission.createdAt,
      })
      .from(formSubmission)
      .innerJoin(page, eq(page.id, formSubmission.pageId))
      .where(leadWhere(data))
      .orderBy(desc(formSubmission.createdAt))
      .limit(50_000);
    const fields = [...new Set(rows.flatMap((r) => Object.keys(r.data)))];
    const columns = [...orderColumns(fields), ...fields.filter((k) => /^(utm_|fbclid|gclid|tags$)/.test(k)).sort()];
    const header = ["Data", "Página", "Formulário", ...columns];
    const lines = rows.map((r) =>
      [r.createdAt.toLocaleString("pt-BR", { timeZone: TZ }), r.pageName, r.formName, ...columns.map((c) => r.data[c])]
        .map(csvCell)
        .join(";"),
    );
    // BOM: o Excel reconhece acentos
    return `﻿${[header.map(csvCell).join(";"), ...lines].join("\r\n")}`;
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ projectId: z.string(), id: z.string() }))
  .handler(async ({ data, context }) => {
    await requireProjectAccess(context.user.id, data.projectId);
    await db
      .delete(formSubmission)
      .where(and(eq(formSubmission.id, data.id), eq(formSubmission.projectId, data.projectId)));
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Visitas                                                             */
/* ------------------------------------------------------------------ */

const HOST_NOISE = new Set(["www", "m", "l", "lm", "mobile", "com", "br", "net", "org", "co"]);

/**
 * Nome de quem indicou, no mesmo formato do utm_source: "l.instagram.com" e
 * "www.google.com.br" viram "instagram" e "google".
 */
function refHost(ref: unknown): string | null {
  if (typeof ref !== "string" || !ref) return null;
  try {
    const parts = new URL(ref).hostname.split(".").filter((p) => !HOST_NOISE.has(p));
    return parts[parts.length - 1] ?? null;
  } catch {
    return null;
  }
}

export const getInsights = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      projectId: z.string(),
      days: z.number().int().positive().max(365),
      pageId: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    await requireProjectAccess(context.user.id, data.projectId);
    const from = since(data.days) as Date;
    const pagesOfProject = and(eq(page.projectId, data.projectId), data.pageId ? eq(page.id, data.pageId) : undefined);
    const viewDay = sql<string>`to_char(${pageView.createdAt} at time zone ${TZ_SQL}, 'YYYY-MM-DD')`;
    const leadDay = sql<string>`to_char(${formSubmission.createdAt} at time zone ${TZ_SQL}, 'YYYY-MM-DD')`;

    const [viewsByDay, leadsByDay, byPage, leadsByPage, metas] = await Promise.all([
      db
        .select({ day: viewDay, n: sql<number>`count(*)::int` })
        .from(pageView)
        .innerJoin(page, eq(page.id, pageView.pageId))
        .where(and(pagesOfProject, gte(pageView.createdAt, from)))
        .groupBy(viewDay),
      db
        .select({ day: leadDay, n: sql<number>`count(*)::int` })
        .from(formSubmission)
        .innerJoin(page, eq(page.id, formSubmission.pageId))
        .where(and(pagesOfProject, gte(formSubmission.createdAt, from)))
        .groupBy(leadDay),
      db
        .select({
          id: page.id,
          name: page.name,
          slug: page.slug,
          status: page.status,
          views: sql<number>`count(${pageView.id})::int`,
        })
        .from(page)
        .leftJoin(pageView, and(eq(pageView.pageId, page.id), gte(pageView.createdAt, from)))
        .where(and(pagesOfProject, isNull(page.deletedAt)))
        .groupBy(page.id),
      db
        .select({
          pageId: formSubmission.pageId,
          n: sql<number>`count(*)::int`,
        })
        .from(formSubmission)
        .innerJoin(page, eq(page.id, formSubmission.pageId))
        .where(and(pagesOfProject, gte(formSubmission.createdAt, from)))
        .groupBy(formSubmission.pageId),
      // origens e dispositivos: poucos campos de cada visita do período
      db
        .select({ meta: pageView.meta })
        .from(pageView)
        .innerJoin(page, eq(page.id, pageView.pageId))
        .where(and(pagesOfProject, gte(pageView.createdAt, from)))
        .orderBy(desc(pageView.createdAt))
        .limit(100_000),
    ]);

    // série diária completa (dias sem visita aparecem com zero)
    const views = new Map(viewsByDay.map((r) => [r.day, r.n]));
    const leads = new Map(leadsByDay.map((r) => [r.day, r.n]));
    const daily: { day: string; views: number; leads: number }[] = [];
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
    for (let i = data.days - 1; i >= 0; i--) {
      const day = fmt.format(new Date(Date.now() - i * 86_400_000));
      daily.push({
        day,
        views: views.get(day) ?? 0,
        leads: leads.get(day) ?? 0,
      });
    }

    const leadCount = new Map(leadsByPage.map((r) => [r.pageId, r.n]));
    const pages = byPage
      .map((p) => ({ ...p, leads: leadCount.get(p.id) ?? 0 }))
      .filter((p) => p.views > 0 || p.leads > 0 || p.status === "published")
      .sort((a, b) => b.views - a.views || b.leads - a.leads);

    const sources = new Map<string, number>();
    let mobile = 0;
    let desktop = 0;
    for (const { meta } of metas) {
      const query = (meta.query ?? {}) as Record<string, string>;
      const source = (query.utm_source || refHost(meta.ref))?.toLowerCase() || "Direto";
      sources.set(source, (sources.get(source) ?? 0) + 1);
      const w = Number(meta.width);
      if (w && w < 768) mobile++;
      else desktop++;
    }

    const totalViews = daily.reduce((s, d) => s + d.views, 0);
    const totalLeads = daily.reduce((s, d) => s + d.leads, 0);
    return {
      totals: {
        views: totalViews,
        leads: totalLeads,
        conversion: totalViews ? totalLeads / totalViews : 0,
      },
      daily,
      pages,
      sources: [...sources.entries()]
        .map(([source, n]) => ({ source, views: n }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8),
      devices: { mobile, desktop },
    };
  });
