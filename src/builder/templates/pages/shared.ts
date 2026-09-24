/**
 * Shared pieces for page templates: photos, titles, pills, grids, and
 * buttons with the same finish. Colors and fonts come from the site theme
 * (C.*), so the template adapts to the user's identity.
 */
import { containerPresets } from "../../components/container.tsx";
import { h, type NodeSpec } from "../../core/build.ts";
import { corners, defaultBackground, defaultShadow, sides } from "../../core/defaults.ts";
import { type Responsive, responsive } from "../../core/responsive.ts";
import type { Action } from "../../core/style-types.ts";
import { C } from "../../core/theme.ts";

/** Unsplash photo (free for commercial use), already cropped. */
export const photo = (id: string, w = 1600, ratio?: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}${ratio ? `&h=${Math.round(w / ratio)}` : ""}&q=80&auto=format&fit=crop`;

export const r = responsive;
type Align = "left" | "center";
const textAlign = (a: Align) => ({ textAlign: r(a) });

/** White with transparency (text on a dark background). */
export const white = (pct: number) => `color-mix(in srgb, #ffffff ${pct}%, transparent)`;
/** Theme color with transparency. */
export const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/** Default vertical section padding. */
export const sectionPadding = (desktop = "104px", mobile = "64px") =>
  r(sides(desktop, "24px"), undefined, sides(mobile, "16px"));

export const section = (name: string, children: NodeSpec[], props: Record<string, unknown> = {}): NodeSpec =>
  h(
    "Section",
    {
      padding: sectionPadding(),
      gap: r("48px", undefined, "32px"),
      alignItems: r("center"),
      ...props,
    },
    children,
    name,
  );

export const bg = (color: string) => defaultBackground({ type: "color", color });

/** Dark background with a soft primary glow in the corner. */
export const darkGlow = (angle = 160) =>
  defaultBackground({
    type: "gradient",
    gradient: {
      type: "linear",
      angle,
      from: `color-mix(in srgb, ${C.secondary} 88%, ${C.primary})`,
      fromPosition: 0,
      to: C.secondary,
      toPosition: 60,
    },
  });

export const stack = (children: NodeSpec[], props: Record<string, unknown> = {}, name = "Coluna"): NodeSpec =>
  h("Container", { ...containerPresets.stack, gap: r("20px"), ...props }, children, name);

export const row = (children: NodeSpec[], props: Record<string, unknown> = {}, name = "Linha"): NodeSpec =>
  h(
    "Container",
    {
      ...containerPresets.row,
      gap: r("12px"),
      wrap: r(true),
      direction: r("row"),
      ...props,
    },
    children,
    name,
  );

export const grid = (
  columns: Responsive<number>,
  children: NodeSpec[],
  props: Record<string, unknown> = {},
  name = "Grade",
): NodeSpec =>
  h(
    "Container",
    {
      ...containerPresets.grid(columns.desktop),
      columns,
      gap: r("24px"),
      ...props,
    },
    children,
    name,
  );

/** White box with a soft border, rounded corners, and a light shadow. */
export const card = (children: NodeSpec[], props: Record<string, unknown> = {}, name = "Card"): NodeSpec =>
  stack(
    children,
    {
      gap: r("14px"),
      background: bg(C.background),
      border: {
        style: "solid",
        width: r(sides("1px")),
        color: C.border,
        radius: r(corners("20px")),
      },
      shadow: defaultShadow({
        enabled: true,
        y: 12,
        blur: 32,
        spread: -12,
        color: "rgba(15, 23, 42, .12)",
      }),
      box: { padding: r(sides("32px"), undefined, sides("24px")) },
      ...props,
    },
    name,
  );

/** Small uppercase text above titles ("O QUE VOCÊ RECEBE"). */
export const eyebrow = (text: string, align: Align = "center", color = C.primary) =>
  h("Heading", {
    text,
    tag: "p",
    typography: {
      fontSize: r("13px"),
      fontWeight: "700",
      letterSpacing: r("0.14em"),
      textTransform: "uppercase",
      color,
      ...textAlign(align),
    },
  });

export const title = (
  text: string,
  opts: {
    align?: Align;
    color?: string;
    tag?: string;
    size?: Responsive<string>;
    maxWidth?: string;
  } = {},
) =>
  h("Heading", {
    text,
    tag: opts.tag ?? "h2",
    typography: {
      fontSize: opts.size ?? r("44px", "36px", "30px"),
      fontWeight: "800",
      lineHeight: r("1.12"),
      letterSpacing: r("-0.025em"),
      color: opts.color ?? C.text,
      ...textAlign(opts.align ?? "center"),
    },
    box: { maxWidth: r(opts.maxWidth ?? "760px") },
  });

export const lead = (
  html: string,
  opts: {
    align?: Align;
    color?: string;
    size?: Responsive<string>;
    maxWidth?: string;
  } = {},
) =>
  h("Text", {
    html: html.startsWith("<") ? html : `<p>${html}</p>`,
    typography: {
      fontSize: opts.size ?? r("19px", undefined, "17px"),
      lineHeight: r("1.65"),
      color: opts.color ?? C.textMuted,
      ...textAlign(opts.align ?? "center"),
    },
    box: { maxWidth: r(opts.maxWidth ?? "680px") },
  });

/** Section title: pill + title + subtitle, centered. */
export const heading = (
  kicker: string,
  text: string,
  sub?: string,
  opts: { align?: Align; dark?: boolean } = {},
): NodeSpec[] => {
  const align = opts.align ?? "center";
  return [
    stack(
      [
        eyebrow(kicker, align, opts.dark ? white(70) : C.primary),
        title(text, { align, color: opts.dark ? "#ffffff" : C.text }),
        ...(sub ? [lead(sub, { align, color: opts.dark ? white(72) : C.textMuted })] : []),
      ],
      {
        gap: r("14px"),
        align: r(align === "center" ? "center" : "flex-start"),
        box: { width: r("100%") },
      },
      "Título",
    ),
  ];
};

/** Rounded pill ("Turma 2026 · Inscrições abertas"). */
export const pill = (
  text: string,
  opts: {
    color?: string;
    background?: string;
    align?: "flex-start" | "center";
  } = {},
) =>
  h(
    "Container",
    {
      ...containerPresets.row,
      direction: r("row"),
      gap: r("8px"),
      background: bg(opts.background ?? tint(C.primary, 12)),
      border: {
        style: "solid",
        width: r(sides("1px")),
        color: tint(opts.color ?? C.primary, 25),
        radius: r(corners("999px")),
      },
      box: {
        padding: r(sides("7px", "16px")),
        alignSelf: r(opts.align ?? "center"),
        width: r("auto"),
      },
    },
    [
      h("Text", {
        html: `<p>${text}</p>`,
        typography: {
          fontSize: r("13px"),
          fontWeight: "600",
          lineHeight: r("1.3"),
          color: opts.color ?? C.primary,
          textAlign: r("center"),
        },
      }),
    ],
    "Selo",
  );

export const anchor = (id: string): Action => ({
  type: "url",
  url: `#${id}`,
  newTab: false,
});

/** Large primary button. */
export const cta = (
  text: string,
  opts: {
    action?: Action;
    align?: "flex-start" | "center" | "stretch";
    light?: boolean;
    icon?: string;
    fullWidth?: Responsive<boolean>;
  } = {},
) =>
  h("Button", {
    text,
    icon: opts.icon ?? "arrow-right",
    action: opts.action ?? { type: "url", url: "", newTab: false },
    padding: r(sides("20px", "36px"), undefined, sides("18px", "24px")),
    fullWidth: opts.fullWidth ?? r(false, undefined, true),
    typography: {
      fontSize: r("18px", undefined, "17px"),
      fontWeight: "700",
      color: opts.light ? C.secondary : "#ffffff",
      textAlign: r("center"),
    },
    border: { radius: r(corners("14px")) },
    ...(opts.light
      ? {
          background: bg("#ffffff"),
          hover: {
            enabled: true,
            background: `color-mix(in srgb, #ffffff 88%, ${C.primary})`,
            scale: 1.02,
          },
          shadow: defaultShadow({
            enabled: true,
            y: 12,
            blur: 30,
            color: "rgba(0,0,0,.25)",
          }),
        }
      : {}),
    box: { alignSelf: r(opts.align ?? "center") },
  });

/** Checklist with a check icon. */
export const checks = (
  items: string[],
  opts: {
    color?: string;
    iconColor?: string;
    size?: Responsive<string>;
    layout?: Responsive<"vertical" | "horizontal">;
    icon?: string;
    align?: "flex-start" | "center";
  } = {},
) =>
  h("IconList", {
    items: items.map((text, i) => ({
      id: `i${i}`,
      icon: opts.icon ?? "check-circle",
      text,
      action: { type: "none" },
    })),
    layout: opts.layout ?? r("vertical"),
    gap: r(opts.layout?.desktop === "horizontal" ? "24px" : "14px"),
    align: r(opts.align ?? "flex-start"),
    iconColor: opts.iconColor ?? C.primary,
    iconSize: r("20px"),
    iconGap: r("12px"),
    typography: {
      fontSize: opts.size ?? r("17px", undefined, "16px"),
      fontWeight: "500",
      lineHeight: r("1.5"),
      color: opts.color ?? C.text,
    },
  });

/** Image with rounded corners and a shadow. */
export const picture = (src: string, alt: string, props: Record<string, unknown> = {}) =>
  h(
    "Image",
    {
      src: r(src),
      alt,
      border: { radius: r(corners("24px")) },
      shadow: defaultShadow({
        enabled: true,
        y: 24,
        blur: 60,
        spread: -20,
        color: "rgba(15, 23, 42, .35)",
      }),
      ...props,
    },
    [],
    "Imagem",
  );

/** Compact footer for pages without the site footer (sales, capture). */
export const miniFooter = (text: string, dark = true) =>
  section(
    "Rodapé",
    [
      h("Text", {
        html: `<p>${text}</p>`,
        typography: {
          fontSize: r("14px"),
          color: dark ? white(55) : C.textMuted,
          textAlign: r("center"),
        },
        linkColor: dark ? white(80) : C.text,
      }),
    ],
    {
      padding: r(sides("32px", "24px")),
      background: bg(dark ? C.secondary : C.surface),
      border: {
        style: "solid",
        width: r({ top: "1px", right: "0px", bottom: "0px", left: "0px" }),
        color: dark ? white(10) : C.border,
        radius: r(corners("0px")),
      },
    },
  );

/** FAQ in list style (accordion). */
export const faq = (items: [string, string][], props: Record<string, unknown> = {}) =>
  h(
    "Accordion",
    { box: { maxWidth: r("820px"), width: r("100%") }, ...props },
    items.map(([q, a]) => h("AccordionItem", { title: q }, [h("Text", { html: `<p>${a}</p>` })])),
    "Perguntas frequentes",
  );
