/**
 * Acesso a dados de páginas e seções, só no servidor. Fica fora de pages.ts
 * porque funções de módulo que usam o `db` impediriam o compilador de
 * remover o driver do Postgres do bundle do navegador.
 */
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { normalizeSiteSettings, type SiteSettings } from "#/builder/core/theme";
import {
	isTopBar,
	mergePage,
	type SectionTree,
	type SitePart,
} from "#/builder/core/tree";
import { renderPageHtml } from "#/builder/renderer/render-page";
import {
	buildPageTemplate,
	type PageTemplate,
} from "#/builder/templates/pages";
import { db } from "#/db";
import { page, pageSection, project, section } from "#/db/schema";

export const publicPagePath = (projectSlug: string, pageSlug: string) =>
	`/p/${projectSlug}/${pageSlug}`;

type PageRow = typeof page.$inferSelect;

/** Configurações do site (tema, identidade, cabeçalho/rodapé padrão). */
export async function loadSiteSettings(projectId: string) {
	const row = await db.query.project.findFirst({
		where: eq(project.id, projectId),
	});
	if (!row) throw new Error("Projeto não encontrado");
	return { project: row, settings: normalizeSiteSettings(row.settings) };
}

/** Seção de cabeçalho/rodapé do site, marcada como parte do site. */
export async function loadSitePart(
	projectId: string,
	sectionId: string | null,
	part: SitePart,
): Promise<SectionTree | null> {
	if (!sectionId) return null;
	const row = await db.query.section.findFirst({
		where: and(eq(section.id, sectionId), eq(section.projectId, projectId)),
	});
	if (!row) return null;
	return {
		rootNodeId: row.rootNodeId,
		kind: row.kind,
		name: row.name,
		isGlobal: true,
		sitePart: part,
		nodes: row.nodes,
	};
}

/**
 * Seções da página na ordem de exibição, incluindo o cabeçalho e o rodapé do
 * site quando a página usa o padrão.
 */
export async function loadPageSections(row: PageRow, settings: SiteSettings) {
	const [own, header, footer] = await Promise.all([
		loadSections(row.id),
		row.headerMode === "site"
			? loadSitePart(row.projectId, settings.headerSectionId, "header")
			: null,
		row.footerMode === "site"
			? loadSitePart(row.projectId, settings.footerSectionId, "footer")
			: null,
	]);
	// barras de aviso ficam acima do cabeçalho do site
	return [
		...own.filter(isTopBar),
		...(header ? [header] : []),
		...own.filter((s) => !isTopBar(s)),
		...(footer ? [footer] : []),
	];
}

/**
 * HTML de prévia de um modelo de página com o tema, a identidade e o
 * cabeçalho/rodapé do projeto (sem salvar nada).
 */
export async function renderTemplatePreview(
	projectId: string,
	template: PageTemplate,
) {
	const { project: proj, settings } = await loadSiteSettings(projectId);
	const tree = buildPageTemplate(template);
	const [header, footer] = await Promise.all([
		template.headerMode === "site"
			? loadSitePart(projectId, settings.headerSectionId, "header")
			: null,
		template.footerMode === "site"
			? loadSitePart(projectId, settings.footerSectionId, "footer")
			: null,
	]);
	const own = tree.sections;
	const sections = [
		...own.filter(isTopBar),
		...(header ? [header] : []),
		...own.filter((s) => !isTopBar(s)),
		...(footer ? [footer] : []),
	];
	return renderPageHtml({
		pageId: "preview",
		nodes: mergePage(tree.root, sections),
		seo: { title: template.name },
		tracking: {},
		// a prévia não mostra o aviso de cookies
		site: {
			...settings,
			cookieBanner: { ...settings.cookieBanner, enabled: false },
		},
		homeUrl: `/p/${proj.slug}`,
		pageUrl: () => "#",
		formEndpoint: "#",
		viewEndpoint: "#",
	});
}

