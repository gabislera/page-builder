import { AlignCenter, AlignLeft, AlignRight, LayoutTemplate } from "lucide-react";
import { ActionField } from "../controls/action.tsx";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
  BackgroundFields,
  BorderFields,
  BoxFields,
  MediaPathField,
  ShadowFields,
  SidesField,
  TypographyFields,
} from "../controls/groups.tsx";
import { IconField } from "../controls/icon.tsx";
import {
  NumberUnitField,
  SegmentedField,
  SelectField,
  SwitchField,
  TextAreaField,
  TextField,
} from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { actionLink } from "../core/actions.ts";
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
import { DEVICE_MEDIA, type Device, type Responsive, resolve, responsive } from "../core/responsive.ts";
import {
  applyBackground,
  applyBorder,
  applyBox,
  applyTypography,
  createSheet,
  shadowToCss,
  sidesToCss,
} from "../core/style-engine.ts";
import type { Action, Background, Border, Box, Length, Shadow, Sides, Typography } from "../core/style-types.ts";
import { C, FONT_BODY, FONT_HEADING } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import { PLACEHOLDER_IMAGE } from "./image.tsx";
import { type ButtonStyle, ButtonStyleGroups, buttonStyleCss, defaultButtonStyle } from "./shared/button-style.tsx";
import { setPerDevice } from "./shared/icon-style.tsx";

type ImagePosition = "top" | "left" | "right" | "background";
type ContentAlign = "left" | "center" | "right";

export type CardProps = {
  showImage: boolean;
  /** Imagem por dispositivo (tablet/celular podem usar outra). */
  image: Responsive<string>;
  imageAlt: string;
  imagePosition: Responsive<ImagePosition>;
  /** Imagem ao lado vira imagem no topo no celular. */
  stackOnMobile: boolean;
  /** Proporção da imagem no topo ("16/9", "auto"...). */
  imageRatio: string;
  /** Largura da imagem ao lado do conteúdo. */
  imageWidth: Responsive<Length>;
  imageFit: "cover" | "contain";
  /** Imagem de fundo: cor do degradê por cima da imagem. */
  overlayColor: string;
  /** Imagem de fundo: cor dos textos. */
  overlayTextColor: string;
  /** Imagem de fundo: altura mínima do card. */
  backgroundMinHeight: Responsive<Length>;
  /** Selo (ex.: "Novo"). Vazio = oculto. */
  badge: string;
  badgeBackground: string;
  badgeColor: string;
  title: string;
  titleTag: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  titleTypography: Typography;
  text: string;
  textTypography: Typography;
  /** Chamada: botão, link de texto ou nenhuma. */
  ctaType: "button" | "link" | "none";
  ctaText: string;
  ctaIcon: string;
  ctaAction: Action;
  button: ButtonStyle;
  linkColor: string;
  /** O card inteiro vira link. */
  cardAction: Action;
  align: Responsive<ContentAlign>;
  /** Espaço interno do conteúdo (texto). */
  padding: Responsive<Sides>;
  /** Espaço entre os elementos do conteúdo. */
  gap: Responsive<Length>;
  background: Background;
  border: Border;
  shadow: Shadow;
  /** Deslocamento para cima no hover ("0px" = desligado). */
  hoverLift: Length;
  hoverShadow: Shadow;
  /** Zoom suave da imagem no hover. */
  imageZoom: boolean;
  box: Box;
};

const TEXT_TO_FLEX: Record<ContentAlign, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

/** Posição efetiva da imagem em um dispositivo (empilha no celular). */
function positionOn(p: CardProps, d: Device): ImagePosition {
  const pos = resolve(p.imagePosition, d);
  if (d === "mobile" && p.stackOnMobile && (pos === "left" || pos === "right")) return "top";
  return pos;
}

