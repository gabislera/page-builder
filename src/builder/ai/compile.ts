/**
 * AI-Spec → NodeSpec. Every visual decision (spacing, type scale, shadows,
 * dark-background colors) lives here, reusing the page-template helpers,
 * so generated sections have the same finish as the hand-made ones.
 */
import { containerPresets } from "../components/container.tsx";
import { h, type NodeSpec } from "../core/build.ts";
import { corners, defaultBackground, defaultShadow, sides } from "../core/defaults.ts";
import type { Action } from "../core/style-types.ts";
import { C } from "../core/theme.ts";
import {
  anchor,
  bg,
  card,
  checks,
  cta,
  darkGlow,
  eyebrow,
  faq,
  grid,
  lead,
  picture,
  pill,
  r,
  section,
  stack,
  tint,
  title,
  white,
} from "../templates/pages/shared.ts";
import type { ActionSpec, BlockSpec, LeafSpec, SectionSpec } from "./spec.ts";

type Ctx = {
  /** Dark background: light text and inverted buttons. */
  dark: boolean;
  align: "left" | "center";
  /** Inside half a Split: at most 2 columns. */
  narrow?: boolean;
};

/** Desktop column count, capped in narrow columns. */
const cols = (n: number, max: number, ctx: Ctx) => clamp(n, 1, ctx.narrow ? Math.min(2, max) : max);

/**
 * Dashes are the most recognizable AI-writing tic: "a confiança cresce —
 * e isso muda tudo". The prompt forbids them; this catches what slips through.
 */
const tidyCopy = (s: string) =>
  s
    .replace(/\s+[—–]\s*(?=[.,;:!?]|$)/g, "")
    // only dashes with a space around them: "10–20 dias" stays
    .replace(/\s+[—–]\s*|\s*[—–]\s+/g, ", ")
    .replace(/,\s*,/g, ",");

function tidyDeep<T>(value: T): T {
  if (typeof value === "string") return tidyCopy(value) as T;
  if (Array.isArray(value)) return value.map(tidyDeep) as T;
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, tidyDeep(v)])) as T;
  return value;
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(Math.round(n) || min, min), max);
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const flex = (a: Ctx["align"]) => (a === "center" ? "center" : "flex-start");
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Keeps only the tags the rich-text editor understands. */
function cleanHtml(html: string): string {
  const cleaned = html
    .replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(\/?)(\w+)[^>]*>/g, (_, close: string, tag: string) =>
      ["p", "strong", "b", "em", "i", "ul", "ol", "li", "br"].includes(tag.toLowerCase()) ? `<${close}${tag}>` : "",
    );
  return cleaned.trim().startsWith("<") ? cleaned : `<p>${cleaned}</p>`;
}

function toAction(a: ActionSpec | null | undefined): Action {
  const value = a?.value?.trim() ?? "";
  switch (a?.type) {
    case "url":
      return value ? { type: "url", url: value, newTab: /^https?:/.test(value) } : { type: "none" };
    case "section":
      return value ? anchor(slug(value)) : { type: "none" };
    case "whatsapp":
      return { type: "whatsapp", phone: value.replace(/\D/g, ""), message: "" };
    default:
      return { type: "url", url: "", newTab: false };
  }
}

/** Image height by aspect ratio (desktop, mobile): the column sets the width. */
const IMAGE_HEIGHT: Record<string, [string, string]> = {
  "16/9": ["340px", "220px"],
  "4/3": ["420px", "260px"],
  "1/1": ["480px", "320px"],
  "3/4": ["560px", "380px"],
};

const TITLE_SIZE = {
  display: r("60px", "46px", "34px"),
  xl: r("44px", "36px", "30px"),
  lg: r("32px", "28px", "24px"),
  md: r("24px", "22px", "20px"),
};

/* ------------------------------------------------------------------ */
/* Leaves                                                              */
/* ------------------------------------------------------------------ */

