import { AlignCenter, AlignLeft, AlignRight, MessageSquareQuote } from "lucide-react";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
  BackgroundFields,
  BorderFields,
  BoxFields,
  MediaPathField,
  NumberField,
  ShadowFields,
  SidesField,
  TypographyFields,
} from "../controls/groups.tsx";
import { IconField } from "../controls/icon.tsx";
import { NumberUnitField, SegmentedField, SwitchField, TextAreaField, TextField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import {
  corners,
  defaultBackground,
  defaultBorder,
  defaultBox,
  defaultShadow,
  defaultTypography,
  sides,
} from "../core/defaults.ts";
import { IconView } from "../core/icons.tsx";
import { Lines, useInlineEdit } from "../core/inline-edit.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useRender } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
  applyBackground,
  applyBorder,
  applyBox,
  applyTypography,
  createSheet,
  shadowToCss,
  sidesToCss,
} from "../core/style-engine.ts";
import type { Background, Border, Box, Length, Shadow, Sides, Typography } from "../core/style-types.ts";
import { C, FONT_BODY, FONT_HEADING } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

type Layout = "card" | "centered" | "bubble";
type ContentAlign = "left" | "center" | "right";

export type TestimonialProps = {
  quote: string;
  name: string;
  role: string;
  /** Foto (vazio = iniciais do nome). */
  avatar: string;
  showAvatar: boolean;
  avatarSize: Responsive<Length>;
  /** 0 a 5 estrelas (0 = oculto). */
  rating: number;
  starColor: string;
  starEmptyColor: string;
  starSize: Length;
  /**
   * card: citação e autor abaixo; centered: foto no topo e tudo centralizado;
   * bubble: balão de fala e autor abaixo.
   */
  layout: Layout;
  /** Alinhamento nos layouts card e bubble. */
  align: ContentAlign;
  showQuoteIcon: boolean;
  quoteIcon: string;
  quoteIconColor: string;
  quoteIconSize: Length;
  quoteTypography: Typography;
  nameTypography: Typography;
  roleTypography: Typography;
  /** Espaço entre os blocos. */
  gap: Responsive<Length>;
  /** Caixa (no layout balão, aplica-se ao balão). */
  padding: Responsive<Sides>;
  background: Background;
  border: Border;
  shadow: Shadow;
  box: Box;
};

const TEXT_TO_FLEX: Record<ContentAlign, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

function TestimonialView({ id, props, rootRef, onPropChange }: NodeViewProps<TestimonialProps>) {
  const ctx = useRender();
  const commit = (path: string) => onPropChange && ((v: string) => onPropChange(path, v));
  const quote = useInlineEdit(props.quote, commit("quote"), {
    multiline: true,
  });
  const name = useInlineEdit(props.name, commit("name"));
  const role = useInlineEdit(props.role, commit("role"));
  const rating = Math.max(0, Math.min(5, Math.round(props.rating || 0)));

  const avatar = props.showAvatar ? (
    <span className="pb-testi-avatar">
      {props.avatar ? (
        <img
          src={props.avatar}
          alt={props.name}
          loading={ctx.mode === "publish" ? "lazy" : undefined}
          decoding="async"
        />
      ) : (
        <span aria-hidden="true">{initials(props.name) || "?"}</span>
      )}
    </span>
  ) : null;

  const quoteIcon =
    props.showQuoteIcon && props.quoteIcon ? (
      <span className="pb-testi-qicon">
        <IconView name={props.quoteIcon} />
      </span>
    ) : null;

  const stars =
    rating > 0 ? (
      <span className="pb-testi-stars" role="img" aria-label={`${rating} de 5 estrelas`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= rating ? "pb-testi-star is-on" : "pb-testi-star"}>
            <IconView name="star" />
          </span>
        ))}
      </span>
    ) : null;

  const quoteEl = (
    <blockquote ref={quote.ref as React.Ref<HTMLQuoteElement>} className="pb-testi-quote" {...quote.attrs}>
      {quote.editing ? null : <Lines text={props.quote} />}
    </blockquote>
  );

  const meta = (
    <span className="pb-testi-meta">
      {props.name || name.editing ? (
        <span ref={name.ref as React.Ref<HTMLSpanElement>} className="pb-testi-name" {...name.attrs}>
          {name.editing ? null : props.name}
        </span>
      ) : null}
      {props.role || role.editing ? (
        <span ref={role.ref as React.Ref<HTMLSpanElement>} className="pb-testi-role" {...role.attrs}>
          {role.editing ? null : props.role}
        </span>
      ) : null}
    </span>
  );

  let content: React.ReactNode;
  if (props.layout === "centered") {
    content = (
      <>
        {avatar}
        {quoteIcon}
        {stars}
        {quoteEl}
        {meta}
      </>
    );
  } else if (props.layout === "bubble") {
    content = (
      <>
        <div className="pb-testi-bubble">
          {quoteIcon}
          {stars}
          {quoteEl}
        </div>
        <figcaption className="pb-testi-author">
          {avatar}
          {meta}
        </figcaption>
      </>
    );
  } else {
    content = (
      <>
        {quoteIcon}
        {stars}
        {quoteEl}
        <figcaption className="pb-testi-author">
          {avatar}
          {meta}
        </figcaption>
      </>
    );
  }

  return (
    <figure
      ref={rootRef as React.Ref<HTMLElement>}
      className={nodeClassName(id, `pb-testi pb-testi-${props.layout}`, props.box)}
      data-pb-node={id}
    >
      {content}
    </figure>
  );
}

