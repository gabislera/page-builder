import { AlignCenter, AlignLeft, AlignRight, SquareStar } from "lucide-react";
import { ActionField } from "../controls/action.tsx";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
  BackgroundFields,
  BorderFields,
  BoxFields,
  HoverFields,
  ShadowFields,
  SidesField,
  TypographyFields,
} from "../controls/groups.tsx";
import { IconField } from "../controls/icon.tsx";
import { NumberUnitField, SegmentedField, SelectField, TextAreaField, TextField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { actionLink } from "../core/actions.ts";
import {
  corners,
  defaultBackground,
  defaultBorder,
  defaultBox,
  defaultHover,
  defaultShadow,
  defaultTypography,
  sides,
} from "../core/defaults.ts";
import { IconView } from "../core/icons.tsx";
import { Lines, mergeRefs, useInlineEdit } from "../core/inline-edit.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useRender } from "../core/render-context.tsx";
import { type Responsive, resolve, responsive } from "../core/responsive.ts";
import {
  applyBackground,
  applyBorder,
  applyBox,
  applyTypography,
  createSheet,
  shadowToCss,
  sidesToCss,
} from "../core/style-engine.ts";
import type { Action, Background, Border, Box, Hover, Length, Shadow, Sides, Typography } from "../core/style-types.ts";
import { C, FONT_BODY, FONT_HEADING } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import {
  applyIconStyle,
  defaultIconStyle,
  IconHoverFields,
  type IconStyle,
  IconStyleFields,
  setPerDevice,
} from "./shared/icon-style.tsx";

type Position = "top" | "left" | "right";
type ContentAlign = "left" | "center" | "right";

export type IconBoxProps = {
  icon: IconStyle;
  iconPosition: Responsive<Position>;
  /** Alinhamento vertical do ícone quando ao lado do texto. */
  iconVerticalAlign: "top" | "center";
  align: Responsive<ContentAlign>;
  title: string;
  titleTag: "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  titleTypography: Typography;
  description: string;
  descriptionTypography: Typography;
  /** Texto de chamada no fim da caixa (ex.: "Saiba mais"). Vazio = oculto. */
  linkText: string;
  linkColor: string;
  /** Espaço entre o ícone e o texto. */
  iconSpacing: Responsive<Length>;
  /** Espaço entre o título e a descrição. */
  titleSpacing: Responsive<Length>;
  /** A caixa inteira vira link. */
  action: Action;
  padding: Responsive<Sides>;
  background: Background;
  border: Border;
  shadow: Shadow;
  hover: Hover;
  /** Deslocamento para cima no hover (px). */
  hoverLift: Length;
  hoverShadow: Shadow;
  box: Box;
};

const TEXT_TO_FLEX: Record<ContentAlign, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

function IconBoxView({ id, props, rootRef, onPropChange }: NodeViewProps<IconBoxProps>) {
  const ctx = useRender();
  const link = actionLink(props.action, ctx);
  const title = useInlineEdit(props.title, onPropChange && ((v) => onPropChange("title", v)), { multiline: true });
  const description = useInlineEdit(props.description, onPropChange && ((v) => onPropChange("description", v)), {
    multiline: true,
  });
  const more = useInlineEdit(props.linkText, onPropChange && ((v) => onPropChange("linkText", v)));
  const TitleTag = props.titleTag;
  const className = nodeClassName(id, "pb-iconbox", props.box);

  const content = (
    <>
      {props.icon.name ? (
        <span className="pb-iconbox-icon">
          <IconView name={props.icon.name} strokeWidth={props.icon.strokeWidth} />
        </span>
      ) : null}
      <div className="pb-iconbox-content">
        {props.title || title.editing ? (
          <TitleTag ref={title.ref as React.Ref<HTMLHeadingElement>} className="pb-iconbox-title" {...title.attrs}>
            {title.editing ? null : <Lines text={props.title} />}
          </TitleTag>
        ) : null}
        {props.description || description.editing ? (
          <p
            ref={description.ref as React.Ref<HTMLParagraphElement>}
            className="pb-iconbox-desc"
            {...description.attrs}
          >
            {description.editing ? null : <Lines text={props.description} />}
          </p>
        ) : null}
        {props.linkText ? (
          <span ref={more.ref as React.Ref<HTMLSpanElement>} className="pb-iconbox-more" {...more.attrs}>
            {more.editing ? null : props.linkText}
          </span>
        ) : null}
      </div>
    </>
  );

  if (link) {
    return (
      <a ref={mergeRefs(rootRef) as React.Ref<HTMLAnchorElement>} className={className} data-pb-node={id} {...link}>
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

function IconBoxSettings() {
  const hoverOn = useField<boolean>("hover.enabled");
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Ícone">
            <IconField path="icon.name" label="Ícone" />
            <SegmentedField
              path="iconPosition"
              label="Posição do ícone"
              hint="No celular, use “Topo” para empilhar o ícone sobre o texto."
              options={[
                { value: "top", label: "Topo" },
                { value: "left", label: "Esquerda" },
                { value: "right", label: "Direita" },
              ]}
            />
          </Group>
          <Group title="Texto">
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
            <TextAreaField path="description" label="Descrição" rows={4} />
            <TextField
              path="linkText"
              label="Texto de chamada"
              placeholder="ex.: Saiba mais"
              hint="Opcional. Aparece abaixo da descrição."
            />
          </Group>
          <Group title="Link" defaultOpen={false}>
            <ActionField path="action" label="Ao clicar na caixa" />
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
            <SegmentedField
              path="iconVerticalAlign"
              label="Ícone ao lado: posição vertical"
              options={[
                { value: "top", label: "Topo" },
                { value: "center", label: "Centro" },
              ]}
            />
            <NumberUnitField path="iconSpacing" label="Espaço entre ícone e texto" units={["px", "em"]} max={80} />
            <NumberUnitField
              path="titleSpacing"
              label="Espaço entre título e descrição"
              units={["px", "em"]}
              max={60}
            />
          </Group>
          <Group title="Ícone">
            <IconStyleFields base="icon" />
          </Group>
          <Group title="Título" defaultOpen={false}>
            <TypographyFields base="titleTypography" withAlign={false} />
          </Group>
          <Group title="Descrição" defaultOpen={false}>
            <TypographyFields base="descriptionTypography" withAlign={false} />
          </Group>
          <Group title="Texto de chamada" defaultOpen={false}>
            <ColorField path="linkColor" label="Cor" />
          </Group>
          <Group title="Caixa" defaultOpen={false}>
            <SidesField path="padding" label="Espaço interno" units={["px", "em", "%"]} />
            <BackgroundFields base="background" />
          </Group>
          <Group title="Borda" defaultOpen={false}>
            <BorderFields base="border" />
          </Group>
          <Group title="Sombra" defaultOpen={false}>
            <ShadowFields base="shadow" />
          </Group>
          <Group title="Hover" defaultOpen={false}>
            <HoverFields base="hover" withColor={false} />
            {hoverOn.value ? (
              <>
                <NumberUnitField path="hoverLift" label="Subir no hover" units={["px"]} max={24} />
                <ShadowFields base="hoverShadow" />
              </>
            ) : null}
            <IconHoverFields base="icon" />
          </Group>
        </>
      }
      advanced={<BoxFields />}
    />
  );
}

export const IconBox: ComponentDefinition<IconBoxProps> = {
  type: "IconBox",
  displayName: "Card com ícone",
  category: "basic",
  icon: SquareStar,
  inToolbox: true,
  defaults: {
    icon: defaultIconStyle({
      name: "zap",
      size: responsive("28px"),
      view: "stacked",
      shape: "rounded",
      padding: responsive("14px"),
      background: `color-mix(in srgb, ${C.primary} 12%, transparent)`,
    }),
    iconPosition: responsive("top"),
    iconVerticalAlign: "top",
    align: responsive("left"),
    title: "Resultado rápido",
    titleTag: "h3",
    titleTypography: defaultTypography({
      fontFamily: FONT_HEADING,
      fontSize: responsive("20px", undefined, "18px"),
      fontWeight: "700",
      lineHeight: responsive("1.3"),
      color: C.text,
    }),
    description: "Explique o benefício em uma ou duas frases.",
    descriptionTypography: defaultTypography({
      fontFamily: FONT_BODY,
      fontSize: responsive("16px", undefined, "15px"),
      lineHeight: responsive("1.6"),
      color: C.textMuted,
    }),
    linkText: "",
    linkColor: C.primary,
    iconSpacing: responsive("16px"),
    titleSpacing: responsive("8px"),
    action: { type: "none" },
    padding: responsive(sides("24px")),
    background: defaultBackground({ type: "none" }),
    border: defaultBorder({ radius: responsive(corners("12px")) }),
    shadow: defaultShadow(),
    hover: defaultHover(),
    hoverLift: "4px",
    hoverShadow: defaultShadow({ enabled: true, y: 12, blur: 32 }),
    box: defaultBox(),
  },
  View: IconBoxView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const root = sheet.root();
    root
      .set("display", "flex")
      .set("padding", p.padding, sidesToCss)
      .set("box-shadow", shadowToCss(p.shadow))
      .set("text-align", p.align);
    // direção e alinhamento dependem da posição do ícone + alinhamento do texto
    setPerDevice(root, (d) => {
      const position = resolve(p.iconPosition, d);
      const align = resolve(p.align, d);
      return {
        "flex-direction": position === "top" ? "column" : position === "right" ? "row-reverse" : "row",
        "align-items":
          position === "top" ? TEXT_TO_FLEX[align] : p.iconVerticalAlign === "center" ? "center" : "flex-start",
      };
    });
    root.set("gap", p.iconSpacing);
    applyBackground(root, p.background);
    applyBorder(root, p.border);

    // hover da caixa: cores/zoom do HoverFields + subir + sombra
    if (p.hover.enabled) {
      root.set(
        "transition",
        `transform ${p.hover.durationMs}ms ease,box-shadow ${p.hover.durationMs}ms ease,background-color ${p.hover.durationMs}ms ease,border-color ${p.hover.durationMs}ms ease,opacity ${p.hover.durationMs}ms ease`,
      );
      const transforms = [
        p.hoverLift && parseFloat(p.hoverLift) !== 0 ? `translateY(-${p.hoverLift})` : "",
        p.hover.scale !== 1 ? `scale(${p.hover.scale})` : "",
      ].filter(Boolean);
      sheet
        .rule(":hover")
        .set("background", p.hover.background || undefined)
        .set("border-color", p.hover.borderColor || undefined)
        .set("opacity", p.hover.opacity === 1 ? undefined : p.hover.opacity)
        .set("transform", transforms.join(" ") || undefined)
        .set("box-shadow", shadowToCss(p.hoverShadow));
    }

    applyIconStyle(sheet, " .pb-iconbox-icon", ":hover .pb-iconbox-icon", p.icon);

    sheet.rule(" .pb-iconbox-content").set("min-width", "0").set("max-width", "100%");

    const title = sheet.rule(" .pb-iconbox-title");
    // o alinhamento vem da caixa (prop "align")
    applyTypography(title, { ...p.titleTypography, textAlign: undefined });
    title.set("overflow-wrap", "break-word");
    sheet.rule(" .pb-iconbox-title + *").set("margin-top", p.titleSpacing);

    const desc = sheet.rule(" .pb-iconbox-desc");
    applyTypography(desc, {
      ...p.descriptionTypography,
      textAlign: undefined,
    });
    desc.set("overflow-wrap", "break-word");

    sheet
      .rule(" .pb-iconbox-more")
      .set("display", "inline-block")
      .set("margin-top", "12px")
      .set("font-weight", "600")
      .set("color", p.linkColor);

    applyBox(sheet, { ...p.box, padding: undefined }, "flex");
    return sheet.toString();
  },
  Settings: IconBoxSettings,
  fonts: (p) => [p.titleTypography.fontFamily, p.descriptionTypography.fontFamily],
};
