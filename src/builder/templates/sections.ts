/**
 * Biblioteca de seções prontas. Cada modelo gera uma subárvore nova
 * (ids novos) a cada inserção.
 */
import { containerPresets } from "../components/container.tsx";
import { h, type NodeSpec } from "../core/build.ts";
import { corners, defaultBackground, sides } from "../core/defaults.ts";
import { responsive } from "../core/responsive.ts";
import { C } from "../core/theme.ts";
import type { SectionKind } from "../core/tree.ts";

export type SectionTemplate = {
	id: string;
	category: string;
	name: string;
	kind: SectionKind;
	build: () => NodeSpec;
};

export const SECTION_CATEGORIES = [
	"Em branco",
	"Hero",
	"Conteúdo",
	"Benefícios",
	"Depoimentos",
	"Chamada para ação",
] as const;

const centered = { typography: { textAlign: responsive("center") } };
const card = (children: NodeSpec[]) =>
	h(
		"Container",
		{
			...containerPresets.stack,
			gap: responsive("12px"),
			background: defaultBackground({ type: "color", color: C.background }),
			border: {
				style: "solid",
				width: responsive(sides("1px")),
				color: C.border,
				radius: responsive(corners("16px")),
			},
			box: { padding: responsive(sides("28px")) },
		},
		children,
		"Card",
	);

const column = (children: NodeSpec[] = []) =>
	h("Container", containerPresets.stack, children, "Coluna");

const blankColumns = (
	n: number,
	template = "",
	label = "",
): SectionTemplate => ({
	id: template ? `blank-${template.replace(/\s+/g, "-")}` : `blank-${n}`,
	category: "Em branco",
	name: label || (n === 1 ? "1 coluna" : `${n} colunas`),
	kind: "section",
	build: () =>
		h(
			"Section",
			{},
			n === 1
				? []
				: [
						h(
							"Container",
							containerPresets.grid(n, template),
							Array.from({ length: n }, () => column()),
							"Colunas",
						),
					],
		),
});

