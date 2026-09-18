/**
 * Seções prontas com componentes interativos (acordeão, abas e carrossel).
 * Cada modelo gera uma subárvore nova (ids novos) a cada inserção.
 */
import { containerPresets } from "../components/container.tsx";
import { h, type NodeSpec } from "../core/build.ts";
import {
	corners,
	defaultBackground,
	defaultBorder,
	sides,
} from "../core/defaults.ts";
import { responsive } from "../core/responsive.ts";
import { C } from "../core/theme.ts";
import type { SectionTemplate } from "./sections.ts";

export const INTERACTIVE_CATEGORIES = [
	"Perguntas frequentes",
	"Abas",
	"Carrossel",
] as const;

const centered = { textAlign: responsive("center") };

const sectionTitle = (text: string, subtitle?: string): NodeSpec[] => [
	h("Heading", {
		text,
		typography: {
			fontSize: responsive("36px", undefined, "28px"),
			...centered,
		},
	}),
	...(subtitle
		? [
				h("Text", {
					html: `<p>${subtitle}</p>`,
					typography: { ...centered, color: C.textMuted },
					box: { maxWidth: responsive("640px") },
				}),
			]
		: []),
];

/** Imagem neutra (SVG embutido) para o usuário trocar pela dele. */
const PLACEHOLDER_IMAGE =
	"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%2394a3b8'/><stop offset='1' stop-color='%23334155'/></linearGradient></defs><rect width='1600' height='900' fill='url(%23g)'/></svg>";

/* ------------------------------------------------------------------ */
/* Perguntas frequentes                                                */
/* ------------------------------------------------------------------ */

const FAQ = [
	[
		"Por quanto tempo terei acesso?",
		"O acesso é vitalício. Você pode assistir quando e quantas vezes quiser.",
	],
	[
		"Tem garantia?",
		"Sim! Você tem 7 dias de garantia incondicional. Se não gostar, devolvemos 100% do valor.",
	],
	[
		"Quais são as formas de pagamento?",
		"Cartão de crédito em até 12x, Pix ou boleto.",
	],
	[
		"Como recebo o acesso?",
		"Assim que o pagamento for aprovado, você recebe os dados de acesso no seu e-mail.",
	],
];

/* ------------------------------------------------------------------ */
/* Abas                                                                */
/* ------------------------------------------------------------------ */

const tabContent = (title: string, text: string): NodeSpec =>
	h(
		"Container",
		{
			...containerPresets.grid(2),
			gap: responsive("40px", undefined, "24px"),
			align: responsive("center"),
		},
		[
			h("Image", { border: { radius: responsive(corners("12px")) } }),
			h("Container", containerPresets.stack, [
				h("Heading", {
					text: title,
					tag: "h3",
					typography: { fontSize: responsive("28px", undefined, "22px") },
				}),
				h("Text", { html: `<p>${text}</p>` }),
			]),
		],
		"Colunas",
	);

/* ------------------------------------------------------------------ */
/* Carrossel                                                           */
/* ------------------------------------------------------------------ */

const heroSlide = (title: string, text: string): NodeSpec =>
	h(
		"CarouselSlide",
		{
			background: defaultBackground({
				type: "image",
				color: C.secondary,
				image: {
					url: PLACEHOLDER_IMAGE,
					size: "cover",
					position: "center center",
					repeat: false,
					fixed: false,
				},
				overlay: "#0f172a80",
			}),
			minHeight: responsive("520px", "440px", "380px"),
			padding: responsive(
				sides("64px", "80px"),
				undefined,
				sides("40px", "24px"),
			),
			gap: responsive("20px"),
		},
		[
			h("Heading", {
				text: title,
				tag: "h2",
				typography: {
					fontSize: responsive("48px", "40px", "30px"),
					color: "#ffffff",
					...centered,
				},
				box: { maxWidth: responsive("760px") },
			}),
			h("Text", {
				html: `<p>${text}</p>`,
				typography: {
					fontSize: responsive("18px", undefined, "16px"),
					color: "color-mix(in srgb, #ffffff 85%, transparent)",
					...centered,
				},
				box: { maxWidth: responsive("600px") },
			}),
			h("Button", { box: { alignSelf: responsive("center") } }),
		],
	);

