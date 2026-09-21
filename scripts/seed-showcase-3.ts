/**
 * Página "vitrine-3" com barra de aviso e contadores numéricos.
 * Uso: pnpm tsx --env-file=.env.local scripts/seed-showcase-3.ts <projectId>
 */
import { and, eq } from "drizzle-orm";
import { buildRoot, buildTree, h } from "#/builder/core/build.ts";
import { ROOT_ID, type SectionTree } from "#/builder/core/tree.ts";
import { CONTENT_TEMPLATES } from "#/builder/templates/content.ts";
import { db } from "#/db/index.ts";
import { page, pageSection } from "#/db/schema/index.ts";
import { insertSections, publishPageById } from "#/server/page-store.ts";

const projectId = process.argv[2];
if (!projectId) throw new Error("Informe o projectId");

const toSection = (spec: ReturnType<typeof h>, name: string): SectionTree => {
	const tree = buildTree(spec, ROOT_ID);
	return { rootNodeId: tree.rootNodeId, kind: "section", name, isGlobal: false, nodes: tree.nodes };
};
const stats = CONTENT_TEMPLATES.find((t) => t.id === "stats-4");
if (!stats) throw new Error("stats-4");
const sections: SectionTree[] = [
	toSection(h("AnnouncementBar", { sticky: true }, [], "Barra de aviso"), "Barra de aviso"),
	toSection(stats.build(), "Números"),
	toSection(h("Section", { minHeight: { desktop: "120vh" } }, [h("Heading", { text: "Role para ver a barra fixa" })], "Espaço"), "Espaço"),
];

const existing = await db.query.page.findFirst({
	where: and(eq(page.projectId, projectId), eq(page.slug, "vitrine-3")),
});
if (existing) {
	await db.delete(pageSection).where(eq(pageSection.pageId, existing.id));
	await db.delete(page).where(eq(page.id, existing.id));
}
const created = await db.transaction(async (tx) => {
	const [row] = await tx
		.insert(page)
		.values({ projectId, name: "Vitrine 3: números e aviso", slug: "vitrine-3", root: buildRoot(), seo: { title: "Vitrine 3" } })
		.returning({ id: page.id });
	await insertSections(tx, projectId, row.id, sections);
	return row;
});
console.log(JSON.stringify({ pageId: created.id, ...(await publishPageById(created.id)) }));
process.exit(0);
