import { BadgeDollarSign } from "lucide-react";
import { ActionField } from "../controls/action.tsx";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
  BackgroundFields,
  BorderFields,
  BoxFields,
  NumberField,
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
import { ListField, newItemId } from "../controls/list.tsx";
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
import { type Responsive, responsive } from "../core/responsive.ts";
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
import { type ButtonStyle, ButtonStyleGroups, buttonStyleCss, defaultButtonStyle } from "./shared/button-style.tsx";
import { InlineText } from "./shared/inline-text.tsx";

export type PricingFeature = {
  id: string;
  text: string;
  included: boolean;
};

type Align = "left" | "center";

export type PricingTableProps = {
  name: string;
  nameTag: "h2" | "h3" | "h4" | "p";
  description: string;
  currency: string;
  amount: string;
  cents: string;
  period: string;
  /** Preço antigo riscado (ex.: "R$ 197"). Vazio = oculto. */
  oldPrice: string;
  /** Linha abaixo do preço (ex.: "ou 12x de R$ 9,70"). */
  installments: string;
  features: PricingFeature[];
  includedIcon: string;
  excludedIcon: string;
  includedColor: string;
  excludedColor: string;
  ctaText: string;
  ctaIcon: string;
  ctaAction: Action;
  button: ButtonStyle;
  /** Nota abaixo do botão (ex.: garantia). */
  footerNote: string;
  footerIcon: string;
  /** Plano em destaque: selo, borda colorida e elevação. */
  featured: boolean;
  badgeText: string;
  badgeBackground: string;
  badgeColor: string;
  featuredBorderColor: string;
  /** Ampliação do plano em destaque (só no desktop). */
  featuredScale: number;
  featuredShadow: Shadow;
  align: Align;
  nameTypography: Typography;
  descriptionTypography: Typography;
  /** Tipografia do valor principal; moeda, centavos e período são proporcionais. */
  priceTypography: Typography;
  /** Cor do preço antigo, período e parcelas. */
  priceMutedColor: string;
  featuresTypography: Typography;
  noteColor: string;
  dividerColor: string;
  padding: Responsive<Sides>;
  gap: Responsive<Length>;
  background: Background;
  border: Border;
  shadow: Shadow;
  box: Box;
};

