/**
 * Modelos prontos de cabeçalho e rodapé.
 */
import { h } from "../core/build.ts";
import { defaultBackground, sides } from "../core/defaults.ts";
import { responsive } from "../core/responsive.ts";
import type { SectionTemplate } from "./sections.ts";

const url = { type: "url", url: "", newTab: false } as const;

export const HEADER_FOOTER_TEMPLATES: SectionTemplate[] = [
	{
		id: "header-classic",
		category: "Cabeçalho",
		name: "Clássico claro",
		kind: "header",
		build: () => h("Header", {}, [], "Cabeçalho"),
	},
	{
		id: "header-dark",
		category: "Cabeçalho",
		name: "Escuro com dois botões",
		kind: "header",
		build: () =>
			h(
				"Header",
				{
					background: defaultBackground({ type: "color", color: "#0f0f14" }),
					borderBottom: false,
					logoTypography: { color: "#ffffff" },
					navAlign: responsive("flex-end"),
					navTypography: { color: "#d4d4d8" },
					navHoverColor: "#ffffff",
					buttons: [
						{
							id: "btn-entrar",
							text: "Entrar",
							action: url,
							variant: "outline",
							background: "#ffffff",
							textColor: "#0f0f14",
							radius: "999px",
						},
						{
							id: "btn-comecar",
							text: "Começar agora",
							action: url,
							variant: "solid",
							background: "#2563eb",
							textColor: "#ffffff",
							radius: "999px",
						},
					],
					padding: responsive(
						sides("18px", "24px"),
						undefined,
						sides("12px", "16px"),
					),
					collapseOn: "tablet",
					menuBackground: "#0f0f14",
					toggleColor: "#ffffff",
				},
				[],
				"Cabeçalho",
			),
	},
	{
		id: "footer-columns",
		category: "Rodapé",
		name: "Escuro com colunas",
		kind: "footer",
		build: () => h("Footer", {}, [], "Rodapé"),
	},
	{
		id: "footer-simple",
		category: "Rodapé",
		name: "Simples claro",
		kind: "footer",
		build: () =>
			h(
				"Footer",
				{
					background: defaultBackground({ type: "color", color: "#fafafa" }),
					description: "Feito com carinho para você.",
					groups: [],
					padding: responsive(
						sides("48px", "24px", "28px"),
						undefined,
						sides("40px", "16px", "24px"),
					),
					logoTypography: { color: "#18181b" },
					textTypography: { color: "#52525b" },
					titleTypography: { color: "#18181b" },
					linkTypography: { color: "#52525b" },
					linkHoverColor: "#2563eb",
					iconColor: "#52525b",
					iconHoverColor: "#2563eb",
					iconBackground: "#18181b0d",
					dividerColor: "#e4e4e7",
				},
				[],
				"Rodapé",
			),
	},
];