const surfaceCard = (children: NodeSpec[], name: string, ctx: Ctx, props: Record<string, unknown> = {}) =>
  card(
    children,
    ctx.dark ? { background: bg(white(6)), border: darkBorder(), shadow: { enabled: false }, ...props } : props,
    name,
  );

const darkBorder = () => ({
  style: "solid",
  width: r(sides("1px")),
  color: white(12),
  radius: r(corners("20px")),
});

/**
 * Grid of items. When the last row would be incomplete (5 items in 3
 * columns), it becomes a centered flex wrap, so the leftover items sit in
 * the middle instead of hanging on the left.
 */
function balancedGrid(columns: number, items: NodeSpec[], name: string): NodeSpec {
  const width = { box: { maxWidth: r("1120px"), width: r("100%") } };
  if (items.length <= columns || items.length % columns === 0)
    return grid(r(columns, columns > 2 ? 2 : undefined, 1), items, { align: r("stretch"), ...width }, name);
  const gap = 24;
  const itemWidth = r(
    `calc((100% - ${(columns - 1) * gap}px) / ${columns})`,
    columns > 2 ? `calc((100% - ${gap}px) / 2)` : undefined,
    "100%",
  );
  const sized = items.map((item) => {
    const props = item.props ?? {};
    const box = (props.box as Record<string, unknown> | undefined) ?? {};
    return { ...item, props: { ...props, box: { ...box, width: itemWidth } } };
  });
  return h(
    "Container",
    {
      ...containerPresets.stack,
      direction: r("row"),
      wrap: r(true),
      justify: r("center"),
      align: r("stretch"),
      gap: r(`${gap}px`),
      ...width,
    },
    sized,
    name,
  );
}

function features(spec: Extract<LeafSpec, { type: "Features" }>, ctx: Ctx): NodeSpec {
  const columns = Math.max(cols(spec.columns, 4, ctx), ctx.narrow ? 1 : 2);
  const inline = spec.style === "inline";
  const boxed = spec.style === "cards";
  const items = spec.items.slice(0, 12).map((item) =>
    h(
      "IconBox",
      {
        icon: {
          name: item.icon || "sparkles",
          ...(ctx.dark ? { background: white(10), color: "#ffffff" } : {}),
        },
        iconPosition: r(inline ? "left" : "top"),
        align: r(inline ? "left" : ctx.align),
        title: item.title,
        description: item.text,
        titleTypography: ctx.dark ? { color: "#ffffff" } : {},
        descriptionTypography: ctx.dark ? { color: white(70) } : {},
        padding: r(boxed ? sides("28px") : sides("8px")),
        ...(boxed
          ? {
              background: bg(ctx.dark ? white(6) : C.background),
              border: ctx.dark
                ? darkBorder()
                : { style: "solid", width: r(sides("1px")), color: C.border, radius: r(corners("20px")) },
              hover: { enabled: true },
            }
          : {}),
      },
      [],
      item.title,
    ),
  );
  return balancedGrid(columns, items, "Benefícios");
}

function steps(spec: Extract<LeafSpec, { type: "Steps" }>, ctx: Ctx): NodeSpec {
  const items = spec.items.slice(0, 6);
  // up to 4 in one row; 5 or 6 go in rows of 3
  const columns = cols(items.length <= 4 ? Math.max(items.length, 2) : 3, 4, ctx);
  return balancedGrid(
    columns,
    items.map((s, i) =>
      surfaceCard(
        [
          h("Heading", {
            text: String(i + 1).padStart(2, "0"),
            tag: "p",
            typography: {
              fontSize: r("40px"),
              fontWeight: "800",
              lineHeight: r("1"),
              color: ctx.dark ? C.accent : C.primary,
            },
          }),
          h("Heading", {
            text: s.title,
            tag: "h3",
            typography: { fontSize: r("20px"), fontWeight: "700", color: ctx.dark ? "#ffffff" : C.text },
          }),
          h("Text", {
            html: `<p>${escapeHtml(s.text)}</p>`,
            typography: { fontSize: r("16px"), lineHeight: r("1.6"), color: ctx.dark ? white(70) : C.textMuted },
          }),
        ],
        `Passo ${i + 1}`,
        ctx,
      ),
    ),
    "Passos",
  );
}