function PricingTableView({ id, props, rootRef, onPropChange }: NodeViewProps<PricingTableProps>) {
  const ctx = useRender();
  const commit = (path: string) => onPropChange && ((v: string) => onPropChange(path, v));
  const name = useInlineEdit(props.name, commit("name"));
  const desc = useInlineEdit(props.description, commit("description"), {
    multiline: true,
  });
  const amount = useInlineEdit(props.amount, commit("amount"));
  const installments = useInlineEdit(props.installments, commit("installments"));
  const cta = useInlineEdit(props.ctaText, commit("ctaText"));
  const badge = useInlineEdit(props.badgeText, commit("badgeText"));
  const note = useInlineEdit(props.footerNote, commit("footerNote"));
  const link = actionLink(props.ctaAction, ctx);
  const NameTag = props.nameTag;

  const ctaContent = (
    <>
      <span ref={cta.ref as React.Ref<HTMLSpanElement>} {...cta.attrs}>
        {cta.editing ? null : props.ctaText}
      </span>
      {props.ctaIcon ? <IconView name={props.ctaIcon} /> : null}
    </>
  );

  return (
    <div
      ref={rootRef as React.Ref<HTMLDivElement>}
      className={nodeClassName(id, props.featured ? "pb-price is-featured" : "pb-price", props.box)}
      data-pb-node={id}
    >
      {props.featured && (props.badgeText || badge.editing) ? (
        <span ref={badge.ref as React.Ref<HTMLSpanElement>} className="pb-price-badge" {...badge.attrs}>
          {badge.editing ? null : props.badgeText}
        </span>
      ) : null}
      <div className="pb-price-head">
        <NameTag ref={name.ref as React.Ref<HTMLHeadingElement>} className="pb-price-name" {...name.attrs}>
          {name.editing ? null : props.name}
        </NameTag>
        {props.description || desc.editing ? (
          <p ref={desc.ref as React.Ref<HTMLParagraphElement>} className="pb-price-desc" {...desc.attrs}>
            {desc.editing ? null : <Lines text={props.description} />}
          </p>
        ) : null}
      </div>
      <div className="pb-price-value">
        {props.oldPrice ? <del className="pb-price-old">{props.oldPrice}</del> : null}
        <div className="pb-price-row">
          {props.currency ? <span className="pb-price-cur">{props.currency}</span> : null}
          <span ref={amount.ref as React.Ref<HTMLSpanElement>} className="pb-price-amount" {...amount.attrs}>
            {amount.editing ? null : props.amount}
          </span>
          {props.cents ? <span className="pb-price-cents">{props.cents}</span> : null}
          {props.period ? <span className="pb-price-period">{props.period}</span> : null}
        </div>
        {props.installments || installments.editing ? (
          <p
            ref={installments.ref as React.Ref<HTMLParagraphElement>}
            className="pb-price-inst"
            {...installments.attrs}
          >
            {installments.editing ? null : props.installments}
          </p>
        ) : null}
      </div>
      {props.features.length ? (
        <ul className="pb-price-features">
          {props.features.map((f, i) => (
            <li key={f.id} className={f.included ? "pb-price-feat" : "pb-price-feat is-off"}>
              <span className="pb-price-feat-icon">
                <IconView name={f.included ? props.includedIcon : props.excludedIcon} strokeWidth={2.5} />
              </span>
              {f.included ? null : <span className="pb-sr">Não inclui: </span>}
              <InlineText className="pb-price-feat-text" value={f.text} onCommit={commit(`features.${i}.text`)} />
            </li>
          ))}
        </ul>
      ) : null}
      {props.ctaText || cta.editing ? (
        <div className="pb-price-cta">
          {link ? (
            <a className="pb-btn pb-price-btn" {...link}>
              {ctaContent}
            </a>
          ) : (
            <span className="pb-btn pb-price-btn">{ctaContent}</span>
          )}
        </div>
      ) : null}
      {props.footerNote || note.editing ? (
        <p className="pb-price-note">
          {props.footerIcon ? <IconView name={props.footerIcon} /> : null}
          <span ref={note.ref as React.Ref<HTMLSpanElement>} {...note.attrs}>
            {note.editing ? null : props.footerNote}
          </span>
        </p>
      ) : null}
    </div>
  );
}

