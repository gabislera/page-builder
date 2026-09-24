import { ChartNoAxesGantt } from "lucide-react";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import { BoxFields, NumberField, TypographyFields } from "../controls/groups.tsx";
import { NumberUnitField, SegmentedField, SwitchField, TextField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { defaultBox, defaultTypography } from "../core/defaults.ts";
import { useInlineEdit } from "../core/inline-edit.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import { applyBox, applyTypography, createSheet, gradientToCss, nodeSelector } from "../core/style-engine.ts";
import type { Box, Gradient, Length, Typography } from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type ProgressBarProps = {
  title: string;
  showTitle: boolean;
  /** 0–100 */
  value: number;
  labelPosition: "inside" | "outside" | "none";
  height: Responsive<Length>;
  gap: Responsive<Length>;
  trackColor: string;
  fill: "solid" | "gradient";
  barColor: string;
  barGradient: Gradient;
  radius: Responsive<Length>;
  striped: boolean;
  stripesAnimated: boolean;
  /** On the published page, the bar grows from 0 to the value when it appears. */
  animateOnAppear: boolean;
  durationMs: number;
  titleTypography: Typography;
  labelTypography: Typography;
  insideLabelColor: string;
  box: Box;
};

const clamp = (v: number) => Math.min(100, Math.max(0, Number(v) || 0));

function ProgressBarView({ id, props: p, rootRef, onPropChange }: NodeViewProps<ProgressBarProps>) {
  const isEditor = useIsEditor();
  const edit = useInlineEdit(p.title, onPropChange && ((v) => onPropChange("title", v)));
  const value = clamp(p.value);
  const pct = `${Math.round(value)}%`;
  const animate = !isEditor && p.animateOnAppear;
  const head = p.showTitle || p.labelPosition === "outside";
  return (
    <div
      ref={rootRef as React.Ref<HTMLDivElement>}
      className={nodeClassName(id, "pb-progress", p.box)}
      data-pb-node={id}
      data-pb-progress={animate ? String(value) : undefined}
      data-pb-duration={animate ? String(p.durationMs) : undefined}
    >
      {head ? (
        <div className="pb-progress-head">
          {p.showTitle ? (
            <span className="pb-progress-title" ref={edit.ref as React.Ref<HTMLSpanElement>} {...edit.attrs}>
              {edit.editing ? null : p.title}
            </span>
          ) : null}
          {p.labelPosition === "outside" ? <span className="pb-progress-pct">{pct}</span> : null}
        </div>
      ) : null}
      <div
        className="pb-progress-track"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={p.title || undefined}
      >
        <div className="pb-progress-bar">
          {p.labelPosition === "inside" ? <span className="pb-progress-pct">{pct}</span> : null}
        </div>
      </div>
    </div>
  );
}

function ProgressBarSettings() {
  const fill = useField<ProgressBarProps["fill"]>("fill").value;
  const striped = useField<boolean>("striped").value;
  const animate = useField<boolean>("animateOnAppear").value;
  const label = useField<ProgressBarProps["labelPosition"]>("labelPosition").value;
  const showTitle = useField<boolean>("showTitle").value;
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Barra">
            <SwitchField path="showTitle" label="Mostrar título" />
            {showTitle ? (
              <TextField path="title" label="Título" hint="Dica: dê dois cliques no título para editar no canvas." />
            ) : null}
            <NumberField path="value" label="Progresso (%)" max={100} />
            <SegmentedField
              path="labelPosition"
              label="Porcentagem"
              options={[
                { value: "inside", label: "Dentro" },
                { value: "outside", label: "Fora" },
                { value: "none", label: "Ocultar" },
              ]}
            />
          </Group>
          <Group title="Animação">
            <SwitchField
              path="animateOnAppear"
              label="Crescer ao aparecer na tela"
              hint="Só na página publicada. Respeita quem prefere menos movimento."
            />
            {animate ? <NumberField path="durationMs" label="Duração (ms)" min={200} max={5000} step={100} /> : null}
            <SwitchField path="striped" label="Listrada" />
            {striped ? <SwitchField path="stripesAnimated" label="Listras em movimento" /> : null}
          </Group>
        </>
      }
      style={
        <>
          <Group title="Barra">
            <NumberUnitField path="height" label="Altura" units={["px"]} max={80} />
            <NumberUnitField path="radius" label="Arredondamento" units={["px"]} max={40} />
            <ColorField path="trackColor" label="Cor do fundo" />
            <SegmentedField
              path="fill"
              label="Preenchimento"
              options={[
                { value: "solid", label: "Cor" },
                { value: "gradient", label: "Gradiente" },
              ]}
            />
            {fill === "solid" ? (
              <ColorField path="barColor" label="Cor da barra" />
            ) : (
              <>
                <ColorField path="barGradient.from" label="Cor inicial" />
                <ColorField path="barGradient.to" label="Cor final" />
                <NumberField path="barGradient.angle" label="Ângulo (°)" max={360} />
              </>
            )}
            <NumberUnitField path="gap" label="Espaço até o título" units={["px"]} max={60} />
          </Group>
          {showTitle ? (
            <Group title="Título" defaultOpen={false}>
              <TypographyFields base="titleTypography" withAlign={false} />
            </Group>
          ) : null}
          {label !== "none" ? (
            <Group title="Porcentagem" defaultOpen={false}>
              <TypographyFields base="labelTypography" withAlign={false} withColor={label === "outside"} />
              {label === "inside" ? <ColorField path="insideLabelColor" label="Cor" /> : null}
            </Group>
          ) : null}
        </>
      }
      advanced={<BoxFields />}
    />
  );
}