export async function publishPageById(pageId: string) {
	const row = await db.query.page.findFirst({ where: eq(page.id, pageId) });
	if (!row) throw new Error("Página não encontrada");
	const { project: proj, settings } = await loadSiteSettings(row.projectId);
	const [sections, siblings] = await Promise.all([
		loadPageSections(row, settings),
		db
			.select({ id: page.id, slug: page.slug })
			.from(page)
			.where(and(eq(page.projectId, row.projectId), isNull(page.deletedAt))),
	]);
	const projectSlug = proj.slug;
	const slugs = new Map(siblings.map((s) => [s.id, s.slug]));
	const html = renderPageHtml({
		pageId: row.id,
		nodes: mergePage(row.root, sections),
		seo: row.seo,
		tracking: row.tracking,
		site: settings,
		homeUrl: `/p/${projectSlug}`,
		pageUrl: (id) => {
			const slug = slugs.get(id);
			return slug ? publicPagePath(projectSlug, slug) : "#";
		},
		formEndpoint: `/api/forms/${row.id}`,
		viewEndpoint: `/api/views/${row.id}`,
	});
	const [updated] = await db
		.update(page)
		.set({ publishedHtml: html, status: "published", publishedAt: new Date() })
		.where(eq(page.id, row.id))
		.returning({ publishedAt: page.publishedAt, slug: page.slug });
	return {
		publishedAt: updated.publishedAt?.toISOString() ?? null,
		url: publicPagePath(projectSlug, updated.slug),
	};
}

/** Republica todas as páginas publicadas do projeto (ex.: depois de mudar o tema). */
export async function republishProject(projectId: string) {
	const rows = await db
		.select({ id: page.id })
		.from(page)
		.where(
			and(
				eq(page.projectId, projectId),
				eq(page.status, "published"),
				isNull(page.deletedAt),
			),
		);
	for (const r of rows) await publishPageById(r.id);
	return rows.length;
}

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function uniqueSlug(projectId: string, base: string) {
	let slug = base;
	for (let i = 2; ; i++) {
		const taken = await db.query.page.findFirst({
			where: and(
				eq(page.projectId, projectId),
				eq(page.slug, slug),
				isNull(page.deletedAt),
			),
		});
		if (!taken) return slug;
		slug = `${base}-${i}`;
	}
}

export async function loadSections(pageId: string): Promise<SectionTree[]> {
	const rows = await db
		.select({
			rootNodeId: section.rootNodeId,
			kind: section.kind,
			name: section.name,
			isGlobal: section.isGlobal,
			nodes: section.nodes,
		})
		.from(pageSection)
		.innerJoin(section, eq(section.id, pageSection.sectionId))
		.where(eq(pageSection.pageId, pageId))
		.orderBy(asc(pageSection.position));
	return rows;
}

export async function upsertSections(
	tx: Tx,
	projectId: string,
	sections: SectionTree[],
) {
	const sectionIds: string[] = [];
	const touchedGlobalIds: string[] = [];
	const existing = sections.length
		? await tx
				.select({
					id: section.id,
					rootNodeId: section.rootNodeId,
					isGlobal: section.isGlobal,
				})
				.from(section)
				.where(
					and(
						eq(section.projectId, projectId),
						inArray(
							section.rootNodeId,
							sections.map((s) => s.rootNodeId),
						),
					),
				)
		: [];
	const byRoot = new Map(existing.map((e) => [e.rootNodeId, e]));

	for (const s of sections) {
		const found = byRoot.get(s.rootNodeId);
		if (found) {
			await tx
				.update(section)
				.set({
					kind: s.kind,
					name: s.name,
					nodes: s.nodes,
					isGlobal: s.isGlobal,
				})
				.where(eq(section.id, found.id));
			if (s.isGlobal || found.isGlobal) touchedGlobalIds.push(found.id);
			sectionIds.push(found.id);
		} else {
			const [created] = await tx
				.insert(section)
				.values({
					projectId,
					kind: s.kind,
					name: s.name,
					rootNodeId: s.rootNodeId,
					nodes: s.nodes,
					isGlobal: s.isGlobal,
				})
				.returning({ id: section.id });
			sectionIds.push(created.id);
		}
	}
	return { sectionIds, touchedGlobalIds };
}

export async function insertSections(
	tx: Tx,
	projectId: string,
	pageId: string,
	sections: SectionTree[],
) {
	const { sectionIds } = await upsertSections(tx, projectId, sections);
	if (sectionIds.length) {
		await tx.insert(pageSection).values(
			sectionIds.map((sectionId, position) => ({
				pageId,
				sectionId,
				position,
			})),
		);
	}
}

/** Remove seções que não são globais e não estão em nenhuma página. */
export async function deleteOrphanSections(tx: Tx, candidateIds: string[]) {
	if (!candidateIds.length) return;
	await tx
		.delete(section)
		.where(
			and(
				inArray(section.id, candidateIds),
				eq(section.isGlobal, false),
				sql`not exists (select 1 from ${pageSection} where ${pageSection.sectionId} = ${section.id})`,
			),
		);
}