function PricingTableSettings() {
  const featured = useField<boolean>("featured");
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Plano">
            <TextField path="name" label="Nome do plano" />
            <SelectField
              path="nameTag"
              label="Nível do nome (SEO)"
              options={[
                { value: "h2", label: "H2" },
                { value: "h3", label: "H3" },
                { value: "h4", label: "H4" },
                { value: "p", label: "Parágrafo" },
              ]}
            />
            <TextAreaField path="description" label="Descrição" rows={2} />
          </Group>
          <Group title="Preço">
            <div className="grid grid-cols-2 gap-3">
              <TextField path="currency" label="Moeda" />
              <TextField path="amount" label="Valor" />
              <TextField path="cents" label="Centavos" />
              <TextField path="period" label="Período" />
            </div>
            <TextField path="oldPrice" label="Preço antigo (riscado)" placeholder="ex.: R$ 197" />
            <TextField path="installments" label="Parcelamento" placeholder="ex.: ou 12x de R$ 9,70" />
          </Group>
          <Group title="Recursos">
            <ListField<PricingFeature>
              path="features"
              label="Itens do plano"
              addLabel="Adicionar recurso"
              create={() => ({
                id: newItemId(),
                text: "Novo recurso",
                included: true,
              })}
              itemLabel={(item) => `${item.included ? "✓" : "✕"} ${item.text}`}
              renderItem={(itemPath) => (
                <>
                  <TextField path={`${itemPath}.text`} label="Texto" />
                  <SwitchField path={`${itemPath}.included`} label="Incluído no plano" />
                </>
              )}
            />
            <IconField path="includedIcon" label="Ícone: incluído" />
            <IconField path="excludedIcon" label="Ícone: não incluído" />
          </Group>
          <Group title="Botão">
            <TextField path="ctaText" label="Texto" />
            <IconField path="ctaIcon" label="Ícone" allowNone />
            <ActionField path="ctaAction" label="Ao clicar" />
          </Group>
          <Group title="Destaque">
            <SwitchField path="featured" label="Plano em destaque" hint="Selo, borda colorida e leve ampliação." />
            {featured.value ? (
              <TextField path="badgeText" label="Texto do selo" placeholder="ex.: Mais popular" />
            ) : null}
          </Group>
          <Group title="Rodapé" defaultOpen={false}>
            <TextField path="footerNote" label="Nota" placeholder="ex.: Garantia de 7 dias" />
            <IconField path="footerIcon" label="Ícone" allowNone />
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
                { value: "left", label: "Esquerda" },
                { value: "center", label: "Centro" },
              ]}
            />
            <SidesField path="padding" label="Espaço interno" units={["px", "em", "%"]} />
            <NumberUnitField path="gap" label="Espaço entre os blocos" units={["px", "em"]} max={60} />
          </Group>
          <Group title="Nome do plano" defaultOpen={false}>
            <TypographyFields base="nameTypography" withAlign={false} />
          </Group>
          <Group title="Descrição" defaultOpen={false}>
            <TypographyFields base="descriptionTypography" withAlign={false} />
          </Group>
          <Group title="Preço" defaultOpen={false}>
            <TypographyFields base="priceTypography" withAlign={false} />
            <ColorField path="priceMutedColor" label="Cor do período e parcelas" />
          </Group>
          <Group title="Recursos" defaultOpen={false}>
            <TypographyFields base="featuresTypography" withAlign={false} />
            <ColorField path="includedColor" label="Ícone: incluído" />
            <ColorField path="excludedColor" label="Não incluído" />
            <ColorField path="dividerColor" label="Linha divisória" />
          </Group>
          <ButtonStyleGroups base="button" />
          <Group title="Rodapé" defaultOpen={false}>
            <ColorField path="noteColor" label="Cor da nota" />
          </Group>
          {featured.value ? (
            <Group title="Destaque" defaultOpen={false}>
              <ColorField path="featuredBorderColor" label="Cor da borda" />
              <ColorField path="badgeBackground" label="Fundo do selo" />
              <ColorField path="badgeColor" label="Texto do selo" />
              <NumberField path="featuredScale" label="Ampliação (desktop)" min={1} max={1.15} step={0.01} />
              <ShadowFields base="featuredShadow" />
            </Group>
          ) : null}
          <Group title="Caixa" defaultOpen={false}>
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
      advanced={<BoxFields />}
    />
  );
}

