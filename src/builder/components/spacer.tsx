import { MoveVertical } from "lucide-react";
import { UI_ACCENT } from "#/lib/brand";
import { Group } from "../controls/field.tsx";
import { NumberUnitField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import { createSheet, nodeClass } from "../core/style-engine.ts";
import type { Length } from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type SpacerProps = { height: Responsive<Length> };

function SpacerView({ id, rootRef }: NodeViewProps<SpacerProps>) {
  const isEditor = useIsEditor();
  return (
    <div
      ref={rootRef as React.Ref<HTMLDivElement>}
      className={`pb-spacer ${nodeClass(id)}`}
      data-pb-node={id}
      aria-hidden="true"
      style={
        isEditor
          ? {
              background: `repeating-linear-gradient(45deg,transparent,transparent 6px,${UI_ACCENT}1a 6px,${UI_ACCENT}1a 12px)`,
            }
          : undefined
      }
    />
  );
}

function SpacerSettings() {
  return (
    <SettingsTabs
      content={
        <Group title="Espaço">
          <NumberUnitField path="height" label="Altura" units={["px", "vh", "rem"]} max={400} />
        </Group>
      }
    />
  );
}

export const Spacer: ComponentDefinition<SpacerProps> = {
  type: "Spacer",
  displayName: "Espaçador",
  category: "layout",
  icon: MoveVertical,
  inToolbox: true,
  defaults: { height: responsive("48px", undefined, "32px") },
  View: SpacerView,
  css: (id, p) => {
    const sheet = createSheet(id);
    sheet.root().set("height", p.height).set("width", "100%").set("flex-shrink", "0");
    return sheet.toString();
  },
  Settings: SpacerSettings,
};
