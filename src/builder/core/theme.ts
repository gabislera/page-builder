/**
 * Site-wide styles (palette, fonts, and identity).
 *
 * Components do not store the brand color as hex: they store a reference
 * like `var(--pb-c-primary)`. The published page and editor canvas define
 * these variables from the project theme, so changing the palette updates
 * the whole site.
 */

import { FONT_OPTIONS, fontStack, GOOGLE_FONTS } from "./style-engine.ts";

export type ThemeColor = {
  id: string;
  name: string;
  value: string;
  /** System colors cannot be removed (only edited). */
  system?: boolean;
};

export type SiteTheme = {
  colors: ThemeColor[];
  fonts: { heading: string; body: string };
};

/** Site identity: used by the Logo element and in page titles. */
export type SiteIdentity = {
  name: string;
  logoUrl: string;
  /** Alternate logo for dark backgrounds (optional). */
  logoLightUrl: string;
};

export type SiteSettings = {
  theme: SiteTheme;
  identity: SiteIdentity;
  /** Section used as the site's default header. */
  headerSectionId: string | null;
  /** Section used as the site's default footer. */
  footerSectionId: string | null;
  /** Page opened at the site address (/p/project). Empty: automatic. */
  homePageId: string | null;
  /** Page shown when the address does not exist. Empty: default page. */
  notFoundPageId: string | null;
  cookieBanner: CookieBanner;
};

/** Cookie notice (LGPD), the same on every page of the site. */
export type CookieBanner = {
  enabled: boolean;
  /** "block": pixels and scripts load only after accept. */
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
  homePageId: null,
  notFoundPageId: null,
  cookieBanner: DEFAULT_COOKIE_BANNER,
};

/** Fills saved settings with defaults (old projects, new fields). */
export function normalizeSiteSettings(input: Partial<SiteSettings> | null | undefined): SiteSettings {
  const theme = input?.theme;
  const saved = new Map((theme?.colors ?? []).map((c) => [c.id, c]));
  const colors = [
    ...DEFAULT_THEME.colors.map((c) => ({
      ...c,
      ...saved.get(c.id),
      system: true,
    })),
    ...(theme?.colors ?? []).filter((c) => !DEFAULT_THEME.colors.some((d) => d.id === c.id)),
  ];
  return {
    theme: { colors, fonts: { ...DEFAULT_THEME.fonts, ...theme?.fonts } },
    identity: { ...DEFAULT_IDENTITY, ...input?.identity },
    headerSectionId: input?.headerSectionId ?? null,
    footerSectionId: input?.footerSectionId ?? null,
    homePageId: input?.homePageId ?? null,
    notFoundPageId: input?.notFoundPageId ?? null,
    cookieBanner: { ...DEFAULT_COOKIE_BANNER, ...input?.cookieBanner },
  };
}

/* ------------------------------------------------------------------ */
/* References                                                          */
/* ------------------------------------------------------------------ */

const COLOR_VAR = /^var\(--pb-c-([a-z0-9-]+)\)$/;

/** Reference to a global color, for use as a prop value. */
export const colorVar = (id: string) => `var(--pb-c-${id})`;

/** Id of the global color referenced by the value, or null if it is a plain color. */
export function colorRefId(value: string | undefined): string | null {
  return value ? (COLOR_VAR.exec(value)?.[1] ?? null) : null;
}

/** Effective color (hex) of a value that may be a global reference. */
export function resolveColor(value: string | undefined, theme: SiteTheme): string {
  const id = colorRefId(value);
  if (!id) return value ?? "";
  return theme.colors.find((c) => c.id === id)?.value ?? "";
}

/** Replaces global color references with the real value (e.g. to show in the panel). */
export function resolveThemeVars(value: string, theme: SiteTheme): string {
  return value.replace(
    /var\(--pb-c-([a-z0-9-]+)\)/g,
    (_, id: string) => theme.colors.find((c) => c.id === id)?.value ?? "transparent",
  );
}

/** Global fonts: `fontFamily` values accepted by components. */
export const FONT_HEADING = "var(--pb-font-heading)";
export const FONT_BODY = "var(--pb-font-body)";

export const GLOBAL_FONT_LABELS: Record<string, string> = {
  [FONT_HEADING]: "Fonte dos títulos (global)",
  [FONT_BODY]: "Fonte do texto (global)",
};

/**
 * Font picker options: global fonts first, then the rest.
 * `inherit` inherits from the parent element.
 */
export function fontChoices(opts: { inherit?: boolean } = {}) {
  return [
    { value: FONT_HEADING, label: GLOBAL_FONT_LABELS[FONT_HEADING] },
    { value: FONT_BODY, label: GLOBAL_FONT_LABELS[FONT_BODY] },
    ...(opts.inherit ? [{ value: "inherit", label: "Herdar do elemento pai" }] : []),
    ...FONT_OPTIONS.filter((f) => f !== "inherit").map((f) => ({
      value: f,
      label: f,
    })),
  ];
}

/** Shortcuts used in component defaults. */
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

/** Theme CSS variables, applied on `:root`. */
export function themeCss(theme: SiteTheme): string {
  const vars = [
    ...theme.colors.map((c) => `--pb-c-${safeId(c.id)}:${c.value}`),
    `--pb-font-heading:${fontStack(theme.fonts.heading)}`,
    `--pb-font-body:${fontStack(theme.fonts.body)}`,
  ];
  return `:root{${vars.join(";")}}`;
}

/** Google fonts used by the theme. */
export function themeFonts(theme: SiteTheme): string[] {
  return [theme.fonts.heading, theme.fonts.body].filter((f) => f in GOOGLE_FONTS);
}
