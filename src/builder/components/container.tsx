import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignHorizontalSpaceBetween,
  ArrowDown,
  ArrowRight,
  Columns3,
  Rows3,
  Square,
} from "lucide-react";
import { cn } from "#/lib/utils";
import { ActionField } from "../controls/action.tsx";
import { Field, Group } from "../controls/field.tsx";
import {
  BackgroundFields,
  BorderFields,
  BoxFields,
  HoverFields,
  NumberField,
  ShadowFields,
} from "../controls/groups.tsx";
import { DebouncedInput, NumberUnitField, SegmentedField, SelectField, SwitchField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { actionLink } from "../core/actions.ts";
import { defaultBackground, defaultBorder, defaultBox, defaultHover, defaultShadow } from "../core/defaults.ts";
import { nodeClassName, TOP_LEVEL_TYPES } from "../core/node-helpers.ts";
import { useIsEditor, useRender } from "../core/render-context.tsx";
import { DEVICES, type Responsive, resolve, responsive } from "../core/responsive.ts";
import { applyBackground, applyBorder, applyBox, applyHover, createSheet, shadowToCss } from "../core/style-engine.ts";
import type { Action, Background, Border, Box, Hover, Length, Shadow } from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

type Justify = "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
type Align = "stretch" | "flex-start" | "center" | "flex-end";

export type ContainerProps = {
  display: Responsive<"flex" | "grid">;
  direction: Responsive<"column" | "row">;
  justify: Responsive<Justify>;
  align: Responsive<Align>;
  wrap: Responsive<boolean>;
  gap: Responsive<Length>;
  columns: Responsive<number>;
  /**
   * Proporção das colunas da grade (ex.: "1fr 2fr"). Vazio = iguais. Só vale
   * quando o número de partes bate com o número de colunas do dispositivo.
   */
  columnsTemplate: Responsive<string>;
  htmlTag: "div" | "section" | "article" | "aside" | "nav" | "ul";
  action: Action;
  background: Background;
  border: Border;
  shadow: Shadow;
  hover: Hover;
  box: Box;
};

function ContainerView({ id, props, children, rootRef }: NodeViewProps<ContainerProps>) {
  const isEditor = useIsEditor();
  const ctx = useRender();
  const Tag = props.htmlTag;
  const empty = !children || (Array.isArray(children) && children.length === 0);
  const link = actionLink(props.action, ctx);
  return (
    <Tag
      ref={rootRef as React.Ref<never>}
      className={nodeClassName(id, "pb-container", props.box)}
      data-pb-node={id}
      // clique no container inteiro é tratado pelo runtime (não aninha <a>)
      data-pb-href={link?.href}
      data-pb-target={link?.target}
      data-pb-modal={link?.["data-pb-modal"]}
    >
      {children}
      {isEditor && empty ? <div className="pb-placeholder">Container vazio</div> : null}
    </Tag>
  );
}

function ContainerSettings() {
  const display = useField<"flex" | "grid">("display");
  const isGrid = display.value === "grid";
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Layout">
            <SegmentedField
              path="display"
              label="Tipo"
              options={[
                { value: "flex", label: "Flexível" },
                { value: "grid", label: "Grade" },
              ]}
            />
            {isGrid ? (
              <ColumnsLayoutField />
            ) : (
              <>
                <SegmentedField
                  path="direction"
                  label="Direção"
                  options={[
                    { value: "column", label: "Vertical", icon: ArrowDown },
                    { value: "row", label: "Horizontal", icon: ArrowRight },
                  ]}
                />
                <SegmentedField
                  path="justify"
                  label="Distribuição"
                  options={[
                    {
                      value: "flex-start",
                      label: "Início",
                      icon: AlignHorizontalJustifyStart,
                    },
                    {
                      value: "center",
                      label: "Centro",
                      icon: AlignHorizontalJustifyCenter,
                    },
                    {
                      value: "flex-end",
                      label: "Fim",
                      icon: AlignHorizontalJustifyEnd,
                    },
                    {
                      value: "space-between",
                      label: "Espaçado",
                      icon: AlignHorizontalSpaceBetween,
                    },
                  ]}
                />
                <SwitchField path="wrap" label="Quebrar linha" />
              </>
            )}
            <SegmentedField
              path="align"
              label="Alinhamento"
              options={[
                { value: "stretch", label: "Esticar" },
                { value: "flex-start", label: "Início" },
                { value: "center", label: "Centro" },
                { value: "flex-end", label: "Fim" },
              ]}
            />
            <NumberUnitField path="gap" label="Espaço entre itens" units={["px", "rem"]} max={120} />
          </Group>
          <Group title="Link" defaultOpen={false}>
            <ActionField path="action" />
          </Group>
        </>
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
          <Group title="Hover" defaultOpen={false}>
            <HoverFields base="hover" withColor={false} />
          </Group>
        </>
      }
      advanced={
        <>
          <BoxFields />
          <Group title="HTML" defaultOpen={false}>
            <SelectField
              path="htmlTag"
              label="Tag"
              options={["div", "section", "article", "aside", "nav", "ul"].map((t) => ({ value: t, label: t }))}
            />
          </Group>
        </>
      }
    />
  );
}

const containerDefaults = (overrides: Partial<ContainerProps> = {}): ContainerProps => ({
  display: responsive("flex"),
  direction: responsive("column"),
  justify: responsive("flex-start"),
  align: responsive("stretch"),
  wrap: responsive(false),
  gap: responsive("16px"),
  columns: responsive(2, undefined, 1),
  columnsTemplate: responsive(""),
  htmlTag: "div",
  action: { type: "none" },
  background: defaultBackground(),
  border: defaultBorder(),
  shadow: defaultShadow(),
  hover: defaultHover(),
  box: defaultBox({ width: responsive("100%") }),
  ...overrides,
});

