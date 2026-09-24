/**
 * Contador numérico: número grande que conta até o valor quando aparece na
 * tela ("+10.000 alunos"). O HTML já sai com o número final (funciona sem
 * JS e aparece para buscadores); o runtime "counter" só anima a contagem.
 */
import { Hash } from "lucide-react";
import { Group } from "../controls/field.tsx";
import { BoxFields, NumberField, TypographyFields } from "../controls/groups.tsx";
import { SegmentedField, SwitchField, TextField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { defaultBox, defaultTypography } from "../core/defaults.ts";
import { useInlineEdit } from "../core/inline-edit.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { type Responsive, responsive } from "../core/responsive.ts";
import { applyBox, applyTypography, createSheet } from "../core/style-engine.ts";
import type { Box, Length, Typography } from "../core/style-types.ts";
import { C, FONT_BODY, FONT_HEADING } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type StatCounterProps = {
  value: number;
  /** Valor de onde a contagem começa. */
  from: number;
  decimals: number;
  prefix: string;
  suffix: string;
  /** Separa milhares com ponto (10.000) como no Brasil. */
  thousands: boolean;
  /** Duração da contagem (ms). */
  duration: number;
  label: string;
  align: Responsive<"flex-start" | "center" | "flex-end">;
  gap: Responsive<Length>;
  numberTypography: Typography;
  labelTypography: Typography;
  box: Box;
};

/** Formata como no Brasil: ponto nos milhares e vírgula nos decimais. */
export function formatStat(value: number, decimals: number, thousands: boolean) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: thousands,
  });
}

function StatCounterView({ id, props, rootRef, onPropChange }: NodeViewProps<StatCounterProps>) {
  const label = useInlineEdit(props.label, onPropChange && ((v) => onPropChange("label", v)));
  return (
    <div
      ref={rootRef as React.Ref<HTMLDivElement>}
      className={nodeClassName(id, "pb-stat", props.box)}
      data-pb-node={id}
    >
      <div className="pb-stat-number">
        {props.prefix ? <span className="pb-stat-affix">{props.prefix}</span> : null}
        <span
          className="pb-stat-value"
          data-pb-count={props.value}
          data-pb-from={props.from}
          data-pb-decimals={props.decimals}
          data-pb-duration={props.duration}
          data-pb-thousands={props.thousands ? "1" : "0"}
        >
          {formatStat(props.value, props.decimals, props.thousands)}
        </span>
        {props.suffix ? <span className="pb-stat-affix">{props.suffix}</span> : null}
      </div>
      {props.label || label.editing ? (
        <div className="pb-stat-label" ref={label.ref as React.Ref<HTMLDivElement>} {...label.attrs}>
          {label.editing ? null : props.label}
        </div>
      ) : null}
    </div>
  );
}

function StatCounterSettings() {
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Número">
            <NumberField path="value" label="Valor final" min={0} max={1000000} step={1} />
            <TextField path="prefix" label="Antes do número" placeholder="ex.: +, R$" />
            <TextField path="suffix" label="Depois do número" placeholder="ex.: %, mil, k" />
            <NumberField path="decimals" label="Casas decimais" min={0} max={3} step={1} />
            <SwitchField path="thousands" label="Separar milhares (10.000)" />
          </Group>
          <Group title="Legenda">
            <TextField path="label" label="Texto abaixo do número" />
          </Group>
          <Group title="Animação">
            <NumberField path="from" label="Começar a contar de" min={0} max={1000000} step={1} />
            <NumberField path="duration" label="Duração (ms)" min={0} max={6000} step={100} />
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
                { value: "flex-start", label: "Início" },
                { value: "center", label: "Centro" },
                { value: "flex-end", label: "Fim" },
              ]}
            />
          </Group>
          <Group title="Número">
            <TypographyFields base="numberTypography" withAlign={false} />
          </Group>
          <Group title="Legenda" defaultOpen={false}>
            <TypographyFields base="labelTypography" withAlign={false} />
          </Group>
        </>
      }
      advanced={<BoxFields />}
    />
  );
}

export const StatCounter: ComponentDefinition<StatCounterProps> = {
  type: "StatCounter",
  displayName: "Contador numérico",
  category: "basic",
  icon: Hash,
  inToolbox: true,
  runtime: ["counter"],
  defaults: {
    value: 10000,
    from: 0,
    decimals: 0,
    prefix: "+",
    suffix: "",
    thousands: true,
    duration: 2000,
    label: "alunos satisfeitos",
    align: responsive("center"),
    gap: responsive("4px"),
    numberTypography: defaultTypography({
      fontFamily: FONT_HEADING,
      fontSize: responsive("48px", undefined, "38px"),
      fontWeight: "800",
      lineHeight: responsive("1.1"),
      color: C.primary,
    }),
    labelTypography: defaultTypography({
      fontFamily: FONT_BODY,
      fontSize: responsive("16px", undefined, "15px"),
      fontWeight: "500",
      color: C.textMuted,
    }),
    box: defaultBox(),
  },
  View: StatCounterView,
  css: (id, p) => {
    const sheet = createSheet(id);
    sheet
      .root()
      .set("display", "flex")
      .set("flex-direction", "column")
      .set("align-items", p.align)
      .set("text-align", p.align, (a) => (a === "center" ? "center" : a === "flex-end" ? "right" : "left"))
      .set("gap", p.gap);
    const number = sheet.rule(" > .pb-stat-number");
    applyTypography(number, p.numberTypography);
    // números de largura fixa: a contagem não "treme"
    number.set("font-variant-numeric", "tabular-nums").set("white-space", "nowrap");
    applyTypography(sheet.rule(" > .pb-stat-label"), p.labelTypography);
    applyBox(sheet, p.box, "flex");
    return sheet.toString();
  },
  Settings: StatCounterSettings,
  fonts: (p) => [p.numberTypography.fontFamily, p.labelTypography.fontFamily],
};
