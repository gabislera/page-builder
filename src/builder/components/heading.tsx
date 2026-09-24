import { Heading as HeadingIcon } from "lucide-react";
import { ActionField } from "../controls/action.tsx";
import { Group } from "../controls/field.tsx";
import { BoxFields, ShadowFields, TypographyFields } from "../controls/groups.tsx";
import { SelectField, TextAreaField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { actionLink } from "../core/actions.ts";
import { defaultBox, defaultTextShadow, defaultTypography } from "../core/defaults.ts";
import { fillTokens, Lines, mergeRefs, useInlineEdit } from "../core/inline-edit.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useRender } from "../core/render-context.tsx";
import { responsive } from "../core/responsive.ts";
import { applyBox, applyTypography, createSheet, textShadowToCss } from "../core/style-engine.ts";
import type { Action, Box, TextShadow, Typography } from "../core/style-types.ts";
import { C, FONT_HEADING } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type HeadingProps = {
  text: string;
  tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div";
  typography: Typography;
  textShadow: TextShadow;
  action: Action;
  box: Box;
};

function HeadingView({ id, props, rootRef, onPropChange }: NodeViewProps<HeadingProps>) {
  const ctx = useRender();
  const edit = useInlineEdit(props.text, onPropChange && ((v) => onPropChange("text", v)), { multiline: true });
  const Tag = props.tag;
  const link = actionLink(props.action, ctx);
  return (
    <Tag
      ref={mergeRefs(rootRef, edit.ref) as React.Ref<HTMLHeadingElement>}
      className={nodeClassName(id, "pb-heading", props.box)}
      data-pb-node={id}
      {...edit.attrs}
    >
      {edit.editing ? null : link ? (
        <a {...link}>
          <Lines text={fillTokens(props.text)} />
        </a>
      ) : (
        <Lines text={fillTokens(props.text)} />
      )}
    </Tag>
  );
}

function HeadingSettings() {
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Texto">
            <TextAreaField
              path="text"
              label="Título"
              hint="Dica: dê dois cliques no título para editar direto no canvas."
            />
            <SelectField
              path="tag"
              label="Nível (SEO)"
              options={[
                { value: "h1", label: "H1 (título principal)" },
                { value: "h2", label: "H2" },
                { value: "h3", label: "H3" },
                { value: "h4", label: "H4" },
                { value: "h5", label: "H5" },
                { value: "h6", label: "H6" },
                { value: "p", label: "Parágrafo" },
                { value: "div", label: "div" },
              ]}
            />
          </Group>
          <Group title="Link" defaultOpen={false}>
            <ActionField path="action" />
          </Group>
        </>
      }
      style={
        <>
          <Group title="Tipografia">
            <TypographyFields base="typography" />
          </Group>
          <Group title="Sombra" defaultOpen={false}>
            <ShadowFields base="textShadow" text />
          </Group>
        </>
      }
      advanced={<BoxFields />}
    />
  );
}

export const Heading: ComponentDefinition<HeadingProps> = {
  type: "Heading",
  displayName: "Título",
  category: "basic",
  icon: HeadingIcon,
  inToolbox: true,
  defaults: {
    text: "Escreva um título que prenda a atenção",
    tag: "h2",
    typography: defaultTypography({
      fontFamily: FONT_HEADING,
      fontSize: responsive("40px", "34px", "28px"),
      fontWeight: "700",
      lineHeight: responsive("1.2"),
      color: C.text,
    }),
    textShadow: defaultTextShadow(),
    action: { type: "none" },
    box: defaultBox(),
  },
  View: HeadingView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const root = sheet.root();
    const t = p.typography;
    applyTypography(root, {
      ...t,
      // "inherit" nos títulos usa a fonte de títulos definida na página
      fontFamily: t.fontFamily === "inherit" ? undefined : t.fontFamily,
    });
    if (t.fontFamily === "inherit") root.set("font-family", "var(--pb-heading-font, inherit)");
    root.set("text-shadow", textShadowToCss(p.textShadow)).set("overflow-wrap", "break-word");
    applyBox(sheet, p.box);
    return sheet.toString();
  },
  Settings: HeadingSettings,
  fonts: (p) => [p.typography.fontFamily],
};
