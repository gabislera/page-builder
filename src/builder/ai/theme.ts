/**
 * Theme options for a new page: palette + font pair, generated from the
 * brief. The compiler only uses theme tokens (C.*), so the theme alone
 * changes the whole look of the page.
 */
import { z } from "zod";
import { GOOGLE_FONTS } from "../core/style-engine.ts";
import type { SiteTheme } from "../core/theme.ts";

const FONTS = Object.keys(GOOGLE_FONTS) as [string, ...string[]];
const hex = (hint: string) => z.string().describe(`Hex #rrggbb. ${hint}`);

export const ThemeColorsSpec = z.object({
  primary: hex("Cor da marca: botões e destaques, com texto branco em cima"),
  secondary: hex("Cor bem escura puxada para a marca, fundo das seções escuras (nunca preto puro)"),
  accent: hex("Cor de destaque que contrasta com a primária: selos, ícones, detalhes"),
  text: hex("Texto principal, quase preto, levemente tingido"),
  textMuted: hex("Texto secundário"),
  background: hex("Fundo da página: branco ou off-white quente/frio"),
  surface: hex("Fundo alternativo de seções e cards, um tom diferente do background"),
  border: hex("Bordas suaves"),
});
export type ThemeColors = z.infer<typeof ThemeColorsSpec>;

export const ThemeOptionSpec = z.object({
  name: z.string().describe('Nome curto e evocativo do tema, ex.: "Padaria de bairro", "Neon noturno"'),
  mood: z.string().describe("Uma frase sobre a sensação visual"),
  colors: ThemeColorsSpec,
  fonts: z.object({
    heading: z.enum(FONTS).describe("Fonte dos títulos: é ela que dá personalidade"),
    body: z.enum(FONTS).describe("Fonte do texto: legível em parágrafos"),
  }),
});
export type ThemeOption = z.infer<typeof ThemeOptionSpec>;

export const ThemeOptionsSpec = z.object({ options: z.array(ThemeOptionSpec) });

export const THEME_INSTRUCTIONS = `Você é diretor de arte de uma agência de branding brasileira.
A partir do briefing, crie 3 direções visuais BEM diferentes entre si para o site: paleta de cores e par de fontes.

## Regras
- A identidade tem que nascer do negócio, do público e do tom de voz. Uma confeitaria para cachorros descontraída pede cor, calor e fontes arredondadas; um escritório de advocacia pede sobriedade.
- Fuja do azul corporativo genérico (#2563eb e parecidos), a não ser que o negócio peça.
- As 3 direções precisam ser distintas: por exemplo, uma mais segura, uma mais ousada e uma inesperada. Varie a cor primária, a temperatura e as fontes.
- primary: saturada e marcante, legível com texto branco em cima.
- secondary: muito escura e puxada para a paleta (vinho, azul-petróleo, marrom-café, verde-floresta...), usada como fundo das seções escuras.
- background e surface: podem ser off-white quentes ou frios; surface é um tom visivelmente diferente do background.
- name e mood em português do Brasil, sem travessão.
- Fontes: a de título dá personalidade (Fredoka, Baloo 2, Fraunces, Young Serif, Syne, Unbounded, Bricolage Grotesque, DM Serif Display...); a de texto é legível (Inter, DM Sans, Nunito, Figtree, Plus Jakarta Sans, Manrope, Lato...). Não use a mesma fonte nas três direções.`;

export function themeUserPrompt(brief: string, avoid: string[] = []): string {
  const skip = avoid.length
    ? `\n\nO usuário já viu e quer outras ideias. Não repita estas direções nem as mesmas cores principais e fontes: ${avoid.join("; ")}.`
    : "";
  return `${brief}${skip}\n\nCrie as 3 direções visuais.`;
}

/* ------------------------------------------------------------------ */
/* Contrast                                                            */
/* ------------------------------------------------------------------ */

const HEX = /^#?([0-9a-f]{6})$/i;

function rgb(color: string): [number, number, number] | null {
  const m = HEX.exec(color.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = ([r, g, b]: [number, number, number]) =>
  `#${[r, g, b]
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

function luminance(c: [number, number, number]) {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const ca = rgb(a);
  const cb = rgb(b);
  if (!ca || !cb) return 21;
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Mixes `color` toward black (or white) until it reaches `min` contrast with `against`. */
function ensure(color: string, against: string, min: number, toward: "black" | "white"): string {
  let c = rgb(color);
  if (!c) return color;
  const target = toward === "black" ? 0 : 255;
  for (let i = 0; i < 20 && contrast(toHex(c), against) < min; i++) {
    c = c.map((v) => v + (target - v) * 0.12) as [number, number, number];
  }
  return toHex(c);
}

/**
 * Keeps creative palettes readable: white text on primary buttons and on
 * dark sections, dark text on the background. Invalid colors fall back.
 */
export function fixContrast(colors: ThemeColors): ThemeColors {
  const valid = (c: string, fallback: string) => (rgb(c) ? toHex(rgb(c) as [number, number, number]) : fallback);
  const background = valid(colors.background, "#ffffff");
  return {
    primary: ensure(valid(colors.primary, "#2563eb"), "#ffffff", 3.2, "black"),
    secondary: ensure(valid(colors.secondary, "#0f172a"), "#ffffff", 10, "black"),
    accent: valid(colors.accent, "#f59e0b"),
    text: ensure(valid(colors.text, "#18181b"), background, 10, "black"),
    textMuted: ensure(valid(colors.textMuted, "#52525b"), background, 4.8, "black"),
    background,
    surface: valid(colors.surface, "#f4f4f5"),
    border: valid(colors.border, "#e4e4e7"),
  };
}

/* ------------------------------------------------------------------ */
/* Site theme                                                          */
/* ------------------------------------------------------------------ */

const COLOR_IDS: Record<keyof ThemeColors, string> = {
  primary: "primary",
  secondary: "secondary",
  accent: "accent",
  text: "text",
  textMuted: "text-muted",
  background: "background",
  surface: "surface",
  border: "border",
};

/** Applies the option over the current theme (custom colors are kept). */
export function toSiteTheme(option: Pick<ThemeOption, "colors" | "fonts">, current: SiteTheme): SiteTheme {
  const byId = new Map(Object.entries(COLOR_IDS).map(([key, id]) => [id, option.colors[key as keyof ThemeColors]]));
  return {
    colors: current.colors.map((c) => (byId.has(c.id) ? { ...c, value: byId.get(c.id) as string } : c)),
    fonts: { heading: option.fonts.heading, body: option.fonts.body },
  };
}

/** The current site theme in the same shape as an option (for the "keep current" card). */
export function fromSiteTheme(theme: SiteTheme): Pick<ThemeOption, "colors" | "fonts"> {
  const value = (id: string) => theme.colors.find((c) => c.id === id)?.value ?? "#000000";
  const colors = Object.fromEntries(Object.entries(COLOR_IDS).map(([key, id]) => [key, value(id)])) as ThemeColors;
  return { colors, fonts: theme.fonts };
}