export const Container: ComponentDefinition<ContainerProps> = {
  type: "Container",
  displayName: "Container",
  category: "layout",
  icon: Square,
  isCanvas: true,
  inToolbox: true,
  defaults: containerDefaults(),
  rules: {
    canMoveIn: (incoming) => incoming.every((n) => !TOP_LEVEL_TYPES.has(n.data.name) && n.data.name !== "Page"),
  },
  View: ContainerView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const root = sheet.root();
    root
      .set("display", p.display)
      .set("flex-direction", p.direction)
      .set("justify-content", p.justify)
      .set("align-items", p.align)
      .set("flex-wrap", p.wrap, (v) => (v ? "wrap" : "nowrap"))
      .set("gap", p.gap)
      .set("position", "relative")
      .set("list-style", p.htmlTag === "ul" ? "none" : undefined)
      .set("box-shadow", shadowToCss(p.shadow))
      .set("cursor", p.action.type !== "none" ? "pointer" : undefined);
    // colunas por dispositivo: a proporção só vale se tiver o mesmo número de partes
    let previous = "";
    for (const device of DEVICES) {
      const value = gridColumns(resolve(p.columns, device), resolve(p.columnsTemplate ?? responsive(""), device));
      if (value !== previous) root.setOn(device, "grid-template-columns", value);
      previous = value;
    }
    applyBackground(root, p.background);
    applyBorder(root, p.border);
    applyHover(sheet, p.hover);
    applyBox(sheet, p.box, "flex");
    // em linha, cada filho divide o espaço; em grade, a grade cuida disso
    sheet.rule(" > *").set("min-width", "0");
    return sheet.toString();
  },
  Settings: ContainerSettings,
};

/** Valor de grid-template-columns para `n` colunas com a proporção dada. */
export function gridColumns(n: number, template: string): string {
  const parts = template.trim().split(/\s+/).filter(Boolean);
  if (parts.length === n) return parts.map((p) => `minmax(0, ${p})`).join(" ");
  return `repeat(${n}, minmax(0, 1fr))`;
}

/** Proporções oferecidas por número de colunas ("" = colunas iguais). */
const LAYOUT_PRESETS: Record<number, string[]> = {
  2: ["", "1fr 2fr", "2fr 1fr", "1fr 3fr", "3fr 1fr"],
  3: ["", "1fr 2fr 1fr", "2fr 1fr 1fr", "1fr 1fr 2fr"],
  4: ["", "2fr 1fr 1fr 1fr", "1fr 1fr 1fr 2fr"],
};

const PRESET_LABEL: Record<string, string> = {
  "1fr 2fr": "Estreita + larga",
  "2fr 1fr": "Larga + estreita",
  "1fr 3fr": "Bem estreita + larga",
  "3fr 1fr": "Larga + bem estreita",
  "1fr 2fr 1fr": "Central mais larga",
  "2fr 1fr 1fr": "Primeira mais larga",
  "1fr 1fr 2fr": "Última mais larga",
  "2fr 1fr 1fr 1fr": "Primeira mais larga",
  "1fr 1fr 1fr 2fr": "Última mais larga",
};

/** Número de colunas + proporção visual (por dispositivo). */
function ColumnsLayoutField() {
  const columns = useField<number>("columns");
  const template = useField<string>("columnsTemplate");
  const n = columns.value ?? 2;
  const current = (template.value ?? "").trim();
  const presets = LAYOUT_PRESETS[n] ?? [""];
  const isCustom = current !== "" && !presets.includes(current);
  return (
    <>
      <NumberField path="columns" label="Colunas" min={1} max={12} />
      {n > 1 ? (
        <Field
          label="Proporção"
          responsive={template.responsive}
          overridden={template.overridden}
          onReset={template.reset}
        >
          <div className="grid grid-cols-3 gap-1.5">
            {presets.map((preset) => {
              const ratios = (preset || Array(n).fill("1fr").join(" "))
                .split(" ")
                .map((part) => Number.parseFloat(part));
              const active = preset === current || (preset === "" && current.split(/\s+/).length !== n);
              return (
                <button
                  key={preset || "equal"}
                  type="button"
                  title={PRESET_LABEL[preset] ?? "Iguais"}
                  onClick={() => template.set(preset)}
                  className={cn(
                    "flex h-9 items-stretch gap-0.5 rounded-md border p-1",
                    active && !isCustom
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground/50",
                  )}
                >
                  {ratios.map((r, i) => (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: barras fixas da prévia
                      key={i}
                      className="rounded-sm bg-muted-foreground/40"
                      style={{ flex: r }}
                    />
                  ))}
                </button>
              );
            })}
          </div>
          <DebouncedInput
            className="mt-1.5 font-mono"
            value={isCustom ? current : ""}
            placeholder="Personalizado, ex.: 2fr 1fr"
            onChange={(v) => template.set(v)}
          />
        </Field>
      ) : null}
    </>
  );
}

/** Variações prontas oferecidas na Toolbox. */
export const containerPresets = {
  stack: containerDefaults(),
  row: containerDefaults({
    direction: responsive("row", undefined, "column"),
    align: responsive("center"),
  }),
  grid: (columns: number, template = "") =>
    containerDefaults({
      display: responsive("grid"),
      columns: responsive(columns, columns > 2 ? 2 : undefined, 1),
      columnsTemplate: responsive(template),
      gap: responsive("24px"),
    }),
};

export const ContainerIcons = { Columns3, Rows3 };
