import { AlignCenterVertical, AlignEndVertical, AlignStartVertical, LayoutPanelTop } from "lucide-react";
import { Group } from "../controls/field.tsx";
import { BackgroundFields, BorderFields, BoxFields, ShadowFields, SidesField } from "../controls/groups.tsx";
import { NumberUnitField, SegmentedField, SwitchField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { sectionAnchor } from "../core/actions.ts";
import { defaultBackground, defaultBorder, defaultBox, defaultShadow, sides } from "../core/defaults.ts";
import { nodeClassName, TOP_LEVEL_TYPES } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import { applyBackground, applyBorder, applyBox, createSheet, shadowToCss, sidesToCss } from "../core/style-engine.ts";
import type { Background, Border, Box, Length, Shadow, Sides } from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type SectionProps = {
  fullWidth: boolean;
  padding: Responsive<Sides>;
  gap: Responsive<Length>;
  minHeight: Responsive<Length>;
  verticalAlign: Responsive<"flex-start" | "center" | "flex-end">;
  alignItems: Responsive<"stretch" | "flex-start" | "center" | "flex-end">;
  background: Background;
  border: Border;
  shadow: Shadow;
  box: Box;
};

function SectionView({ id, props, children, rootRef }: NodeViewProps<SectionProps>) {
  const isEditor = useIsEditor();
  const empty = !children || (Array.isArray(children) && children.length === 0);
  return (
    <section
      ref={rootRef as React.Ref<HTMLElement>}
      id={sectionAnchor(id)}
      className={nodeClassName(id, "pb-section", props.box)}
      data-pb-node={id}
    >
      {props.box.anchorId ? <span id={props.box.anchorId} className="pb-anchor" /> : null}
      <div className="pb-section-inner">
        {children}
        {isEditor && empty ? <div className="pb-placeholder">Arraste elementos para esta seção</div> : null}
      </div>
    </section>
  );
}

const ALIGN_ITEMS = [
  { value: "stretch", label: "Esticar" },
  { value: "flex-start", label: "Início" },
  { value: "center", label: "Centro" },
  { value: "flex-end", label: "Fim" },
] as const;

function SectionSettings() {
  return (
    <SettingsTabs
      content={
        <Group title="Layout">
          <SwitchField path="fullWidth" label="Conteúdo em largura total" />
          <NumberUnitField path="minHeight" label="Altura mínima" units={["px", "vh"]} max={1200} />
          <SegmentedField
            path="verticalAlign"
            label="Alinhamento vertical"
            options={[
              {
                value: "flex-start",
                label: "Topo",
                icon: AlignStartVertical,
              },
              { value: "center", label: "Centro", icon: AlignCenterVertical },
              { value: "flex-end", label: "Base", icon: AlignEndVertical },
            ]}
          />
          <SegmentedField path="alignItems" label="Alinhamento dos elementos" options={[...ALIGN_ITEMS]} />
          <NumberUnitField path="gap" label="Espaço entre elementos" units={["px", "rem"]} max={120} />
          <SidesField path="padding" label="Espaço interno" units={["px", "%", "rem", "vh"]} />
        </Group>
      }
      style={
        <>
          <Group title="Fundo">
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
      advanced={<BoxFields withSize={false} />}
    />
  );
}

export const Section: ComponentDefinition<SectionProps> = {
  type: "Section",
  displayName: "Seção",
  category: "structure",
  icon: LayoutPanelTop,
  isCanvas: true,
  defaults: {
    fullWidth: false,
    padding: responsive(sides("64px", "24px"), undefined, sides("40px", "16px")),
    gap: responsive("16px"),
    minHeight: responsive("0px"),
    verticalAlign: responsive("center"),
    alignItems: responsive("stretch"),
    background: defaultBackground(),
    border: defaultBorder(),
    shadow: defaultShadow(),
    box: defaultBox({
      width: responsive("100%"),
      maxWidth: responsive("none"),
    }),
  },
  rules: {
    canDrop: (target) => target.data.name === "Page",
    canMoveIn: (incoming) => incoming.every((n) => !TOP_LEVEL_TYPES.has(n.data.name) && n.data.name !== "Page"),
  },
  View: SectionView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const root = sheet.root();
    root
      .set("padding", p.padding, sidesToCss)
      .set("min-height", p.minHeight, (v) => (v === "0px" ? undefined : v))
      .set("justify-content", p.verticalAlign)
      .set("box-shadow", shadowToCss(p.shadow));
    applyBackground(root, p.background);
    applyBorder(root, p.border);
    applyBox(sheet, { ...p.box, padding: undefined, width: undefined, maxWidth: undefined }, "flex");
    sheet
      .rule(" > .pb-section-inner")
      .set("max-width", p.fullWidth ? "none" : "var(--pb-content-width)")
      .set("gap", p.gap)
      .set("align-items", p.alignItems);
    return sheet.toString();
  },
  Settings: SectionSettings,
};