function TestimonialSettings() {
  const layout = useField<Layout>("layout");
  const showQuoteIcon = useField<boolean>("showQuoteIcon");
  const showAvatar = useField<boolean>("showAvatar");
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Depoimento">
            <TextAreaField
              path="quote"
              label="Texto"
              rows={5}
              hint="Dica: dê dois cliques no texto para editar direto no canvas."
            />
            <NumberField path="rating" label="Estrelas (0 = ocultar)" max={5} />
          </Group>
          <Group title="Autor">
            <TextField path="name" label="Nome" />
            <TextField path="role" label="Cargo / empresa" />
            <SwitchField path="showAvatar" label="Mostrar foto" />
            {showAvatar.value ? (
              <MediaPathField
                path="avatar"
                label="Foto"
                accept="image"
                hint="Sem foto, mostramos as iniciais do nome."
              />
            ) : null}
          </Group>
          <Group title="Layout">
            <SegmentedField
              path="layout"
              label="Modelo"
              options={[
                { value: "card", label: "Card" },
                { value: "centered", label: "Centralizado" },
                { value: "bubble", label: "Balão" },
              ]}
            />
            {layout.value !== "centered" ? (
              <SegmentedField
                path="align"
                label="Alinhamento"
                options={[
                  { value: "left", label: "Esquerda", icon: AlignLeft },
                  { value: "center", label: "Centro", icon: AlignCenter },
                  { value: "right", label: "Direita", icon: AlignRight },
                ]}
              />
            ) : null}
            <SwitchField path="showQuoteIcon" label="Ícone de aspas" />
            {showQuoteIcon.value ? <IconField path="quoteIcon" label="Ícone" /> : null}
          </Group>
        </>
      }
      style={
        <>
          <Group title="Espaçamento">
            <NumberUnitField path="gap" label="Espaço entre os blocos" units={["px", "em"]} max={60} />
            <SidesField
              path="padding"
              label={layout.value === "bubble" ? "Espaço interno do balão" : "Espaço interno"}
              units={["px", "em", "%"]}
            />
          </Group>
          <Group title="Depoimento" defaultOpen={false}>
            <TypographyFields base="quoteTypography" withAlign={false} />
          </Group>
          <Group title="Nome" defaultOpen={false}>
            <TypographyFields base="nameTypography" withAlign={false} />
          </Group>
          <Group title="Cargo / empresa" defaultOpen={false}>
            <TypographyFields base="roleTypography" withAlign={false} />
          </Group>
          <Group title="Foto e estrelas" defaultOpen={false}>
            <NumberUnitField path="avatarSize" label="Tamanho da foto" units={["px"]} max={200} />
            <ColorField path="starColor" label="Cor das estrelas" />
            <ColorField path="starEmptyColor" label="Estrelas vazias" />
            <NumberUnitField path="starSize" label="Tamanho das estrelas" units={["px", "em"]} max={48} />
          </Group>
          {showQuoteIcon.value ? (
            <Group title="Ícone de aspas" defaultOpen={false}>
              <ColorField path="quoteIconColor" label="Cor" />
              <NumberUnitField path="quoteIconSize" label="Tamanho" units={["px", "em"]} max={120} />
            </Group>
          ) : null}
          <Group title={layout.value === "bubble" ? "Balão" : "Caixa"} defaultOpen={false}>
            <BackgroundFields base="background" />
          </Group>
          <Group title="Borda" defaultOpen={false}>
            <BorderFields base="border" />
          </Group>
          <Group title="Sombra" defaultOpen={false}>
            <ShadowFields base="shadow" />
          </Group>
        </>
      }
      advanced={<BoxFields />}
    />
  );
}

