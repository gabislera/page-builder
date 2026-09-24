/**
 * "vitrine-2" page with content and interactive components (accordion,
 * tabs, carousel, cards, pricing, testimonials, and gallery).
 * Usage: pnpm tsx --env-file=.env.local scripts/seed-showcase-2.ts <projectId>
 */
import { and, eq } from "drizzle-orm";
import { buildRoot, buildTree } from "#/builder/core/build.ts";
import { ROOT_ID, type SectionTree } from "#/builder/core/tree.ts";
import { CONTENT_TEMPLATES } from "#/builder/templates/content.ts";
import { INTERACTIVE_TEMPLATES } from "#/builder/templates/interactive.ts";
import { db } from "#/db/index.ts";
import { page, pageSection } from "#/db/schema/index.ts";
import { insertSections, publishPageById } from "#/server/page-store.ts";

const projectId = process.argv[2];
if (!projectId) throw new Error("Informe o projectId");

const ids = [
	"carousel-hero",
	"cards-3",
	"tabs-image-text",
	"pricing-3",
	"testimonials-cards-3",
	"carousel-cards",
	"gallery-grid",
	"faq-accordion",
];
const all = [...CONTENT_TEMPLATES, ...INTERACTIVE_TEMPLATES];
const sections: SectionTree[] = ids.map((id) => {
	const t = all.find((x) => x.id === id);
	if (!t) throw new Error(`Modelo não encontrado: ${id}`);
	const tree = buildTree(t.build(), ROOT_ID);
	return { rootNodeId: tree.rootNodeId, kind: "section", name: t.name, isGlobal: false, nodes: tree.nodes };
});

const existing = await db.query.page.findFirst({
	where: and(eq(page.projectId, projectId), eq(page.slug, "vitrine-2")),
});
if (existing) {
	await db.delete(pageSection).where(eq(pageSection.pageId, existing.id));
	await db.delete(page).where(eq(page.id, existing.id));
}
const created = await db.transaction(async (tx) => {
	const [row] = await tx
		.insert(page)
		.values({ projectId, name: "Vitrine 2: conteúdo", slug: "vitrine-2", root: buildRoot(), seo: { title: "Vitrine 2" } })
		.returning({ id: page.id });
	await insertSections(tx, projectId, row.id, sections);
	return row;
});
console.log(JSON.stringify({ pageId: created.id, ...(await publishPageById(created.id)) }));
process.exit(0);
