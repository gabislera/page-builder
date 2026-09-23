/**
 * Entrega das páginas publicadas (HTML gerado na publicação). Só servidor.
 */
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { normalizeSiteSettings } from "#/builder/core/theme";
import { db } from "#/db";
import { page, project } from "#/db/schema";

const HTML = { "Content-Type": "text/html; charset=utf-8" };

export function notFoundResponse() {
	return new Response(
		"<!doctype html><title>Página não encontrada</title><h1>Página não encontrada</h1>",
		{ status: 404, headers: HTML },
	);
}

function htmlResponse(html: string) {
	return new Response(html, {
		headers: {
			...HTML,
			"Cache-Control":
				"public, max-age=0, s-maxage=60, stale-while-revalidate=300",
		},
	});
}

const published = (projectId: string) =>
	and(
		eq(page.projectId, projectId),
		isNull(page.deletedAt),
		isNotNull(page.publishedHtml),
	);

/**
 * Página inicial publicada do projeto: a escolhida nas configurações; senão
 * "home"/"inicio"; senão a publicada mais antiga.
 */
async function homeHtml(projectId: string, homePageId: string | null) {
	const rows = await db
		.select({ id: page.id, slug: page.slug, html: page.publishedHtml })
		.from(page)
		.where(published(projectId))
		.orderBy(asc(page.createdAt));
	const pick =
		rows.find((r) => r.id === homePageId) ??
		rows.find((r) => r.slug === "home" || r.slug === "inicio") ??
		rows[0];
	return pick?.html ?? null;
}

/** Responde /p/:projeto (página inicial) e /p/:projeto/:pagina. */
export async function servePublished(projectSlug: string, pageSlug?: string) {
	const proj = await db.query.project.findFirst({
		where: eq(project.slug, projectSlug),
	});
	if (!proj) return notFoundResponse();
	if (!pageSlug) {
		const settings = normalizeSiteSettings(proj.settings);
		const html = await homeHtml(proj.id, settings.homePageId);
		return html ? htmlResponse(html) : notFoundResponse();
	}
	const row = await db.query.page.findFirst({
		where: and(published(proj.id), eq(page.slug, pageSlug)),
		columns: { publishedHtml: true },
	});
	return row?.publishedHtml
		? htmlResponse(row.publishedHtml)
		: notFoundResponse();
}