export const Testimonial: ComponentDefinition<TestimonialProps> = {
  type: "Testimonial",
  displayName: "Depoimento",
  category: "conversion",
  icon: MessageSquareQuote,
  inToolbox: true,
  defaults: {
    quote:
      "Em três semanas eu já tinha recuperado o investimento. O passo a passo é direto ao ponto e o suporte responde rápido. Recomendo de olhos fechados!",
    name: "Mariana Costa",
    role: "Fundadora da Ateliê Aurora",
    avatar: "",
    showAvatar: true,
    avatarSize: responsive("48px"),
    rating: 5,
    starColor: C.accent,
    starEmptyColor: C.border,
    starSize: "18px",
    layout: "card",
    align: "left",
    showQuoteIcon: false,
    quoteIcon: "quote",
    quoteIconColor: `color-mix(in srgb, ${C.primary} 35%, transparent)`,
    quoteIconSize: "36px",
    quoteTypography: defaultTypography({
      fontFamily: FONT_BODY,
      fontSize: responsive("17px", undefined, "16px"),
      lineHeight: responsive("1.65"),
      color: C.text,
    }),
    nameTypography: defaultTypography({
      fontFamily: FONT_HEADING,
      fontSize: responsive("16px"),
      fontWeight: "700",
      lineHeight: responsive("1.3"),
      color: C.text,
    }),
    roleTypography: defaultTypography({
      fontFamily: FONT_BODY,
      fontSize: responsive("14px"),
      lineHeight: responsive("1.4"),
      color: C.textMuted,
    }),
    gap: responsive("20px"),
    padding: responsive(sides("28px"), undefined, sides("22px")),
    background: defaultBackground({ type: "color", color: C.background }),
    border: defaultBorder({
      style: "solid",
      color: C.border,
      radius: responsive(corners("16px")),
    }),
    shadow: defaultShadow({
      enabled: true,
      y: 4,
      blur: 16,
      color: "#0000000d",
    }),
    box: defaultBox(),
  },
  View: TestimonialView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const root = sheet.root();
    const bubble = p.layout === "bubble";
    const align: ContentAlign = p.layout === "centered" ? "center" : p.align;
    // no balão, a caixa (fundo/borda/sombra/espaço) é o próprio balão
    const boxRule = bubble ? sheet.rule(" .pb-testi-bubble") : root;

    root
      .set("display", "flex")
      .set("flex-direction", "column")
      .set("align-items", TEXT_TO_FLEX[align])
      .set("text-align", align)
      .set("gap", p.gap)
      .set("margin", "0")
      .set("min-width", "0");
    boxRule.set("padding", p.padding, sidesToCss).set("box-shadow", shadowToCss(p.shadow));
    applyBackground(boxRule, p.background);
    applyBorder(boxRule, p.border);

    if (bubble && p.background.type !== "none") {
      // ponta do balão, na mesma cor do fundo
      const tipColor = p.background.type === "color" ? p.background.color : C.surface;
      const tipSide = align === "center" ? "calc(50% - 10px)" : align === "right" ? "auto" : "32px";
      sheet
        .rule(" .pb-testi-bubble::after")
        .set("content", '""')
        .set("position", "absolute")
        .set("bottom", "-9px")
        .set("left", tipSide)
        .set("right", align === "right" ? "32px" : undefined)
        .set("width", "18px")
        .set("height", "18px")
        .set("transform", "rotate(45deg)")
        .set("background-color", tipColor)
        .set(
          "border-right",
          p.border.style !== "none" ? `${p.border.width.desktop.right} ${p.border.style} ${p.border.color}` : undefined,
        )
        .set(
          "border-bottom",
          p.border.style !== "none"
            ? `${p.border.width.desktop.bottom} ${p.border.style} ${p.border.color}`
            : undefined,
        );
      sheet.rule(" .pb-testi-author").set("padding", align === "center" ? "0" : "0 16px");
    }
    if (bubble) {
      sheet
        .rule(" .pb-testi-bubble")
        .set("position", "relative")
        .set("display", "flex")
        .set("flex-direction", "column")
        .set("align-items", TEXT_TO_FLEX[align])
        .set("gap", "12px")
        .set("align-self", "stretch");
    }

    sheet.rule(" .pb-testi-qicon").set("display", "inline-flex").set("line-height", "0").set("color", p.quoteIconColor);
    sheet.rule(" .pb-testi-qicon svg").set("width", p.quoteIconSize).set("height", p.quoteIconSize);

    sheet.rule(" .pb-testi-stars").set("display", "inline-flex").set("gap", "2px").set("line-height", "0");
    sheet.rule(" .pb-testi-star").set("display", "inline-flex").set("color", p.starEmptyColor);
    sheet.rule(" .pb-testi-star.is-on").set("color", p.starColor);
    sheet.rule(" .pb-testi-star svg").set("width", p.starSize).set("height", p.starSize).set("fill", "currentColor");

    const quote = sheet.rule(" .pb-testi-quote");
    applyTypography(quote, { ...p.quoteTypography, textAlign: undefined });
    quote.set("margin", "0").set("overflow-wrap", "break-word");

    sheet
      .rule(" .pb-testi-author")
      .set("display", "flex")
      .set("align-items", "center")
      .set("gap", "12px")
      .set("flex-direction", align === "right" ? "row-reverse" : "row")
      .set("margin-top", p.layout === "card" ? "auto" : undefined);

    sheet
      .rule(" .pb-testi-avatar")
      .set("display", "inline-flex")
      .set("align-items", "center")
      .set("justify-content", "center")
      .set("flex-shrink", "0")
      .set("width", p.avatarSize)
      .set("height", p.avatarSize)
      .set("border-radius", "50%")
      .set("overflow", "hidden")
      .set("background-color", `color-mix(in srgb, ${C.primary} 14%, transparent)`)
      .set("color", C.primary)
      .set("font-weight", "700")
      .set("font-size", "15px");
    sheet.rule(" .pb-testi-avatar img").set("width", "100%").set("height", "100%").set("object-fit", "cover");

    sheet
      .rule(" .pb-testi-meta")
      .set("display", "flex")
      .set("flex-direction", "column")
      .set("gap", "2px")
      .set("min-width", "0");
    applyTypography(sheet.rule(" .pb-testi-name"), {
      ...p.nameTypography,
      textAlign: undefined,
    });
    applyTypography(sheet.rule(" .pb-testi-role"), {
      ...p.roleTypography,
      textAlign: undefined,
    });

    applyBox(sheet, bubble ? p.box : { ...p.box, padding: undefined }, "flex");
    return sheet.toString();
  },
  Settings: TestimonialSettings,
  fonts: (p) => [p.quoteTypography.fontFamily, p.nameTypography.fontFamily, p.roleTypography.fontFamily],
};