function CardView({ id, props, rootRef, onPropChange }: NodeViewProps<CardProps>) {
  const ctx = useRender();
  const cardLink = actionLink(props.cardAction, ctx);
  const ctaLink = cardLink ? null : actionLink(props.ctaAction, ctx);
  const commit = (path: string) => onPropChange && ((v: string) => onPropChange(path, v));
  const title = useInlineEdit(props.title, commit("title"), {
    multiline: true,
  });
  const text = useInlineEdit(props.text, commit("text"), { multiline: true });
  const badgeEdit = useInlineEdit(props.badge, commit("badge"));
  const cta = useInlineEdit(props.ctaText, commit("ctaText"));
  const TitleTag = props.titleTag;

  const badge =
    props.badge || badgeEdit.editing ? (
      <span ref={badgeEdit.ref as React.Ref<HTMLSpanElement>} className="pb-card-badge" {...badgeEdit.attrs}>
        {badgeEdit.editing ? null : props.badge}
      </span>
    ) : null;

  const src = props.image.desktop || PLACEHOLDER_IMAGE;
  const media = props.showImage ? (
    <div className="pb-card-media">
      <picture>
        {props.image.mobile ? <source media={DEVICE_MEDIA.mobile ?? undefined} srcSet={props.image.mobile} /> : null}
        {props.image.tablet ? <source media={DEVICE_MEDIA.tablet ?? undefined} srcSet={props.image.tablet} /> : null}
        <img src={src} alt={props.imageAlt} loading={ctx.mode === "publish" ? "lazy" : undefined} decoding="async" />
      </picture>
      {badge}
    </div>
  ) : null;

  const ctaLabel = (
    <span ref={cta.ref as React.Ref<HTMLSpanElement>} {...cta.attrs}>
      {cta.editing ? null : props.ctaText}
    </span>
  );
  const ctaContent = (
    <>
      {ctaLabel}
      {props.ctaIcon ? <IconView name={props.ctaIcon} /> : null}
    </>
  );
  const ctaClass = props.ctaType === "button" ? "pb-btn pb-card-btn" : "pb-card-link";
  let ctaEl: React.ReactNode = null;
  if (props.ctaType !== "none" && (props.ctaText || cta.editing)) {
    ctaEl = ctaLink ? (
      <a className={ctaClass} {...ctaLink}>
        {ctaContent}
      </a>
    ) : (
      <span className={ctaClass}>{ctaContent}</span>
    );
  }

  const content = (
    <>
      {media}
      <div className="pb-card-body">
        {props.showImage ? null : badge}
        {props.title || title.editing ? (
          <TitleTag ref={title.ref as React.Ref<HTMLHeadingElement>} className="pb-card-title" {...title.attrs}>
            {title.editing ? null : <Lines text={props.title} />}
          </TitleTag>
        ) : null}
        {props.text || text.editing ? (
          <p ref={text.ref as React.Ref<HTMLParagraphElement>} className="pb-card-text" {...text.attrs}>
            {text.editing ? null : <Lines text={props.text} />}
          </p>
        ) : null}
        {ctaEl ? <div className="pb-card-footer">{ctaEl}</div> : null}
      </div>
    </>
  );

  const className = nodeClassName(id, "pb-card", props.box);
  if (cardLink) {
    return (
      <a ref={rootRef as React.Ref<HTMLAnchorElement>} className={className} data-pb-node={id} {...cardLink}>
        {content}
      </a>
    );
  }
  return (
    <div ref={rootRef as React.Ref<HTMLDivElement>} className={className} data-pb-node={id}>
      {content}
    </div>
  );
}