function testimonials(spec: Extract<LeafSpec, { type: "Testimonials" }>, ctx: Ctx): NodeSpec {
  const items = spec.items
    .slice(0, 12)
    .map((t) => ({ quote: t.quote, name: t.name, role: t.role, rating: clamp(t.rating, 0, 5) }));
  if (spec.layout === "single" || items.length === 1) {
    const t = items[0];
    return h(
      "Testimonial",
      {
        ...t,
        layout: "centered",
        showQuoteIcon: true,
        ...(ctx.dark ? { quoteIconColor: white(35) } : {}),
        quoteIconSize: "44px",
        avatarSize: r("80px", undefined, "64px"),
        gap: r("20px"),
        quoteTypography: {
          fontSize: r("26px", "22px", "19px"),
          lineHeight: r("1.5"),
          fontWeight: "500",
          ...(ctx.dark ? { color: "#ffffff" } : {}),
        },
        nameTypography: { fontSize: r("18px"), ...(ctx.dark ? { color: "#ffffff" } : {}) },
        ...(ctx.dark ? { roleTypography: { color: white(60) } } : {}),
        background: { type: "none" },
        border: { style: "none" },
        shadow: { enabled: false },
        padding: r(sides("0px")),
        box: { maxWidth: r("820px") },
      },
      [],
      "Depoimento",
    );
  }
  const cards = items.map((t) =>
    h(
      "Testimonial",
      // with photos: photo on top and centered (the avatar shows initials until the upload)
      spec.photos ? { ...t, layout: "centered", avatarSize: r("72px", undefined, "64px") } : { ...t, layout: "card" },
      [],
      t.name,
    ),
  );
  const width = { box: { maxWidth: r("1120px"), width: r("100%") } };
  // counts that leave a half-empty last row (5, 7, 8...) become a carousel
  if (items.length > 3 && items.length !== 4 && items.length % 3 !== 0) {
    return h(
      "Carousel",
      {
        slidesPerView: r(ctx.narrow ? 1 : 3, ctx.narrow ? 1 : 2, 1),
        gap: r("24px", undefined, "16px"),
        arrowPosition: "outside",
        showArrows: r(true, undefined, false),
        ...width,
      },
      cards.map((card) =>
        h(
          "CarouselSlide",
          {
            background: { type: "none" },
            padding: r(sides("0px")),
            minHeight: r("0px"),
            verticalAlign: r("flex-start"),
            alignItems: r("stretch"),
          },
          [card],
          "Slide",
        ),
      ),
      "Depoimentos",
    );
  }
  const columns = cols(items.length === 4 ? 2 : Math.max(items.length, 2), 3, ctx);
  return grid(r(columns, columns > 2 ? 2 : undefined, 1), cards, { align: r("stretch"), ...width }, "Depoimentos");
}

const softButton = {
  background: { type: "color", color: tint(C.primary, 10) },
  typography: { color: C.primary },
  shadow: { enabled: false },
  hover: { background: tint(C.primary, 18), scale: 1 },
};

function pricing(spec: Extract<LeafSpec, { type: "Pricing" }>): NodeSpec {
  const plans = spec.plans.slice(0, 4);
  const columns = clamp(plans.length, 1, 4);
  return grid(
    r(columns, columns > 2 ? 1 : undefined, 1),
    plans.map((p, i) =>
      h(
        "PricingTable",
        {
          name: p.name,
          description: p.description,
          amount: p.price.replace(/[^\d.,]/g, "") || p.price,
          cents: p.cents,
          period: p.period,
          oldPrice: p.oldPrice,
          installments: p.installments,
          features: p.features.slice(0, 12).map((f, j) => ({ id: `f${i}${j}`, text: f.text, included: f.included })),
          ctaText: p.cta,
          featured: p.featured,
          ...(p.badge ? { badgeText: p.badge } : {}),
          footerNote: p.note,
          ...(p.featured ? {} : { button: softButton }),
        },
        [],
        p.name,
      ),
    ),
    {
      gap: r("24px", "32px"),
      align: r("stretch"),
      box: { maxWidth: r(columns === 1 ? "440px" : columns === 2 ? "840px" : "1120px", "480px"), width: r("100%") },
    },
    "Planos",
  );
}