const cardSlide = (title: string): NodeSpec =>
	h(
		"CarouselSlide",
		{
			background: defaultBackground({ type: "color", color: C.background }),
			border: defaultBorder({
				style: "solid",
				color: C.border,
				radius: responsive(corners("16px")),
			}),
			minHeight: responsive("0px"),
			padding: responsive(sides("28px")),
			verticalAlign: responsive("flex-start"),
			alignItems: responsive("stretch"),
			gap: responsive("12px"),
		},
		[
			h("Image", {
				height: responsive("180px"),
				border: { radius: responsive(corners("10px")) },
			}),
			h("Heading", {
				text: title,
				tag: "h3",
				typography: { fontSize: responsive("20px") },
			}),
			h("Text", {
				html: "<p>Descreva este item em uma ou duas frases objetivas.</p>",
				typography: { fontSize: responsive("16px"), color: C.textMuted },
			}),
		],
	);

export const INTERACTIVE_TEMPLATES: SectionTemplate[] = [
	{
		id: "faq-accordion",
		category: "Perguntas frequentes",
		name: "Perguntas em acordeão",
		kind: "section",
		build: () =>
			h(
				"Section",
				{ alignItems: responsive("center"), gap: responsive("32px") },
				[
					...sectionTitle(
						"Perguntas frequentes",
						"Tire suas dúvidas antes de começar.",
					),
					h(
						"Accordion",
						{ box: { maxWidth: responsive("800px") } },
						FAQ.map(([question, answer]) =>
							h("AccordionItem", { title: question }, [
								h("Text", { html: `<p>${answer}</p>` }),
							]),
						),
					),
				],
				"Perguntas frequentes",
			),
	},
	{
		id: "tabs-image-text",
		category: "Abas",
		name: "Abas com imagem e texto",
		kind: "section",
		build: () =>
			h(
				"Section",
				{ alignItems: responsive("center"), gap: responsive("32px") },
				[
					...sectionTitle(
						"Tudo o que você precisa",
						"Organize os detalhes da sua oferta em abas.",
					),
					h("Tabs", { justify: "center" }, [
						h("TabItem", { label: "Visão geral" }, [
							tabContent(
								"Uma visão completa",
								"Apresente o principal benefício da sua oferta e para quem ela é.",
							),
						]),
						h("TabItem", { label: "Como funciona" }, [
							tabContent(
								"Passo a passo simples",
								"Explique as etapas que o cliente percorre até chegar ao resultado.",
							),
						]),
						h("TabItem", { label: "Resultados" }, [
							tabContent(
								"Resultados comprovados",
								"Mostre números, provas e depoimentos que reforçam a promessa.",
							),
						]),
					]),
				],
				"Abas",
			),
	},
	{
		id: "carousel-hero",
		category: "Carrossel",
		name: "Banner em carrossel",
		kind: "section",
		build: () =>
			h(
				"Section",
				{
					fullWidth: true,
					padding: responsive(sides("0px")),
				},
				[
					h(
						"Carousel",
						{
							gap: responsive("0px"),
							autoplay: 6,
							arrowBackground: "color-mix(in srgb, #ffffff 85%, transparent)",
						},
						[
							heroSlide(
								"Transforme visitantes em clientes",
								"Explique em uma frase o resultado que sua oferta entrega.",
							),
							heroSlide(
								"Uma segunda mensagem forte",
								"Use cada slide para um benefício, uma prova ou uma oferta.",
							),
							heroSlide(
								"Chamada final irresistível",
								"Reforce a oferta e a urgência antes do clique.",
							),
						],
					),
				],
				"Banner",
			),
	},
	{
		id: "carousel-cards",
		category: "Carrossel",
		name: "Carrossel de cards",
		kind: "section",
		build: () =>
			h(
				"Section",
				{
					background: defaultBackground({ type: "color", color: C.surface }),
					alignItems: responsive("center"),
					gap: responsive("32px"),
				},
				[
					...sectionTitle("Conheça os destaques"),
					h(
						"Carousel",
						{
							slidesPerView: responsive(3, 2, 1),
							gap: responsive("24px", undefined, "16px"),
							arrowPosition: "outside",
							showArrows: responsive(true, undefined, false),
						},
						[
							"Destaque 1",
							"Destaque 2",
							"Destaque 3",
							"Destaque 4",
							"Destaque 5",
							"Destaque 6",
						].map(cardSlide),
					),
				],
				"Carrossel de cards",
			),
	},
];