function CardSettings() {
  const showImage = useField<boolean>("showImage");
  const position = useField<ImagePosition>("imagePosition");
  const ctaType = useField<CardProps["ctaType"]>("ctaType");
  const side = position.value === "left" || position.value === "right";
  const bg = position.value === "background";
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Imagem">
            <SwitchField path="showImage" label="Mostrar imagem" />
            {showImage.value ? (
              <>
                <MediaPathField
                  path="image"
                  label="Arquivo"
                  accept="image"
                  hint="No tablet e no celular você pode escolher outra imagem."
                />
                <TextField path="imageAlt" label="Texto alternativo (SEO)" />
                <SelectField
                  path="imagePosition"
                  label="Posição da imagem"
                  options={[
                    { value: "top", label: "Topo" },
                    { value: "left", label: "Esquerda" },
                    { value: "right", label: "Direita" },
                    { value: "background", label: "Fundo (texto por cima)" },
                  ]}
                />
                <SwitchField
                  path="stackOnMobile"
                  label="Empilhar no celular"
                  hint="Imagem ao lado passa para o topo no celular."
                />
              </>
            ) : null}
          </Group>
          <Group title="Texto">
            <TextField path="badge" label="Selo" placeholder="ex.: Novo" hint="Opcional. Aparece sobre a imagem." />
            <TextAreaField
              path="title"
              label="Título"
              rows={2}
              hint="Dica: dê dois cliques no texto para editar direto no canvas."
            />
            <SelectField
              path="titleTag"
              label="Nível do título (SEO)"
              options={[
                { value: "h2", label: "H2" },
                { value: "h3", label: "H3" },
                { value: "h4", label: "H4" },
                { value: "h5", label: "H5" },
                { value: "h6", label: "H6" },
                { value: "p", label: "Parágrafo" },
              ]}
            />
            <TextAreaField path="text" label="Descrição" rows={4} />
          </Group>
          <Group title="Chamada">
            <SegmentedField
              path="ctaType"
              label="Tipo"
              options={[
                { value: "button", label: "Botão" },
                { value: "link", label: "Link" },
                { value: "none", label: "Nenhuma" },
              ]}
            />
            {ctaType.value !== "none" ? (
              <>
                <TextField path="ctaText" label="Texto" />
                <IconField path="ctaIcon" label="Ícone" allowNone />
                <ActionField path="ctaAction" label="Ao clicar" />
              </>
            ) : null}
          </Group>
          <Group title="Link do card" defaultOpen={false}>
            <ActionField path="cardAction" label="Ao clicar no card" />
          </Group>
        </>
      }
      style={
        <>
          <Group title="Layout">
            <SegmentedField
              path="align"
              label="Alinhamento"
              options={[
                { value: "left", label: "Esquerda", icon: AlignLeft },
                { value: "center", label: "Centro", icon: AlignCenter },
                { value: "right", label: "Direita", icon: AlignRight },
              ]}
            />
            <SidesField path="padding" label="Espaço interno do conteúdo" units={["px", "em", "%"]} />
            <NumberUnitField path="gap" label="Espaço entre os elementos" units={["px", "em"]} max={60} />
          </Group>
          {showImage.value ? (
            <Group title="Imagem">
              {!side && !bg ? (
                <SelectField
                  path="imageRatio"
                  label="Proporção"
                  options={[
                    { value: "16/9", label: "16:9" },
                    { value: "3/2", label: "3:2" },
                    { value: "4/3", label: "4:3" },
                    { value: "1/1", label: "1:1 (quadrada)" },
                    { value: "auto", label: "Original" },
                  ]}
                />
              ) : null}
              {side ? (
                <NumberUnitField path="imageWidth" label="Largura da imagem" units={["%", "px"]} max={800} />
              ) : null}
              <SegmentedField
                path="imageFit"
                label="Encaixe"
                options={[
                  { value: "cover", label: "Cobrir" },
                  { value: "contain", label: "Conter" },
                ]}
              />
              {bg ? (
                <>
                  <ColorField path="overlayColor" label="Cor da sobreposição" />
                  <ColorField path="overlayTextColor" label="Cor dos textos" />
                  <NumberUnitField path="backgroundMinHeight" label="Altura mínima" units={["px", "vh"]} max={900} />
                </>
              ) : null}
            </Group>
          ) : null}
          <Group title="Selo" defaultOpen={false}>
            <ColorField path="badgeBackground" label="Fundo" />
            <ColorField path="badgeColor" label="Texto" />
          </Group>
          <Group title="Título" defaultOpen={false}>
            <TypographyFields base="titleTypography" withAlign={false} />
          </Group>
          <Group title="Descrição" defaultOpen={false}>
            <TypographyFields base="textTypography" withAlign={false} />
          </Group>
          {ctaType.value === "button" ? <ButtonStyleGroups base="button" /> : null}
          {ctaType.value === "link" ? (
            <Group title="Link" defaultOpen={false}>
              <ColorField path="linkColor" label="Cor" />
            </Group>
          ) : null}
          <Group title="Card" defaultOpen={false}>
            <BackgroundFields base="background" />
          </Group>
          <Group title="Borda" defaultOpen={false}>
            <BorderFields base="border" />
          </Group>
          <Group title="Sombra" defaultOpen={false}>
            <ShadowFields base="shadow" />
          </Group>
          <Group title="Hover" defaultOpen={false}>
            <NumberUnitField path="hoverLift" label="Subir no hover" units={["px"]} max={24} />
            <SwitchField path="imageZoom" label="Zoom na imagem" />
            <ShadowFields base="hoverShadow" />
          </Group>
        </>
      }
      advanced={<BoxFields />}
    />
  );
}

