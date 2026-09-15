/**
 * Acesso a dados de páginas e seções, só no servidor. Fica fora de pages.ts
 * porque funções de módulo que usam o `db` impediriam o compilador de
 * remover o driver do Postgres do bundle do navegador.
 */
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { mergePage, type SectionTree } from "#/builder/core/tree";
import { renderPageHtml } from "#/builder/renderer/render-page";
import { db } from "#/db";
import { page, pageSection, project, section } from "#/db/schema";

export const publicPagePath = (projectSlug: string, pageSlug: string) =>
	`/p/${projectSlug}/${pageSlug}`;

export async function publishPageById(pageId: string) {
	const row = await db.query.page.findFirst({ where: eq(page.id, pageId) });
	if (!row) throw new Error("Página não encontrada");
	const [proj, sections, siblings] = await Promise.all([
		db.query.project.findFirst({ where: eq(project.id, row.projectId) }),
		loadSections(row.id),
		db
			.select({ id: page.id, slug: page.slug })
			.from(page)
			.where(and(eq(page.projectId, row.projectId), isNull(page.deletedAt))),
	]);
	const projectSlug = proj?.slug ?? "";
	const slugs = new Map(siblings.map((s) => [s.id, s.slug]));
	const html = renderPageHtml({
		pageId: row.id,
		nodes: mergePage(row.root, sections),
		seo: row.seo,
		tracking: row.tracking,
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