export const PricingTable: ComponentDefinition<PricingTableProps> = {
  type: "PricingTable",
  displayName: "Tabela de preços",
  category: "conversion",
  icon: BadgeDollarSign,
  inToolbox: true,
  defaults: {
    name: "Profissional",
    nameTag: "h3",
    description: "Para quem quer acelerar os resultados com acompanhamento.",
    currency: "R$",
    amount: "97",
    cents: ",00",
    period: "/mês",
    oldPrice: "",
    installments: "",
    features: [
      { id: "f1", text: "Acesso a todas as aulas", included: true },
      { id: "f2", text: "Materiais para download", included: true },
      { id: "f3", text: "Comunidade exclusiva", included: true },
      { id: "f4", text: "Certificado de conclusão", included: true },
      { id: "f5", text: "Mentoria individual", included: false },
    ],
    includedIcon: "check",
    excludedIcon: "x",
    includedColor: "#16a34a",
    excludedColor: C.textMuted,
    ctaText: "Assinar agora",
    ctaIcon: "",
    ctaAction: { type: "url", url: "", newTab: false },
    button: defaultButtonStyle({
      fullWidth: responsive(true),
      padding: responsive(sides("15px", "24px")),
    }),
    footerNote: "",
    footerIcon: "shield-check",
    featured: false,
    badgeText: "Mais popular",
    badgeBackground: C.primary,
    badgeColor: "#ffffff",
    featuredBorderColor: C.primary,
    featuredScale: 1.04,
    featuredShadow: defaultShadow({
      enabled: true,
      y: 20,
      blur: 48,
      color: `color-mix(in srgb, ${C.primary} 22%, transparent)`,
    }),
    align: "center",
    nameTypography: defaultTypography({
      fontFamily: FONT_HEADING,
      fontSize: responsive("20px"),
      fontWeight: "700",
      lineHeight: responsive("1.3"),
      color: C.text,
    }),
    descriptionTypography: defaultTypography({
      fontFamily: FONT_BODY,
      fontSize: responsive("14px"),
      lineHeight: responsive("1.55"),
      color: C.textMuted,
    }),
    priceTypography: defaultTypography({
      fontFamily: FONT_HEADING,
      fontSize: responsive("52px", undefined, "46px"),
      fontWeight: "800",
      lineHeight: responsive("1"),
      letterSpacing: responsive("-1px"),
      color: C.text,
    }),
    priceMutedColor: C.textMuted,
    featuresTypography: defaultTypography({
      fontFamily: FONT_BODY,
      fontSize: responsive("15px"),
      lineHeight: responsive("1.45"),
      color: C.text,
    }),
    noteColor: C.textMuted,
    dividerColor: C.border,
    padding: responsive(sides("32px", "28px"), undefined, sides("28px", "22px")),
    gap: responsive("24px"),
    background: defaultBackground({ type: "color", color: C.background }),
    border: defaultBorder({
      style: "solid",
      color: C.border,
      radius: responsive(corners("20px")),
    }),
    shadow: defaultShadow({
      enabled: true,
      y: 4,
      blur: 18,
      color: "#0000000d",
    }),
    box: defaultBox(),
  },
  View: PricingTableView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const root = sheet.root();
    const center = p.align === "center";
    root
      .set("position", "relative")
      .set("display", "flex")
      .set("flex-direction", "column")
      .set("gap", p.gap)
      .set("min-width", "0")
      .set("padding", p.padding, sidesToCss)
      .set("text-align", p.align)
      .set("box-shadow", shadowToCss(p.shadow));
    applyBackground(root, p.background);
    applyBorder(root, p.border);

    if (p.featured) {
      root
        .set("z-index", "1")
        .set("border-style", "solid")
        .set("border-width", "2px")
        .set("border-color", p.featuredBorderColor)
        .set("box-shadow", shadowToCss(p.featuredShadow));
      // propriedade "scale" (não "transform"): não briga com as animações
      if (p.featuredScale !== 1) {
        root.setOn("desktop", "scale", String(p.featuredScale)).setOn("tablet", "scale", "1");
      }
      sheet
        .rule(" .pb-price-badge")
        .set("position", "absolute")
        .set("top", "0")
        .set("left", center ? "50%" : "28px")
        .set("transform", center ? "translate(-50%,-50%)" : "translateY(-50%)")
        .set("padding", "6px 14px")
        .set("border-radius", "999px")
        .set("white-space", "nowrap")
        .set("font-size", "12px")
        .set("font-weight", "700")
        .set("letter-spacing", ".06em")
        .set("text-transform", "uppercase")
        .set("line-height", "1.2")
        .set("background-color", p.badgeBackground)
        .set("color", p.badgeColor);
    }

    sheet.rule(" .pb-price-head").set("display", "flex").set("flex-direction", "column").set("gap", "6px");
    applyTypography(sheet.rule(" .pb-price-name"), {
      ...p.nameTypography,
      textAlign: undefined,
    });
    applyTypography(sheet.rule(" .pb-price-desc"), {
      ...p.descriptionTypography,
      textAlign: undefined,
    });

    sheet
      .rule(" .pb-price-value")
      .set("display", "flex")
      .set("flex-direction", "column")
      .set("align-items", center ? "center" : "flex-start")
      .set("gap", "6px");
    sheet.rule(" .pb-price-old").set("font-size", "15px").set("color", p.priceMutedColor);
    const row = sheet.rule(" .pb-price-row");
    applyTypography(row, { ...p.priceTypography, textAlign: undefined });
    row
      .set("display", "flex")
      .set("align-items", "flex-start")
      .set("justify-content", center ? "center" : "flex-start")
      .set("flex-wrap", "wrap")
      .set("white-space", "nowrap");
    sheet.rule(" .pb-price-cur").set("font-size", ".4em").set("font-weight", "600").set("margin", ".3em .2em 0 0");
    sheet.rule(" .pb-price-cents").set("font-size", ".4em").set("margin-top", ".3em");
    sheet
      .rule(" .pb-price-period")
      .set("align-self", "flex-end")
      .set("font-size", ".3em")
      .set("font-weight", "500")
      .set("letter-spacing", "0")
      .set("margin", "0 0 .35em .25em")
      .set("color", p.priceMutedColor);
    sheet.rule(" .pb-price-inst").set("font-size", "14px").set("color", p.priceMutedColor);

    const list = sheet.rule(" .pb-price-features");
    applyTypography(list, { ...p.featuresTypography, textAlign: undefined });
    list
      .set("list-style", "none")
      .set("margin", "0")
      .set("padding", "24px 0 0")
      .set("border-top", `1px solid ${p.dividerColor}`)
      .set("display", "flex")
      .set("flex-direction", "column")
      .set("gap", "12px")
      .set("text-align", "left");
    sheet.rule(" .pb-price-feat").set("display", "flex").set("align-items", "flex-start").set("gap", "10px");
    sheet
      .rule(" .pb-price-feat-icon")
      .set("display", "inline-flex")
      .set("flex-shrink", "0")
      .set("margin-top", ".2em")
      .set("color", p.includedColor);
    sheet.rule(" .pb-price-feat-icon svg").set("width", "1.05em").set("height", "1.05em");
    sheet.rule(" .pb-price-feat.is-off").set("color", p.excludedColor).set("opacity", ".75");
    sheet.rule(" .pb-price-feat.is-off .pb-price-feat-icon").set("color", p.excludedColor);
    sheet
      .rule(" .pb-sr")
      .set("position", "absolute")
      .set("width", "1px")
      .set("height", "1px")
      .set("overflow", "hidden")
      .set("clip", "rect(0 0 0 0)")
      .set("white-space", "nowrap");

    sheet
      .rule(" .pb-price-cta")
      .set("display", "flex")
      .set("justify-content", center ? "center" : "flex-start")
      .set("margin-top", "auto");
    sheet
      .rule(" .pb-price-note")
      .set("display", "flex")
      .set("align-items", "center")
      .set("justify-content", center ? "center" : "flex-start")
      .set("gap", "6px")
      .set("margin-top", "-8px")
      .set("font-size", "13px")
      .set("color", p.noteColor);
    sheet.rule(" .pb-price-note svg").set("width", "1.15em").set("height", "1.15em").set("flex-shrink", "0");

    applyBox(sheet, { ...p.box, padding: undefined }, "flex");
    return sheet.toString() + buttonStyleCss(id, ".pb-price-btn", p.button);
  },
  Settings: PricingTableSettings,
  fonts: (p) => [
    p.nameTypography.fontFamily,
    p.descriptionTypography.fontFamily,
    p.priceTypography.fontFamily,
    p.featuresTypography.fontFamily,
    p.button.typography.fontFamily,
  ],
};
