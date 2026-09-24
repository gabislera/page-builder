/**
 * Create (or recreate) the "vitrine" page with every component, for manual
 * visual testing. Usage: pnpm tsx --env-file=.env.local scripts/seed-showcase.ts <projectId>
 */
import { and, eq } from "drizzle-orm";
import { containerPresets } from "#/builder/components/container.tsx";
import { buildRoot, buildTree, h } from "#/builder/core/build.ts";
import { corners, defaultBackground } from "#/builder/core/defaults.ts";
import { responsive } from "#/builder/core/responsive.ts";
import { ROOT_ID, type SectionTree } from "#/builder/core/tree.ts";
import { HEADER_FOOTER_TEMPLATES } from "#/builder/templates/headers-footers.ts";
import { SECTION_TEMPLATES } from "#/builder/templates/sections.ts";
import { db } from "#/db/index.ts";
import { page, pageSection, project } from "#/db/schema/index.ts";
import {
	insertSections,
	publishPageById,
	upsertSections,
} from "#/server/page-store.ts";

const projectId = process.argv[2];
if (!projectId) throw new Error("Informe o projectId");

const tpl = (id: string) => {
	const t = [...HEADER_FOOTER_TEMPLATES, ...SECTION_TEMPLATES].find((x) => x.id === id);
	if (!t) throw new Error(id);
	return t;
};

const section = (spec: ReturnType<typeof h>, kind: SectionTree["kind"], name: string): SectionTree => {
	const tree = buildTree(spec, ROOT_ID);
	return { rootNodeId: tree.rootNodeId, kind, name, isGlobal: false, nodes: tree.nodes };
};

// site header and footer (shown on every page that uses the default)
const siteHeader = section(tpl("header-menu-right").build(), "header", "Cabeçalho do site");
const siteFooter = section(tpl("footer-columns").build(), "footer", "Rodapé do site");

const sections: SectionTree[] = [
	section(tpl("hero-split").build(), "section", "Hero"),
	section(
		h("Section", { gap: responsive("32px") }, [
			h("Heading", { text: "Vídeo e perguntas", typography: { textAlign: responsive("center") } }),
			h("Container", { display: responsive("grid"), columns: responsive(2, undefined, 1), gap: responsive("32px") }, [
				h("Video", { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }),
				h("Faq"),
			]),
		]),
		"section",
		"Vídeo + FAQ",
	),
	section(
		h("Section", { background: defaultBackground({ type: "color", color: "#f4f4f5" }), gap: responsive("24px"), alignItems: responsive("center") }, [
			h("Heading", { text: "Oferta por tempo limitado", typography: { textAlign: responsive("center") } }),
			h("Countdown"),
			h("ProgressBar"),
			h("Container", { background: defaultBackground({ type: "color", color: "#ffffff" }), border: { radius: responsive(corners("16px")) }, box: { maxWidth: responsive("560px"), padding: responsive({ top: "32px", right: "32px", bottom: "32px", left: "32px" }) } }, [
				h("Form"),
			]),
		]),
		"section",
		"Conversão",
	),
	section(
		h("Section", { gap: responsive("16px"), alignItems: responsive("center") }, [
			h("Button", { text: "Abrir pop-up", box: { alignSelf: responsive("center") } }),
			h("Modal", {}, [h("Heading", { text: "Pop-up de teste", tag: "h3" }), h("Text")]),
			h("Html"),
			h("Divider"),
			h("Spacer"),
			h("FloatingButtons"),
		]),
		"section",
		"Avançado",
	),
	section(
		h("Section", { gap: responsive("32px") }, [
			h("Heading", { text: "Ícones e colunas livres", typography: { textAlign: responsive("center") } }),
			h("Container", containerPresets.grid(2, "1fr 2fr"), [
				h("Container", containerPresets.stack, [
					h("Icon", { icon: { name: "rocket" } }),
					h("IconList"),
				]),
				h("Container", containerPresets.grid(2), [
					h("IconBox"),
					h("IconBox", {
						title: "Com parallax",
						box: { scrollEffect: { type: "parallax", speed: 0.25 } },
					}),
				]),
			]),
		]),
		"section",
		"Ícones",
	),
	section(tpl("cta-gradient").build(), "section", "CTA"),
];

// the "Abrir pop-up" button opens the modal in the same section
const adv = sections[4];
const modalId = Object.entries(adv.nodes).find(([, n]) => (n.type as { resolvedName: string }).resolvedName === "Modal")?.[0];
const buttonId = Object.entries(adv.nodes).find(([, n]) => (n.type as { resolvedName: string }).resolvedName === "Button")?.[0];
if (modalId && buttonId) adv.nodes[buttonId].props.action = { type: "modal", modalId };

const existing = await db.query.page.findFirst({ where: and(eq(page.projectId, projectId), eq(page.slug, "vitrine")) });
if (existing) {
	await db.delete(pageSection).where(eq(pageSection.pageId, existing.id));
	await db.delete(page).where(eq(page.id, existing.id));
}
const created = await db.transaction(async (tx) => {
	const {
		sectionIds: [headerSectionId, footerSectionId],
	} = await upsertSections(tx, projectId, [
		{ ...siteHeader, isGlobal: true },
		{ ...siteFooter, isGlobal: true },
	]);
	const proj = await tx.query.project.findFirst({ where: eq(project.id, projectId) });
	await tx
		.update(project)
		.set({ settings: { ...proj?.settings, headerSectionId, footerSectionId } })
		.where(eq(project.id, projectId));
	const [row] = await tx
		.insert(page)
		.values({ projectId, name: "Vitrine de componentes", slug: "vitrine", root: buildRoot(), seo: { title: "Vitrine" } })
		.returning({ id: page.id });
	await insertSections(tx, projectId, row.id, sections);
	return row;
});
const res = await publishPageById(created.id);
console.log(JSON.stringify({ pageId: created.id, ...res }));
process.exit(0);
