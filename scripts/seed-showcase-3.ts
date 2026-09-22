/**
 * Página "vitrine-3" com barra de aviso, contadores e formulário em etapas.
 * Uso: pnpm tsx --env-file=.env.local scripts/seed-showcase-3.ts <projectId>
 */
import { and, eq } from "drizzle-orm";
import { buildRoot, buildTree, h } from "#/builder/core/build.ts";
import { multiStepFormProps } from "#/builder/components/form.tsx";
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
	toSection(
		h(
			"Section",
			{},
			[
				h("Heading", { text: "Antes e depois, mapa e compartilhar" }),
				h("BeforeAfter", {}, [], "Antes e depois"),
				h("ShareButtons", {}, [], "Compartilhar"),
				h("ShareButtons", { layout: "buttons", label: "", shape: "rounded", items: [{ id: "a", network: "whatsapp" }, { id: "b", network: "copy" }, { id: "c", network: "native" }] }, [], "Compartilhar (botões)"),
				h("Map", {}, [], "Mapa"),
			],
			"Mídia e compartilhar",
		),
		"Mídia e compartilhar",
	),
	toSection(
		h("Section", {}, [h("Form", { ...multiStepFormProps(), box: { maxWidth: { desktop: "560px" } } }, [], "Formulário em etapas")], "Formulário em etapas"),
		"Formulário em etapas",
	),
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
		.values({ projectId, name: "Vitrine 3: números e aviso", slug: "vitrine-3", root: buildRoot(), seo: { title: "Vitrine 3" }, tracking: { facebookPixelId: "000000000000001", bodyScripts: "<script>window.__pbBodyScript=1</script>" } })
		.returning({ id: page.id });
	await insertSections(tx, projectId, row.id, sections);
	return row;
});
console.log(JSON.stringify({ pageId: created.id, ...(await publishPageById(created.id)) }));
process.exit(0);
