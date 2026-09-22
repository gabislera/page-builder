/**
 * Estilos globais do site (paleta, fontes e identidade).
 *
 * Os componentes não guardam a cor da marca em hex: guardam uma referência
 * como `var(--pb-c-primary)`. A página publicada e o canvas do editor definem
 * essas variáveis a partir do tema do projeto, então trocar a paleta muda o
 * site inteiro.
 */

import { FONT_OPTIONS, fontStack, GOOGLE_FONTS } from "./style-engine.ts";

export type ThemeColor = {
	id: string;
	name: string;
	value: string;
	/** Cores do sistema não podem ser removidas (só editadas). */
	system?: boolean;
};

export type SiteTheme = {
	colors: ThemeColor[];
	fonts: { heading: string; body: string };
};

/** Identidade do site: usada pelo elemento Logo e no título das páginas. */
export type SiteIdentity = {
	name: string;
	logoUrl: string;
	/** Logo alternativo para fundos escuros (opcional). */
	logoLightUrl: string;
};

export type SiteSettings = {
	theme: SiteTheme;
	identity: SiteIdentity;
	/** Seção usada como cabeçalho padrão do site. */
	headerSectionId: string | null;
	/** Seção usada como rodapé padrão do site. */
	footerSectionId: string | null;
	cookieBanner: CookieBanner;
};

/** Aviso de cookies (LGPD), igual em todas as páginas do site. */
export type CookieBanner = {
	enabled: boolean;
	/** "block": pixels e scripts só carregam depois de aceitar. */
	mode: "block" | "notice";
	text: string;
	acceptText: string;
	rejectText: string;
	policyText: string;
	policyUrl: string;
	position: "bottom" | "bottom-left" | "bottom-right";
	appearance: "light" | "dark";
};

export const DEFAULT_COOKIE_BANNER: CookieBanner = {
	enabled: false,
	mode: "block",
	text: "Usamos cookies para melhorar sua experiência e medir o resultado dos nossos anúncios. Você pode aceitar ou recusar os cookies não essenciais.",
	acceptText: "Aceitar",
	rejectText: "Recusar",
	policyText: "Política de privacidade",
	policyUrl: "",
	position: "bottom-left",
	appearance: "light",
};

export const DEFAULT_THEME: SiteTheme = {
	colors: [
		{ id: "primary", name: "Primária", value: "#2563eb", system: true },
		{ id: "secondary", name: "Secundária", value: "#0f172a", system: true },
		{ id: "accent", name: "Destaque", value: "#f59e0b", system: true },
		{ id: "text", name: "Texto", value: "#18181b", system: true },
		{ id: "text-muted", name: "Texto suave", value: "#52525b", system: true },
		{ id: "background", name: "Fundo", value: "#ffffff", system: true },
		{ id: "surface", name: "Superfície", value: "#f4f4f5", system: true },
		{ id: "border", name: "Borda", value: "#e4e4e7", system: true },
	],
	fonts: { heading: "Inter", body: "Inter" },
};

export const DEFAULT_IDENTITY: SiteIdentity = {
	name: "Sua marca",
	logoUrl: "",
	logoLightUrl: "",
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
	theme: DEFAULT_THEME,
	identity: DEFAULT_IDENTITY,
	headerSectionId: null,
	footerSectionId: null,
	cookieBanner: DEFAULT_COOKIE_BANNER,
};

/** Completa configurações salvas com os padrões (projetos antigos, campos novos). */
export function normalizeSiteSettings(
	input: Partial<SiteSettings> | null | undefined,
): SiteSettings {
	const theme = input?.theme;
	const saved = new Map((theme?.colors ?? []).map((c) => [c.id, c]));
	const colors = [
		...DEFAULT_THEME.colors.map((c) => ({
			...c,
			...saved.get(c.id),
			system: true,
		})),
		...(theme?.colors ?? []).filter(
			(c) => !DEFAULT_THEME.colors.some((d) => d.id === c.id),
		),
	];
	return {
		theme: { colors, fonts: { ...DEFAULT_THEME.fonts, ...theme?.fonts } },
		identity: { ...DEFAULT_IDENTITY, ...input?.identity },
		headerSectionId: input?.headerSectionId ?? null,
		footerSectionId: input?.footerSectionId ?? null,
		cookieBanner: { ...DEFAULT_COOKIE_BANNER, ...input?.cookieBanner },
	};
}