function stats(spec: Extract<LeafSpec, { type: "Stats" }>, ctx: Ctx): NodeSpec {
  const items = spec.items.slice(0, 4);
  const columns = cols(Math.max(items.length, 2), 4, ctx);
  return grid(
    r(columns, 2, 2),
    items.map((s) =>
      h(
        "StatCounter",
        {
          value: s.value,
          decimals: clamp(s.decimals, 0, 2),
          prefix: s.prefix,
          suffix: s.suffix,
          label: s.label,
          numberTypography: { textAlign: r("center"), ...(ctx.dark ? { color: "#ffffff" } : {}) },
          labelTypography: { textAlign: r("center"), ...(ctx.dark ? { color: white(70) } : {}) },
        },
        [],
        "Contador",
      ),
    ),
    { box: { maxWidth: r("1120px"), width: r("100%") } },
    "Números",
  );
}

const FORM_FIELDS = {
  name: { type: "text", label: "Nome", name: "nome", placeholder: "Seu nome" },
  email: { type: "email", label: "E-mail", name: "email", placeholder: "seu@email.com" },
  phone: { type: "tel", label: "WhatsApp", name: "whatsapp", placeholder: "(11) 99999-9999" },
  company: { type: "text", label: "Empresa", name: "empresa", placeholder: "Nome da empresa" },
  message: { type: "textarea", label: "Mensagem", name: "mensagem", placeholder: "Como podemos ajudar?" },
} as const;

function captureForm(spec: Extract<LeafSpec, { type: "CaptureForm" }>): NodeSpec {
  const kinds = [...new Set(spec.fields)].filter((f) => f in FORM_FIELDS);
  const fields = (kinds.length ? kinds : (["name", "email"] as const)).map((k) => ({
    ...FORM_FIELDS[k],
    id: FORM_FIELDS[k].name,
    required: k !== "company" && k !== "message",
    options: "",
    value: "",
    showCountry: true,
    country: "55",
  }));
  return h(
    "Form",
    {
      fields,
      submitText: spec.submitText,
      successMessage: spec.successMessage,
      box: { width: r("100%"), maxWidth: r("520px") },
    },
    [],
    "Formulário",
  );
}

