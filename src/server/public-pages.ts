/**
 * Entrega das páginas publicadas (HTML gerado na publicação), sitemap e
 * robots.txt. Só servidor.
 */
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { normalizeSiteSettings } from "#/builder/core/theme";
import { db } from "#/db";
import { page, project } from "#/db/schema";

const HTML = { "Content-Type": "text/html; charset=utf-8" };

const esc = (s: string) =>
	s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

/** Página 404 padrão: simples, neutra e com link para o início do site. */
function defaultNotFound(homeHref: string | null) {
	return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Página não encontrada</title>
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#fafafa;color:#18181b}main{max-width:440px;text-align:center}b{display:block;font-size:72px;line-height:1;letter-spacing:-.04em;color:#d4d4d8}h1{margin:16px 0 8px;font-size:24px}p{margin:0 0 24px;color:#52525b;line-height:1.6}a{display:inline-block;padding:12px 22px;border-radius:10px;background:#18181b;color:#fff;text-decoration:none;font-weight:600}</style></head>
<body><main><b>404</b><h1>Página não encontrada</h1><p>O endereço pode ter mudado ou a página não está mais no ar.</p>${homeHref ? `<a href="${esc(homeHref)}">Ir para o início</a>` : ""}</main></body></html>`;
}

const notFound = (html: string) =>
	new Response(html, { status: 404, headers: HTML });

export function notFoundResponse() {
	return notFound(defaultNotFound(null));
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

async function publishedPages(projectId: string) {
	return db
		.select({
			id: page.id,
			slug: page.slug,
			html: page.publishedHtml,
			seo: page.seo,
			publishedAt: page.publishedAt,
		})
		.from(page)
		.where(published(projectId))
		.orderBy(asc(page.createdAt));
}

type Row = Awaited<ReturnType<typeof publishedPages>>[number];

/**
 * Página inicial publicada: a escolhida nas configurações; senão
 * "home"/"inicio"; senão a publicada mais antiga.
 */
function pickHome(rows: Row[], homePageId: string | null) {
	return (
		rows.find((r) => r.id === homePageId) ??
		rows.find((r) => r.slug === "home" || r.slug === "inicio") ??
		rows[0]
	);
}

/** Responde /p/:projeto (página inicial) e /p/:projeto/:pagina. */
export async function servePublished(projectSlug: string, pageSlug?: string) {
	const proj = await db.query.project.findFirst({
		where: eq(project.slug, projectSlug),
	});
	if (!proj) return notFoundResponse();
	const settings = normalizeSiteSettings(proj.settings);
	const rows = await publishedPages(proj.id);
	const found = pageSlug
		? rows.find((r) => r.slug === pageSlug)
		: pickHome(rows, settings.homePageId);
	if (found?.html) return htmlResponse(found.html);
	// 404: a página escolhida pelo projeto ou a padrão
	const custom = rows.find((r) => r.id === settings.notFoundPageId);
	if (custom?.html) return notFound(custom.html);
	return notFound(defaultNotFound(rows.length ? `/p/${proj.slug}` : null));
}

/** sitemap.xml do projeto: páginas publicadas que podem ser indexadas. */
export async function serveSitemap(projectSlug: string, origin: string) {
	const proj = await db.query.project.findFirst({
		where: eq(project.slug, projectSlug),
	});
	if (!proj) return new Response("Not found", { status: 404 });
	const settings = normalizeSiteSettings(proj.settings);
	const rows = (await publishedPages(proj.id)).filter(
		(r) => !r.seo?.noIndex && r.id !== settings.notFoundPageId,
	);
	const home = pickHome(rows, settings.homePageId);
	const urls = rows.map((r) => {
		const loc =
			r.id === home?.id
				? `${origin}/p/${proj.slug}`
				: `${origin}/p/${proj.slug}/${r.slug}`;
		const lastmod = r.publishedAt
			? `<lastmod>${r.publishedAt.toISOString()}</lastmod>`
			: "";
		return `<url><loc>${esc(loc)}</loc>${lastmod}</url>`;
	});
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
		{
			headers: {
				"Content-Type": "application/xml; charset=utf-8",
				"Cache-Control": "public, max-age=0, s-maxage=300",
			},
		},
	);
}

/** robots.txt do domínio: libera as páginas publicadas e esconde o app. */
export async function serveRobots(origin: string) {
	const projects = await db
		.selectDistinct({ slug: project.slug })
		.from(project)
		.innerJoin(page, eq(page.projectId, project.id))
		.where(and(isNull(page.deletedAt), isNotNull(page.publishedHtml)));
	const lines = [
		"User-agent: *",
		"Allow: /p/",
		"Disallow: /projects",
		"Disallow: /editor",
		"Disallow: /api/",
		"Disallow: /login",
		"Disallow: /signup",
		"",
		...projects.map((p) => `Sitemap: ${origin}/p/${p.slug}/sitemap.xml`),
	];
	return new Response(`${lines.join("\n")}\n`, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=0, s-maxage=3600",
		},
	});
}