/* ------------------------------------------------------------------ */
/* Referências                                                         */
/* ------------------------------------------------------------------ */

const COLOR_VAR = /^var\(--pb-c-([a-z0-9-]+)\)$/;

/** Referência a uma cor global, para usar como valor de prop. */
export const colorVar = (id: string) => `var(--pb-c-${id})`;

/** Id da cor global referenciada pelo valor, ou null se for uma cor comum. */
export function colorRefId(value: string | undefined): string | null {
	return value ? (COLOR_VAR.exec(value)?.[1] ?? null) : null;
}

/** Cor efetiva (hex) de um valor que pode ser referência global. */
export function resolveColor(
	value: string | undefined,
	theme: SiteTheme,
): string {
	const id = colorRefId(value);
	if (!id) return value ?? "";
	return theme.colors.find((c) => c.id === id)?.value ?? "";
}

/** Troca referências a cores globais pelo valor real (ex.: para exibir no painel). */
export function resolveThemeVars(value: string, theme: SiteTheme): string {
	return value.replace(
		/var\(--pb-c-([a-z0-9-]+)\)/g,
		(_, id: string) =>
			theme.colors.find((c) => c.id === id)?.value ?? "transparent",
	);
}

/** Fontes globais: valores de `fontFamily` aceitos pelos componentes. */
export const FONT_HEADING = "var(--pb-font-heading)";
export const FONT_BODY = "var(--pb-font-body)";

export const GLOBAL_FONT_LABELS: Record<string, string> = {
	[FONT_HEADING]: "Fonte dos títulos (global)",
	[FONT_BODY]: "Fonte do texto (global)",
};

/**
 * Opções do seletor de fonte: as fontes globais primeiro, depois as demais.
 * `inherit` herda do elemento pai.
 */
export function fontChoices(opts: { inherit?: boolean } = {}) {
	return [
		{ value: FONT_HEADING, label: GLOBAL_FONT_LABELS[FONT_HEADING] },
		{ value: FONT_BODY, label: GLOBAL_FONT_LABELS[FONT_BODY] },
		...(opts.inherit
			? [{ value: "inherit", label: "Herdar do elemento pai" }]
			: []),
		...FONT_OPTIONS.filter((f) => f !== "inherit").map((f) => ({
			value: f,
			label: f,
		})),
	];
}

/** Atalhos usados nos defaults dos componentes. */
export const C = {
	primary: colorVar("primary"),
	secondary: colorVar("secondary"),
	accent: colorVar("accent"),
	text: colorVar("text"),
	textMuted: colorVar("text-muted"),
	background: colorVar("background"),
	surface: colorVar("surface"),
	border: colorVar("border"),
};

/* ------------------------------------------------------------------ */
/* CSS                                                                 */
/* ------------------------------------------------------------------ */

const safeId = (id: string) => id.replace(/[^a-z0-9-]/g, "");

/** Variáveis CSS do tema, aplicadas em `:root`. */
export function themeCss(theme: SiteTheme): string {
	const vars = [
		...theme.colors.map((c) => `--pb-c-${safeId(c.id)}:${c.value}`),
		`--pb-font-heading:${fontStack(theme.fonts.heading)}`,
		`--pb-font-body:${fontStack(theme.fonts.body)}`,
	];
	return `:root{${vars.join(";")}}`;
}

/** Fontes do Google usadas pelo tema. */
export function themeFonts(theme: SiteTheme): string[] {
	return [theme.fonts.heading, theme.fonts.body].filter(
		(f) => f in GOOGLE_FONTS,
	);
}