function leaf(spec: LeafSpec, ctx: Ctx): NodeSpec {
  const textColor = ctx.dark ? "#ffffff" : C.text;
  const muted = ctx.dark ? white(72) : C.textMuted;
  switch (spec.type) {
    case "Eyebrow":
      return eyebrow(spec.text, ctx.align, ctx.dark ? white(70) : C.primary);
    case "Title":
      return title(spec.text, {
        tag: spec.level,
        // half a Split: the hero scale would wrap into 6+ lines
        size: ctx.narrow && spec.size === "display" ? r("48px", "40px", "32px") : TITLE_SIZE[spec.size],
        align: ctx.align,
        color: textColor,
        maxWidth: spec.size === "display" ? "900px" : "760px",
      });
    case "Lead":
      return lead(escapeHtml(spec.text), { align: ctx.align, color: muted });
    case "Paragraph":
      return h("Text", {
        html: cleanHtml(spec.html),
        typography: {
          fontSize: r("17px", undefined, "16px"),
          lineHeight: r("1.7"),
          color: muted,
          textAlign: r(ctx.align),
        },
        linkColor: ctx.dark ? "#ffffff" : C.primary,
        box: { maxWidth: r("720px") },
      });
    case "Pill":
      return pill(
        spec.text,
        ctx.dark ? { color: "#ffffff", background: white(8), align: flex(ctx.align) } : { align: flex(ctx.align) },
      );
    case "Button":
      if (spec.variant === "secondary")
        return h("Button", {
          text: spec.text,
          icon: spec.icon ?? "",
          action: toAction(spec.action),
          padding: r(sides("18px", "32px"), undefined, sides("16px", "24px")),
          typography: { fontSize: r("17px"), fontWeight: "600", color: textColor, textAlign: r("center") },
          background: { type: "none" },
          border: {
            style: "solid",
            width: r(sides("1.5px")),
            color: ctx.dark ? white(35) : C.border,
            radius: r(corners("14px")),
          },
          shadow: { enabled: false },
          hover: { enabled: true, background: ctx.dark ? white(8) : C.surface, scale: 1 },
          box: { alignSelf: r(flex(ctx.align)) },
        });
      return cta(spec.text, {
        action: toAction(spec.action),
        light: ctx.dark,
        align: flex(ctx.align),
        icon: spec.icon ?? "arrow-right",
      });
    case "Checklist":
      return checks(spec.items.slice(0, 10), {
        icon: spec.icon ?? "check-circle",
        layout: r(spec.layout),
        align: flex(ctx.align),
        color: textColor,
        iconColor: ctx.dark ? C.accent : C.primary,
      });
    case "Image": {
      const [desktop, mobile] = IMAGE_HEIGHT[spec.ratio] ?? IMAGE_HEIGHT["4/3"];
      return picture("", spec.description, {
        height: r(desktop, undefined, mobile),
        fit: r("cover"),
        box: { width: r("100%") },
      });
    }
    case "Video":
      return h(
        "Video",
        {
          ...(spec.url ? { url: spec.url } : {}),
          border: { style: "none", radius: r(corners("20px")) },
          shadow: defaultShadow({ enabled: true, y: 32, blur: 80, spread: -20, color: tint(C.primary, 40) }),
          box: { width: r("100%"), maxWidth: r("880px") },
        },
        [],
        "Vídeo",
      );
    case "Features":
      return features(spec, ctx);
    case "Steps":
      return steps(spec, ctx);
    case "Testimonials":
      return testimonials(spec, ctx);
    case "Pricing":
      return pricing(spec);
    case "Faq":
      return faq(
        spec.items.slice(0, 12).map((i) => [escapeHtml(i.question), escapeHtml(i.answer)]),
        ctx.dark ? { titleTypography: { color: "#ffffff" }, dividerColor: white(15) } : {},
      );
    case "Stats":
      return stats(spec, ctx);
    case "CaptureForm":
      return captureForm(spec);
    case "Countdown":
      return h(
        "Countdown",
        { mode: "evergreen", durationMinutes: clamp(spec.minutes, 1, 60 * 24 * 30), align: r(flex(ctx.align)) },
        [],
        "Contagem",
      );
  }
}

/* ------------------------------------------------------------------ */
/* Groups                                                              */
/* ------------------------------------------------------------------ */

