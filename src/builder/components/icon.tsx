import { Star } from "lucide-react";
import { ActionField } from "../controls/action.tsx";
import { Group } from "../controls/field.tsx";
import { BoxFields, NumberField } from "../controls/groups.tsx";
import { IconField } from "../controls/icon.tsx";
import { SegmentedField, TextField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { actionLink } from "../core/actions.ts";
import { defaultBox } from "../core/defaults.ts";
import { IconView, iconLabel } from "../core/icons.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useRender } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import { applyBox, createSheet } from "../core/style-engine.ts";
import type { Action, Box } from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import {
  ALIGN_OPTIONS,
  applyIconStyle,
  defaultIconStyle,
  IconHoverFields,
  type IconStyle,
  IconStyleFields,
} from "./shared/icon-style.tsx";

export type IconProps = {
  icon: IconStyle;
  align: Responsive<"flex-start" | "center" | "flex-end">;
  action: Action;
  /** Screen-reader text when the icon is a link. */
  ariaLabel: string;
  /** Zoom on hover (1 = no zoom). */
  hoverScale: number;
  box: Box;
};

function IconWidgetView({ id, props, rootRef }: NodeViewProps<IconProps>) {
  const ctx = useRender();
  const link = actionLink(props.action, ctx);
  const svg = <IconView name={props.icon.name} strokeWidth={props.icon.strokeWidth} />;
  return (
    <div
      ref={rootRef as React.Ref<HTMLDivElement>}
      className={nodeClassName(id, "pb-icon", props.box)}
      data-pb-node={id}
    >
      {link ? (
        <a
          href={link.href}
          className="pb-icon-shape"
          aria-label={props.ariaLabel || iconLabel(props.icon.name)}
          {...link}
        >
          {svg}
        </a>
      ) : (
        <span className="pb-icon-shape">{svg}</span>
      )}
    </div>
  );
}

function IconSettings() {
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Ícone">
            <IconField path="icon.name" label="Ícone" allowNone={false} />
            <SegmentedField path="align" label="Alinhamento" options={ALIGN_OPTIONS} />
          </Group>
          <Group title="Link" defaultOpen={false}>
            <ActionField path="action" />
            <TextField
              path="ariaLabel"
              label="Descrição (acessibilidade)"
              hint="Lida por leitores de tela quando o ícone é um link."
            />
          </Group>
        </>
      }
      style={
        <>
          <Group title="Ícone">
            <IconStyleFields base="icon" />
          </Group>
          <Group title="Hover" defaultOpen={false}>
            <IconHoverFields base="icon" />
            <NumberField path="hoverScale" label="Zoom" min={0.8} max={1.5} step={0.01} />
          </Group>
        </>
      }
      advanced={<BoxFields withSize={false} />}
    />
  );
}

export const Icon: ComponentDefinition<IconProps> = {
  type: "Icon",
  displayName: "Ícone",
  category: "basic",
  icon: Star,
  inToolbox: true,
  defaults: {
    icon: defaultIconStyle(),
    align: responsive("center"),
    action: { type: "none" },
    ariaLabel: "",
    hoverScale: 1,
    box: defaultBox(),
  },
  View: IconWidgetView,
  css: (id, p) => {
    const sheet = createSheet(id);
    sheet.root().set("display", "flex").set("justify-content", p.align);
    applyIconStyle(sheet, " .pb-icon-shape", " .pb-icon-shape:hover", p.icon);
    if (p.hoverScale && p.hoverScale !== 1)
      sheet.rule(" .pb-icon-shape:hover").set("transform", `scale(${p.hoverScale})`);
    applyBox(sheet, p.box, "flex");
    return sheet.toString();
  },
  Settings: IconSettings,
};