export const SECTION_TEMPLATES: SectionTemplate[] = [
	blankColumns(1),
	blankColumns(2),
	blankColumns(3),
	blankColumns(4),
	blankColumns(2, "1fr 2fr", "1/3 + 2/3"),
	blankColumns(2, "2fr 1fr", "2/3 + 1/3"),
	blankColumns(3, "1fr 2fr 1fr", "1/4 + 1/2 + 1/4"),
	{
		id: "hero-centered",
		category: "Hero",
		name: "Hero centralizado",
		kind: "section",
		build: () =>
			h(
				"Section",
				{
					padding: responsive(
						sides("96px", "24px"),
						undefined,
						sides("56px", "16px"),
					),
					alignItems: responsive("center"),
				},
				[
					h("Heading", {
						text: "Transforme visitantes em clientes",
						tag: "h1",
						typography: {
							fontSize: responsive("56px", "44px", "34px"),
							textAlign: responsive("center"),
						},
						box: { maxWidth: responsive("820px") },
					}),
					h("Text", {
						html: "<p>Explique em uma frase o resultado que sua oferta entrega e para quem ela é.</p>",
						...centered,
						box: { maxWidth: responsive("640px") },
					}),
					h("Button", { box: { alignSelf: responsive("center") } }),
				],
				"Hero",
			),
	},
	{
		id: "hero-split",
		category: "Hero",
		name: "Hero com imagem",
		kind: "section",
		build: () =>
			h(
				"Section",
				{
					padding: responsive(
						sides("80px", "24px"),
						undefined,
						sides("48px", "16px"),
					),
				},
				[
					h(
						"Container",
						{
							...containerPresets.grid(2),
							gap: responsive("48px", undefined, "32px"),
							align: responsive("center"),
						},
						[
							column([
								h("Heading", {
									text: "Sua oferta em uma promessa clara",
									tag: "h1",
									typography: { fontSize: responsive("48px", "40px", "32px") },
								}),
								h("Text", {
									html: "<p>Mostre o principal benefício e remova a maior objeção do seu cliente logo aqui.</p>",
								}),
								h("Button"),
							]),
							h("Image", { border: { radius: responsive(corners("16px")) } }),
						],
						"Colunas",
					),
				],
				"Hero",
			),
	},
	{
		id: "content-text-image",
		category: "Conteúdo",
		name: "Texto e imagem",
		kind: "section",
		build: () =>
			h("Section", {}, [
				h(
					"Container",
					{
						...containerPresets.grid(2),
						gap: responsive("40px"),
						align: responsive("center"),
					},
					[
						h("Image", { border: { radius: responsive(corners("12px")) } }),
						column([
							h("Heading", {
								text: "Um título para este bloco",
								typography: { fontSize: responsive("32px", undefined, "26px") },
							}),
							h("Text", {
								html: "<p>Desenvolva a ideia com detalhes, provas e exemplos. Textos curtos e escaneáveis convertem melhor.</p>",
							}),
						]),
					],
				),
			]),
	},
	{
		id: "benefits-3",
		category: "Benefícios",
		name: "3 benefícios",
		kind: "section",
		build: () =>
			h(
				"Section",
				{
					background: defaultBackground({ type: "color", color: C.surface }),
					alignItems: responsive("center"),
					gap: responsive("40px"),
				},
				[
					h("Heading", {
						text: "Por que escolher a gente",
						...centered,
						typography: {
							fontSize: responsive("36px", undefined, "28px"),
							textAlign: responsive("center"),
						},
					}),
					h(
						"Container",
						containerPresets.grid(3),
						["Resultado rápido", "Suporte próximo", "Garantia total"].map(
							(title) =>
								card([
									h("Heading", {
										text: title,
										tag: "h3",
										typography: { fontSize: responsive("20px") },
									}),
									h("Text", {
										html: "<p>Descreva o benefício em uma ou duas frases objetivas.</p>",
										typography: { fontSize: responsive("16px") },
									}),
								]),
						),
						"Benefícios",
					),
				],
				"Benefícios",
			),
	},
	{
		id: "testimonials-3",
		category: "Depoimentos",
		name: "3 depoimentos",
		kind: "section",
		build: () =>
			h(
				"Section",
				{ alignItems: responsive("center"), gap: responsive("40px") },
				[
					h("Heading", {
						text: "Quem já usa, recomenda",
						typography: {
							fontSize: responsive("36px", undefined, "28px"),
							textAlign: responsive("center"),
						},
					}),
					h(
						"Container",
						containerPresets.grid(3),
						["Ana Souza", "Carlos Lima", "Júlia Martins"].map((name) =>
							card([
								h("Text", {
									html: "<p>“Coloque aqui um depoimento real e específico sobre o resultado alcançado.”</p>",
									typography: {
										fontSize: responsive("16px"),
										fontStyle: "italic",
									},
								}),
								h("Heading", {
									text: name,
									tag: "p",
									typography: {
										fontSize: responsive("15px"),
										fontWeight: "600",
									},
								}),
							]),
						),
						"Depoimentos",
					),
				],
				"Depoimentos",
			),
	},
	{
		id: "cta-gradient",
		category: "Chamada para ação",
		name: "CTA com gradiente",
		kind: "section",
		build: () =>
			h(
				"Section",
				{
					background: defaultBackground({ type: "gradient" }),
					alignItems: responsive("center"),
					padding: responsive(
						sides("88px", "24px"),
						undefined,
						sides("56px", "16px"),
					),
				},
				[
					h("Heading", {
						text: "Pronto para começar?",
						typography: {
							fontSize: responsive("40px", undefined, "30px"),
							textAlign: responsive("center"),
							color: "#ffffff",
						},
					}),
					h("Text", {
						html: "<p>Reforce a oferta e a urgência em uma linha.</p>",
						typography: {
							textAlign: responsive("center"),
							color: "color-mix(in srgb, #ffffff 80%, transparent)",
						},
					}),
					h("Button", {
						background: defaultBackground({ type: "color", color: "#ffffff" }),
						typography: { color: C.primary },
						hover: {
							background:
								"color-mix(in srgb, #ffffff 85%, var(--pb-c-primary))",
						},
						box: { alignSelf: responsive("center") },
					}),
				],
				"Chamada final",
			),
	},
];
