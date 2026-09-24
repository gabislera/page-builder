import { Shapes } from "lucide-react";
import { ActionField } from "../controls/action.tsx";
import { Group } from "../controls/field.tsx";
import { BoxFields, MediaPathField, TypographyFields } from "../controls/groups.tsx";
import { NumberUnitField, SegmentedField, TextField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { actionLink } from "../core/actions.ts";
import { defaultBox, defaultTypography } from "../core/defaults.ts";
import { nodeClassName } from "../core/node-helpers.ts";
import { useRender } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import { applyBox, applyTypography, createSheet } from "../core/style-engine.ts";
import type { Action, Box, Length, Typography } from "../core/style-types.ts";
import { C, FONT_HEADING } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import { InlineText } from "./shared/inline-text.tsx";

export type LogoProps = {
  /** "site": logo and name from site identity; "custom": own image. */
  source: "site" | "custom";
  /** "light": use the dark-background logo when it exists. */
  variant: "default" | "light";
  src: string;
  alt: string;
  /** Text when there is no image. Empty: site name. */
  text: string;
  width: Responsive<Length>;
  maxHeight: Responsive<Length>;
  /** "home": home page; "custom": own action; "none": no link. */
  link: "home" | "custom" | "none";
  action: Action;
  typography: Typography;
  box: Box;
};

function LogoView({ id, props, rootRef, onPropChange }: NodeViewProps<LogoProps>) {
  const ctx = useRender();
  const site = ctx.site;
  const siteSrc = props.variant === "light" ? site.logoLightUrl || site.logoUrl : site.logoUrl;
  const src = props.source === "custom" ? props.src : siteSrc;
  const text = props.text || site.name;
  const link =
    props.link === "home" ? { href: ctx.homeUrl } : props.link === "custom" ? actionLink(props.action, ctx) : null;

  const content = src ? (
    <img src={src} alt={props.alt || site.name} decoding="async" />
  ) : (
    <InlineText value={text} className="pb-logo-text" onCommit={onPropChange && ((v) => onPropChange("text", v))} />
  );
  const className = nodeClassName(id, "pb-logo", props.box);
  if (link) {
    return (
      <a ref={rootRef as React.Ref<HTMLAnchorElement>} className={className} data-pb-node={id} {...link}>
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

function LogoSettings() {
  const source = useField<LogoProps["source"]>("source");
  const link = useField<LogoProps["link"]>("link");
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Logo">
            <SegmentedField
              path="source"
              label="Origem"
              options={[
                { value: "site", label: "Logo do site" },
                { value: "custom", label: "Outra imagem" },
              ]}
            />
            {source.value === "custom" ? (
              <>
                <MediaPathField path="src" label="Imagem" accept="image" hint="Sem imagem, o texto é exibido." />
                <TextField path="alt" label="Texto alternativo (SEO)" />
              </>
            ) : (
              <SegmentedField
                path="variant"
                label="Versão"
                hint="A versão clara usa o logo para fundos escuros, definido nas configurações do site."
                options={[
                  { value: "default", label: "Padrão" },
                  { value: "light", label: "Clara" },
                ]}
              />
            )}
            <TextField path="text" label="Texto (sem imagem)" placeholder="Nome do site" />
          </Group>
          <Group title="Link">
            <SegmentedField
              path="link"
              label="Ao clicar"
              options={[
                { value: "home", label: "Página inicial" },
                { value: "custom", label: "Personalizado" },
                { value: "none", label: "Nenhum" },
              ]}
            />
            {link.value === "custom" ? <ActionField path="action" label="Ação" /> : null}
          </Group>
        </>
      }
      style={
        <>
          <Group title="Imagem">
            <NumberUnitField path="width" label="Largura" units={["px", "%"]} keywords={["auto"]} max={400} />
            <NumberUnitField path="maxHeight" label="Altura máxima" units={["px"]} keywords={["none"]} max={200} />
          </Group>
          <Group title="Texto" defaultOpen={false}>
            <TypographyFields base="typography" withAlign={false} />
          </Group>
        </>
      }
      advanced={<BoxFields withSize={false} />}
    />
  );
}

export const Logo: ComponentDefinition<LogoProps> = {
  type: "Logo",
  displayName: "Logo",
  category: "basic",
  icon: Shapes,
  inToolbox: true,
  defaults: {
    source: "site",
    variant: "default",
    src: "",
    alt: "",
    text: "",
    width: responsive("auto"),
    maxHeight: responsive("40px", undefined, "32px"),
    link: "home",
    action: { type: "none" },
    typography: defaultTypography({
      fontFamily: FONT_HEADING,
      fontSize: responsive("22px", undefined, "20px"),
      fontWeight: "700",
      lineHeight: responsive("1.2"),
      letterSpacing: responsive("-0.3px"),
      color: C.text,
    }),
    box: defaultBox(),
  },
  View: LogoView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const root = sheet.root();
    root
      .set("display", "inline-flex")
      .set("align-items", "center")
      .set("flex-shrink", "0")
      .set("white-space", "nowrap");
    applyTypography(root, p.typography);
    applyBox(sheet, p.box, "inline-flex");
    sheet
      .rule(" img")
      .set("width", p.width)
      .set("max-height", p.maxHeight)
      .set("height", "auto")
      .set("max-width", "100%")
      .set("object-fit", "contain");
    return sheet.toString();
  },
  Settings: LogoSettings,
  fonts: (p) => [p.typography.fontFamily],
};