function block(spec: BlockSpec, ctx: Ctx): NodeSpec {
  switch (spec.type) {
    case "Stack": {
      const inner = { ...ctx, align: spec.align };
      // a white box always has light content, even inside a dark section
      const boxCtx = spec.boxed ? { ...inner, dark: false } : inner;
      const children = spec.children.map((c) => leaf(c, boxCtx));
      const props = {
        align: r(flex(spec.align)),
        box: {
          width: r("100%"),
          maxWidth: r(spec.boxed ? "560px" : "880px"),
          // `box` replaces the card's own, so its padding goes here too
          ...(spec.boxed ? { padding: r(sides("32px"), undefined, sides("24px")) } : {}),
        },
      };
      return spec.boxed ? card(children, props, "Caixa") : stack(children, props, "Coluna");
    }
    case "Split": {
      const left = { ...ctx, align: "left" as const, narrow: true };
      const content = stack(
        spec.content.map((c) => leaf(c, left)),
        { gap: r("20px"), align: r("flex-start") },
        "Texto",
      );
      const media = stack(
        spec.media.map((c) => leaf(c, { ...left, dark: ctx.dark })),
        { gap: r("16px"), align: r("stretch") },
        "Mídia",
      );
      const template = spec.ratio === "text-wide" ? "1.2fr 1fr" : spec.ratio === "media-wide" ? "1fr 1.2fr" : "";
      const cols = spec.mediaSide === "left" ? [media, content] : [content, media];
      const ordered = spec.mediaSide === "left" ? template.split(" ").reverse().join(" ") : template;
      return h(
        "Container",
        {
          ...containerPresets.grid(2, ordered),
          columns: r(2, undefined, 1),
          gap: r("64px", "40px", "32px"),
          align: r("center"),
          box: { width: r("100%"), maxWidth: r("1120px") },
        },
        cols,
        "Colunas",
      );
    }
    case "Grid": {
      const columns = clamp(spec.columns, 2, 4);
      const cells = spec.cells.slice(0, 8).map((cell, i) => {
        const children = cell.children.map((c) => leaf(c, ctx));
        return spec.boxed
          ? surfaceCard(children, `Card ${i + 1}`, ctx)
          : stack(children, { align: r(flex(ctx.align)) }, `Coluna ${i + 1}`);
      });
      return grid(r(columns, columns > 2 ? 2 : undefined, 1), cells, {
        align: r("stretch"),
        box: { maxWidth: r("1120px"), width: r("100%") },
      });
    }
    default:
      return leaf(spec, ctx);
  }
}

const SPACING = {
  compact: ["72px", "48px"],
  normal: ["104px", "64px"],
  spacious: ["136px", "80px"],
} as const;

function toneBackground(tone: SectionSpec["tone"]) {
  switch (tone) {
    case "surface":
      return bg(C.surface);
    case "dark":
      return darkGlow();
    case "brand":
      return defaultBackground({
        type: "gradient",
        gradient: {
          type: "linear",
          angle: 135,
          from: C.primary,
          fromPosition: 0,
          to: `color-mix(in srgb, ${C.primary} 70%, ${C.secondary})`,
          toPosition: 100,
        },
      });
    case "tint":
      return bg(tint(C.primary, 6));
    default:
      return bg(C.background);
  }
}

/**
 * Groups consecutive intro leaves (eyebrow, title, lead, pill) in one
 * tight column, like the hand-made "heading" helper.
 */
const INTRO = new Set(["Eyebrow", "Title", "Lead", "Pill"]);

export function compileSection(raw: SectionSpec): NodeSpec {
  const spec = tidyDeep(raw);
  const ctx: Ctx = { dark: spec.tone === "dark" || spec.tone === "brand", align: spec.align };
  const children: NodeSpec[] = [];
  let intro: NodeSpec[] = [];
  const flush = () => {
    if (intro.length > 1)
      children.push(stack(intro, { gap: r("16px"), align: r(flex(ctx.align)), box: { width: r("100%") } }, "Título"));
    else children.push(...intro);
    intro = [];
  };
  for (const child of spec.children) {
    if (INTRO.has(child.type)) intro.push(block(child, ctx));
    else {
      flush();
      children.push(block(child, ctx));
    }
  }
  flush();

  const [desktop, mobile] = SPACING[spec.spacing] ?? SPACING.normal;
  const anchorId = spec.anchor ? slug(spec.anchor) : "";
  // left-aligned: text starts at the edge of a centered 1120px column, like the grids below it
  const content =
    ctx.align === "left"
      ? [
          stack(
            children,
            {
              gap: r("48px", undefined, "32px"),
              align: r("flex-start"),
              box: { width: r("100%"), maxWidth: r("1120px") },
            },
            "Conteúdo",
          ),
        ]
      : children;
  return section(spec.name || "Seção", content, {
    padding: r(sides(desktop, "24px"), undefined, sides(mobile, "16px")),
    alignItems: r("center"),
    background: toneBackground(spec.tone),
    ...(anchorId ? { box: { anchorId } } : {}),
  });
}