export const Card: ComponentDefinition<CardProps> = {
  type: "Card",
  displayName: "Card",
  category: "basic",
  icon: LayoutTemplate,
  inToolbox: true,
  defaults: {
    showImage: true,
    image: responsive(""),
    imageAlt: "",
    imagePosition: responsive("top"),
    stackOnMobile: true,
    imageRatio: "3/2",
    imageWidth: responsive("40%"),
    imageFit: "cover",
    overlayColor: "#000000",
    overlayTextColor: "#ffffff",
    backgroundMinHeight: responsive("380px", undefined, "320px"),
    badge: "Novo",
    badgeBackground: C.primary,
    badgeColor: "#ffffff",
    title: "Título do card",
    titleTag: "h3",
    titleTypography: defaultTypography({
      fontFamily: FONT_HEADING,
      fontSize: responsive("20px", undefined, "18px"),
      fontWeight: "700",
      lineHeight: responsive("1.3"),
      color: C.text,
    }),
    text: "Descreva em uma ou duas frases o que a pessoa encontra aqui e por que vale a pena.",
    textTypography: defaultTypography({
      fontFamily: FONT_BODY,
      fontSize: responsive("15px"),
      lineHeight: responsive("1.6"),
      color: C.textMuted,
    }),
    ctaType: "link",
    ctaText: "Saiba mais",
    ctaIcon: "arrow-right",
    ctaAction: { type: "url", url: "", newTab: false },
    button: defaultButtonStyle({
      fullWidth: responsive(false),
      padding: responsive(sides("12px", "22px")),
      typography: defaultTypography({
        fontSize: responsive("15px"),
        fontWeight: "600",
        lineHeight: responsive("1.2"),
        textAlign: responsive("center"),
        color: "#ffffff",
      }),
      shadow: defaultShadow(),
      border: defaultBorder({ radius: responsive(corners("8px")) }),
    }),
    linkColor: C.primary,
    cardAction: { type: "none" },
    align: responsive("left"),
    padding: responsive(sides("24px"), undefined, sides("20px")),
    gap: responsive("10px"),
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
    hoverLift: "4px",
    hoverShadow: defaultShadow({
      enabled: true,
      y: 16,
      blur: 36,
      color: "#0000001f",
    }),
    imageZoom: true,
    box: defaultBox(),
  },
  View: CardView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const root = sheet.root();
    const imageOn = (d: Device) => (p.showImage ? positionOn(p, d) : "top");
    root
      .set("display", "flex")
      .set("position", "relative")
      .set("overflow", "hidden")
      .set("min-width", "0")
      .set("text-decoration", "none")
      .set("color", "inherit")
      .set("box-shadow", shadowToCss(p.shadow))
      .set("transition", "transform .25s ease,box-shadow .25s ease,border-color .25s ease");
    applyBackground(root, p.background);
    applyBorder(root, p.border);
    setPerDevice(root, (d) => {
      const pos = imageOn(d);
      return {
        "flex-direction": pos === "left" ? "row" : pos === "right" ? "row-reverse" : "column",
        "min-height": pos === "background" ? resolve(p.backgroundMinHeight, d) : "0px",
      };
    });
    if (p.cardAction.type !== "none") root.set("cursor", "pointer");

    const hoverTransform =
      p.hoverLift && Number.parseFloat(p.hoverLift) !== 0 ? `translateY(-${p.hoverLift})` : undefined;
    sheet.rule(":hover").set("transform", hoverTransform).set("box-shadow", shadowToCss(p.hoverShadow));

    // imagem
    if (p.showImage) {
      const ratio = p.imageRatio === "auto" ? "auto" : p.imageRatio;
      const media = sheet.rule(" .pb-card-media");
      media.set("overflow", "hidden").set("flex-shrink", "0").set("background-color", C.surface);
      setPerDevice(media, (d) => {
        const pos = imageOn(d);
        if (pos === "background")
          return {
            position: "absolute",
            inset: "0",
            width: "auto",
            "aspect-ratio": "auto",
            "min-height": "0px",
          };
        if (pos === "left" || pos === "right")
          return {
            position: "relative",
            inset: "auto",
            width: resolve(p.imageWidth, d),
            "aspect-ratio": "auto",
            "min-height": "200px",
          };
        return {
          position: "relative",
          inset: "auto",
          width: "100%",
          "aspect-ratio": ratio,
          "min-height": "0px",
        };
      });
      const img = sheet.rule(" .pb-card-media img");
      img.set("width", "100%").set("object-fit", p.imageFit).set("transition", "transform .5s ease");
      setPerDevice(img, (d) => {
        const pos = imageOn(d);
        const fill = pos !== "top" || ratio !== "auto";
        return {
          position: pos === "top" ? "static" : "absolute",
          inset: pos === "top" ? "auto" : "0",
          height: fill ? "100%" : "auto",
        };
      });
      if (p.imageZoom) sheet.rule(":hover .pb-card-media img").set("transform", "scale(1.05)");
      // sobreposição só com a imagem de fundo
      const overlay = sheet.rule(" .pb-card-media::after");
      overlay
        .set("content", '""')
        .set("position", "absolute")
        .set("inset", "0")
        .set("pointer-events", "none")
        .set(
          "background",
          `linear-gradient(to top, color-mix(in srgb, ${p.overlayColor} 82%, transparent), color-mix(in srgb, ${p.overlayColor} 15%, transparent))`,
        );
      setPerDevice(overlay, (d) => ({
        display: imageOn(d) === "background" ? "block" : "none",
      }));
    }

    // selo
    const badge = sheet.rule(" .pb-card-badge");
    badge
      .set("display", "inline-flex")
      .set("align-items", "center")
      .set("padding", "4px 10px")
      .set("border-radius", "999px")
      .set("font-size", "12px")
      .set("font-weight", "600")
      .set("line-height", "1.4")
      .set("letter-spacing", ".02em")
      .set("background-color", p.badgeBackground)
      .set("color", p.badgeColor);
    if (p.showImage) {
      badge.set("position", "absolute").set("top", "14px").set("left", "14px").set("z-index", "1");
    } else {
      badge.set("align-self", p.align, (v) => TEXT_TO_FLEX[v]);
    }

    // conteúdo
    const body = sheet.rule(" .pb-card-body");
    body
      .set("position", "relative")
      .set("z-index", "1")
      .set("display", "flex")
      .set("flex-direction", "column")
      .set("flex", "1 1 auto")
      .set("min-width", "0")
      .set("padding", p.padding, sidesToCss)
      .set("gap", p.gap)
      .set("text-align", p.align);
    setPerDevice(body, (d) => ({
      "justify-content": imageOn(d) === "background" ? "flex-end" : "flex-start",
    }));

    const title = sheet.rule(" .pb-card-title");
    applyTypography(title, { ...p.titleTypography, textAlign: undefined });
    title.set("overflow-wrap", "break-word");
    const text = sheet.rule(" .pb-card-text");
    applyTypography(text, { ...p.textTypography, textAlign: undefined });
    text.set("overflow-wrap", "break-word");
    if (p.showImage) {
      // textos claros sobre a imagem de fundo
      setPerDevice(title, (d) => ({
        color: imageOn(d) === "background" ? p.overlayTextColor : p.titleTypography.color,
      }));
      setPerDevice(text, (d) => ({
        color:
          imageOn(d) === "background"
            ? `color-mix(in srgb, ${p.overlayTextColor} 85%, transparent)`
            : p.textTypography.color,
      }));
    }

    const footer = sheet.rule(" .pb-card-footer");
    footer
      .set("display", "flex")
      .set("margin-top", "auto")
      .set("padding-top", "6px")
      .set("justify-content", p.align, (v) => TEXT_TO_FLEX[v]);

    sheet
      .rule(" .pb-card-link")
      .set("display", "inline-flex")
      .set("align-items", "center")
      .set("gap", ".4em")
      .set("font-weight", "600")
      .set("font-size", "15px")
      .set("color", p.linkColor)
      .set("transition", "gap .2s ease");
    sheet.rule(":hover .pb-card-link").set("gap", ".65em");
    sheet.rule(" .pb-card-link svg").set("width", "1.1em").set("height", "1.1em");

    applyBox(sheet, { ...p.box, padding: undefined }, "flex");
    return sheet.toString() + (p.ctaType === "button" ? buttonStyleCss(id, ".pb-card-btn", p.button) : "");
  },
  Settings: CardSettings,
  fonts: (p) => [p.titleTypography.fontFamily, p.textTypography.fontFamily, p.button.typography.fontFamily],
};