const STRIPES =
  "linear-gradient(45deg,rgba(255,255,255,.18) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.18) 50%,rgba(255,255,255,.18) 75%,transparent 75%,transparent)";

export const ProgressBar: ComponentDefinition<ProgressBarProps> = {
  type: "ProgressBar",
  displayName: "Barra de progresso",
  category: "conversion",
  icon: ChartNoAxesGantt,
  inToolbox: true,
  defaults: {
    title: "Vagas preenchidas",
    showTitle: true,
    value: 78,
    labelPosition: "outside",
    height: responsive("14px"),
    gap: responsive("8px"),
    trackColor: "#e4e4e7",
    fill: "solid",
    barColor: "var(--pb-c-primary)",
    barGradient: {
      type: "linear",
      angle: 90,
      from: "var(--pb-c-primary)",
      fromPosition: 0,
      to: "#06b6d4",
      toPosition: 100,
    },
    radius: responsive("999px"),
    striped: false,
    stripesAnimated: true,
    animateOnAppear: true,
    durationMs: 1200,
    titleTypography: defaultTypography({
      fontSize: responsive("15px"),
      fontWeight: "600",
    }),
    labelTypography: defaultTypography({
      fontSize: responsive("13px"),
      fontWeight: "600",
      color: "#3f3f46",
    }),
    insideLabelColor: "#ffffff",
    box: defaultBox({ width: responsive("100%") }),
  },
  View: ProgressBarView,
  css: (id, p) => {
    const sheet = createSheet(id);
    sheet.root().set("display", "block");
    sheet
      .rule(" .pb-progress-head")
      .set("display", "flex")
      .set("align-items", "baseline")
      .set("justify-content", "space-between")
      .set("gap", "12px")
      .set("margin-bottom", p.gap);
    applyTypography(sheet.rule(" .pb-progress-title"), p.titleTypography);
    const pct = sheet.rule(" .pb-progress-pct");
    applyTypography(pct, p.labelTypography);
    pct.set("white-space", "nowrap").set("font-variant-numeric", "tabular-nums");
    sheet.rule(" .pb-progress-head .pb-progress-pct").set("margin-left", "auto");
    sheet
      .rule(" .pb-progress-track")
      .set("position", "relative")
      .set("width", "100%")
      .set("height", p.height)
      .set("overflow", "hidden")
      .set("background-color", p.trackColor)
      .set("border-radius", p.radius);
    const layers = [p.striped ? STRIPES : null, p.fill === "gradient" ? gradientToCss(p.barGradient) : null].filter(
      Boolean,
    );
    const bar = sheet.rule(" .pb-progress-bar");
    bar
      .set("display", "flex")
      .set("align-items", "center")
      .set("justify-content", "flex-end")
      .set("height", "100%")
      .set("width", `${clamp(p.value)}%`)
      .set("border-radius", p.radius)
      .set("background-color", p.fill === "solid" ? p.barColor : undefined)
      .set("background-image", layers.length ? layers.join(",") : undefined)
      .set("background-size", p.striped ? (p.fill === "gradient" ? "1rem 1rem,100% 100%" : "1rem 1rem") : undefined);
    sheet
      .rule(" .pb-progress-bar .pb-progress-pct")
      .set("padding", "0 8px")
      .set("color", p.insideLabelColor)
      .set("line-height", "1");
    let extra = "";
    if (p.striped && p.stripesAnimated) {
      const s = nodeSelector(id);
      bar.set("animation", "pb-progress-stripes 1s linear infinite");
      extra =
        "@keyframes pb-progress-stripes{from{background-position:1rem 0}to{background-position:0 0}}" +
        `@media (prefers-reduced-motion:reduce){${s} .pb-progress-bar{animation:none}}`;
    }
    applyBox(sheet, p.box);
    return sheet.toString() + extra;
  },
  Settings: ProgressBarSettings,
  runtime: ["progress"],
  fonts: (p) => [p.titleTypography.fontFamily, p.labelTypography.fontFamily],
};
