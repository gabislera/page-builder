/**
 * Acordeão composto: cada item (AccordionItem) é um nó de verdade e o corpo
 * dele é um canvas onde qualquer elemento pode ser arrastado.
 *
 * Marcação: <details><summary>…</summary><div class="pb-acc-panel">…</div>.
 * Sem JS, o <details> nativo abre e fecha normalmente. Com o runtime (ou no
 * editor), o acordeão ganha a classe `pb-acc-js` e a altura do painel anima
 * com `grid-template-rows: 0fr → 1fr`, tanto ao abrir quanto ao fechar.
 */
import { ListCollapse, PanelTopOpen } from "lucide-react";
import { createContext, isValidElement, useCallback, useContext, useState } from "react";
import { cn } from "#/lib/utils";
import { ChildItemsField } from "../controls/child-items.tsx";
import { ColorField } from "../controls/color.tsx";
import { Field, Group } from "../controls/field.tsx";
import {
  BorderFields,
  BoxFields,
  NumberField,
  ShadowFields,
  SidesField,
  TypographyFields,
} from "../controls/groups.tsx";
import { IconField } from "../controls/icon.tsx";
import { NumberUnitField, SegmentedField, SelectField, SwitchField, TextField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField, useNodeProps } from "../controls/use-field.ts";
import { h, type NodeSpec } from "../core/build.ts";
import { flattenChildren } from "../core/children.ts";
import { corners, defaultBorder, defaultBox, defaultShadow, defaultTypography, sides } from "../core/defaults.ts";
import { IconView } from "../core/icons.tsx";
import { useInlineEdit } from "../core/inline-edit.tsx";
import { nodeClassName, TOP_LEVEL_TYPES } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
  applyBorder,
  applyBox,
  applyTypography,
  createSheet,
  nodeSelector,
  shadowToCss,
  sidesToCss,
} from "../core/style-engine.ts";
import type { Border, BorderStyle, Box, Length, Shadow, Sides, Typography } from "../core/style-types.ts";
import { C, FONT_HEADING } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import { RevealOnSelect } from "./shared/editor-reveal.tsx";

/* ------------------------------------------------------------------ */
/* Acordeão (pai)                                                      */
/* ------------------------------------------------------------------ */

export type AccordionVariant = "list" | "cards" | "bordered";

export type AccordionProps = {
  /** Estilo pronto escolhido (os demais campos podem ser ajustados depois). */
  variant: AccordionVariant;
  /** Abrir um item fecha os outros. */
  exclusive: boolean;
  firstOpen: boolean;
  /** Duração da animação de abrir/fechar (ms). */
  duration: number;
  iconStyle: "plus-circle" | "plus" | "chevron" | "none";
  iconPosition: "left" | "right";
  iconColor: string;
  iconBackground: string;
  activeIconColor: string;
  activeIconBackground: string;
  titleTypography: Typography;
  /** Cor do título ao passar o mouse e quando aberto. */
  activeTitleColor: string;
  titlePadding: Responsive<Sides>;
  bodyPadding: Responsive<Sides>;
  bodyGap: Responsive<Length>;
  itemBackground: string;
  openItemBackground: string;
  border: Border;
  shadow: Shadow;
  openShadow: Shadow;
  gap: Responsive<Length>;
  /** Linha entre os itens (estilo lista de perguntas). */
  dividerStyle: BorderStyle;
  dividerColor: string;
  dividerWidth: Length;
  box: Box;
};

/** Cada estilo pronto é um conjunto de valores aplicado de uma vez. */
const VARIANTS: Record<AccordionVariant, Partial<AccordionProps>> = {
  list: {
    gap: responsive("0px"),
    itemBackground: "",
    openItemBackground: "",
    border: defaultBorder({ radius: responsive(corners("0px")) }),
    shadow: defaultShadow(),
    openShadow: defaultShadow(),
    dividerStyle: "solid",
    titlePadding: responsive(sides("20px", "20px"), undefined, sides("16px", "16px")),
    bodyPadding: responsive(sides("0px", "20px", "20px"), undefined, sides("0px", "16px", "16px")),
    iconStyle: "chevron",
  },
  cards: {
    gap: responsive("12px"),
    itemBackground: C.surface,
    openItemBackground: C.background,
    border: defaultBorder({ radius: responsive(corners("16px")) }),
    shadow: defaultShadow(),
    openShadow: defaultShadow({
      enabled: true,
      y: 12,
      blur: 32,
      spread: -12,
      color: "#00000026",
    }),
    dividerStyle: "none",
    titlePadding: responsive(sides("20px", "24px"), undefined, sides("16px", "18px")),
    bodyPadding: responsive(sides("0px", "24px", "22px"), undefined, sides("0px", "18px", "18px")),
    iconStyle: "chevron",
  },
  bordered: {
    gap: responsive("12px"),
    itemBackground: C.background,
    openItemBackground: C.background,
    border: defaultBorder({
      style: "solid",
      color: C.border,
      radius: responsive(corners("12px")),
    }),
    shadow: defaultShadow(),
    openShadow: defaultShadow(),
    dividerStyle: "none",
    titlePadding: responsive(sides("18px", "20px"), undefined, sides("16px")),
    bodyPadding: responsive(sides("0px", "20px", "20px"), undefined, sides("0px", "16px", "16px")),
    iconStyle: "chevron",
  },
};

const ACCORDION_DEFAULTS = {
  variant: "list",
  exclusive: true,
  firstOpen: true,
  duration: 350,
  iconStyle: "chevron",
  iconPosition: "right",
  iconColor: C.text,
  iconBackground: C.surface,
  activeIconColor: "#ffffff",
  activeIconBackground: C.primary,
  titleTypography: defaultTypography({
    fontFamily: FONT_HEADING,
    fontSize: responsive("18px", undefined, "16px"),
    fontWeight: "600",
    lineHeight: responsive("1.4"),
    color: C.text,
  }),
  activeTitleColor: C.primary,
  bodyGap: responsive("12px"),
  dividerColor: C.border,
  dividerWidth: "1px",
  ...VARIANTS.list,
  box: defaultBox({ width: responsive("100%") }),
} as AccordionProps;

type AccordionContextValue = {
  props: AccordionProps;
  index: number;
  /** Só no editor: abertura controlada pela view do acordeão. */
  isOpen?: (index: number, initial: boolean) => boolean;
  toggle?: (index: number, initial: boolean) => void;
  reveal?: (index: number) => void;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

const initiallyOpen = (p: AccordionProps, index: number, openByDefault: boolean) =>
  openByDefault || (p.firstOpen && index === 0);

function AccordionView({ id, props, children, rootRef }: NodeViewProps<AccordionProps>) {
  const isEditor = useIsEditor();
  const items = flattenChildren(children);
  // no editor, quem está aberto fica aqui (fora do histórico de desfazer)
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({});
  const isOpen = useCallback((index: number, initial: boolean) => openMap[index] ?? initial, [openMap]);
  const setOpen = useCallback(
    (index: number, open: boolean) =>
      setOpenMap((prev) => {
        const next: Record<number, boolean> = { ...prev, [index]: open };
        if (open && props.exclusive) {
          for (let i = 0; i < items.length; i++) if (i !== index) next[i] = false;
        }
        return next;
      }),
    [props.exclusive, items.length],
  );
  return (
    <div
      ref={rootRef as React.Ref<HTMLDivElement>}
      className={cn(nodeClassName(id, "pb-acc", props.box), isEditor && "pb-acc-js")}
      data-pb-node={id}
      data-pb-exclusive={props.exclusive ? "" : undefined}
    >
      {items.map((child, index) => (
        <AccordionContext.Provider
          key={isValidElement(child) && child.key !== null ? child.key : index}
          value={{
            props,
            index,
            isOpen: isEditor ? isOpen : undefined,
            toggle: isEditor ? (i, initial) => setOpen(i, !isOpen(i, initial)) : undefined,
            reveal: isEditor ? (i) => setOpen(i, true) : undefined,
          }}
        >
          {child}
        </AccordionContext.Provider>
      ))}
      {isEditor && items.length === 0 ? <div className="pb-placeholder">Adicione itens no painel</div> : null}
    </div>
  );
}

/** Miniaturas dos estilos prontos. */
function VariantPreview({ variant }: { variant: AccordionVariant }) {
  const row = {
    list: "h-3 border-b border-muted-foreground/30",
    cards: "h-2.5 rounded-sm bg-muted-foreground/20 px-1",
    bordered: "h-2.5 rounded-sm border border-muted-foreground/40 px-1",
  }[variant];
  return (
    <span className={cn("flex w-full flex-col", variant !== "list" && "gap-0.5")}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={cn("flex items-center justify-between", row)}>
          <span className="h-1 w-7 rounded bg-muted-foreground/50" />
          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
        </span>
      ))}
    </span>
  );
}

function VariantPicker() {
  const { props, update } = useNodeProps<AccordionProps>();
  const options: { value: AccordionVariant; label: string }[] = [
    { value: "list", label: "Lista" },
    { value: "cards", label: "Cards" },
    { value: "bordered", label: "Bordas" },
  ];
  return (
    <Field label="Estilo" hint="Aplica um visual pronto; depois dá para ajustar cada detalhe.">
      <div className="grid grid-cols-3 gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() =>
              update((draft) => {
                Object.assign(draft, structuredClone(VARIANTS[o.value]), {
                  variant: o.value,
                });
              })
            }
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-md border p-2 text-[11px]",
              props.variant === o.value
                ? "border-primary bg-primary/10"
                : "border-border text-muted-foreground hover:border-muted-foreground/50",
            )}
          >
            <span className="flex h-10 w-full items-center px-1">
              <VariantPreview variant={o.value} />
            </span>
            {o.label}
          </button>
        ))}
      </div>
    </Field>
  );
}

function AccordionSettings() {
  const iconStyle = useField<AccordionProps["iconStyle"]>("iconStyle").value;
  const divider = useField<BorderStyle>("dividerStyle").value;
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Itens">
            <ChildItemsField
              label="Itens do acordeão"
              childType="AccordionItem"
              itemLabel={(p) => String(p.title ?? "")}
              addLabel="Adicionar item"
              create={(i) =>
                h("AccordionItem", { title: `Pergunta ${i + 1}` }, [
                  h("Text", { html: "<p>Escreva aqui a resposta.</p>" }),
                ])
              }
              min={1}
            />
          </Group>
          <Group title="Comportamento">
            <SwitchField path="exclusive" label="Só um aberto por vez" />
            <SwitchField path="firstOpen" label="Primeiro item aberto" />
            <NumberField path="duration" label="Duração da animação (ms)" min={0} max={1000} step={50} />
          </Group>
        </>
      }
      style={
        <>
          <Group title="Estilo pronto">
            <VariantPicker />
          </Group>
          <Group title="Título" defaultOpen={false}>
            <TypographyFields base="titleTypography" withAlign={false} />
            <ColorField path="activeTitleColor" label="Cor ao passar o mouse / aberto" allowEmpty />
            <SidesField path="titlePadding" label="Espaço interno" units={["px", "rem"]} />
          </Group>
          <Group title="Ícone" defaultOpen={false}>
            <SelectField
              path="iconStyle"
              label="Estilo"
              options={[
                { value: "chevron", label: "Seta" },
                { value: "plus-circle", label: "Mais em círculo (vira ×)" },
                { value: "plus", label: "Mais (vira ×)" },
                { value: "none", label: "Nenhum" },
              ]}
            />
            {iconStyle !== "none" ? (
              <>
                <SegmentedField
                  path="iconPosition"
                  label="Posição"
                  options={[
                    { value: "left", label: "Esquerda" },
                    { value: "right", label: "Direita" },
                  ]}
                />
                <ColorField path="iconColor" label="Cor" />
                {iconStyle === "plus-circle" ? (
                  <>
                    <ColorField path="activeIconColor" label="Cor quando aberto" />
                    <ColorField path="iconBackground" label="Fundo do círculo" />
                    <ColorField path="activeIconBackground" label="Fundo quando aberto" />
                  </>
                ) : null}
              </>
            ) : null}
          </Group>
          <Group title="Itens" defaultOpen={false}>
            <NumberUnitField path="gap" label="Espaço entre itens" units={["px", "rem"]} max={80} />
            <ColorField path="itemBackground" label="Fundo" allowEmpty />
            <ColorField path="openItemBackground" label="Fundo quando aberto" allowEmpty />
            <BorderFields base="border" />
            <ShadowFields base="shadow" />
          </Group>
          <Group title="Divisória" defaultOpen={false}>
            <SelectField
              path="dividerStyle"
              label="Linha entre itens"
              options={[
                { value: "none", label: "Nenhuma" },
                { value: "solid", label: "Sólida" },
                { value: "dashed", label: "Tracejada" },
                { value: "dotted", label: "Pontilhada" },
              ]}
            />
            {divider !== "none" ? (
              <>
                <NumberUnitField path="dividerWidth" label="Espessura" units={["px"]} max={10} />
                <ColorField path="dividerColor" label="Cor" />
              </>
            ) : null}
          </Group>
          <Group title="Conteúdo" defaultOpen={false}>
            <SidesField path="bodyPadding" label="Espaço interno" units={["px", "rem"]} />
            <NumberUnitField path="bodyGap" label="Espaço entre elementos" units={["px", "rem"]} max={80} />
          </Group>
        </>
      }
      advanced={<BoxFields />}
    />
  );
}

export const Accordion: ComponentDefinition<AccordionProps> = {
  type: "Accordion",
  displayName: "Acordeão",
  category: "layout",
  icon: ListCollapse,
  isCanvas: true,
  inToolbox: true,
  defaults: ACCORDION_DEFAULTS,
  runtime: ["accordion"],
  rules: {
    canMoveIn: (incoming) => incoming.every((n) => n.data.name === "AccordionItem"),
  },
  View: AccordionView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const S = nodeSelector(id);
    const ease = "cubic-bezier(.4,0,.2,1)";
    const ms = `${Math.max(0, p.duration)}ms`;
    sheet.root().set("display", "flex").set("flex-direction", "column").set("gap", p.gap);

    const I = " > .pb-acc-item";
    // "aberto": classe is-open com JS; atributo [open] sem JS
    const open = (suffix = "") => `${S}${I}.is-open${suffix}, ${S}:not(.pb-acc-js)${I}[open]${suffix}`;

    const item = sheet.rule(I);
    item
      .set("background-color", p.itemBackground)
      .set("box-shadow", shadowToCss(p.shadow))
      .set("overflow", "hidden")
      .set("transition", `background-color ${ms} ${ease}, box-shadow ${ms} ${ease}`);
    applyBorder(item, p.border);
    sheet.raw(open()).set("background-color", p.openItemBackground).set("box-shadow", shadowToCss(p.openShadow));
    if (p.dividerStyle !== "none") {
      const line = `${p.dividerWidth} ${p.dividerStyle} ${p.dividerColor}`;
      sheet.rule(I).set("border-bottom", line);
      sheet.rule(`${I}:first-child`).set("border-top", line);
    }

    // título
    const title = sheet.rule(`${I} > .pb-acc-title`);
    title
      .set("display", "flex")
      .set("align-items", "center")
      .set("gap", "16px")
      .set("cursor", "pointer")
      .set("list-style", "none")
      .set("padding", p.titlePadding, sidesToCss)
      .set("transition", `color .2s ${ease}`);
    applyTypography(title, p.titleTypography);
    sheet.rule(`${I} > .pb-acc-title:hover`).set("color", p.activeTitleColor);
    sheet.raw(open(" > .pb-acc-title")).set("color", p.activeTitleColor);
    sheet.rule(`${I} > .pb-acc-title::-webkit-details-marker`).set("display", "none");
    sheet
      .rule(`${I} > .pb-acc-title:focus-visible`)
      .set("outline", `2px solid ${C.primary}`)
      .set("outline-offset", "2px")
      .set("border-radius", "6px");
    sheet.rule(`${I} > .pb-acc-title > .pb-acc-title-text`).set("flex", "1").set("min-width", "0");
    sheet
      .rule(`${I} > .pb-acc-title > .pb-acc-title-icon`)
      .set("flex-shrink", "0")
      .set("width", "1.15em")
      .set("height", "1.15em");

    // indicador: "+" que gira e vira "×", ou seta que vira para cima
    const ind = `${I} > .pb-acc-title > .pb-acc-ind`;
    sheet
      .rule(ind)
      .set("flex-shrink", "0")
      .set("display", "inline-flex")
      .set("align-items", "center")
      .set("justify-content", "center")
      .set("color", p.iconColor)
      .set("transition", `transform ${ms} ${ease}, background-color ${ms} ${ease}, color ${ms} ${ease}`);
    sheet.rule(`${ind} > svg`).set("width", "18px").set("height", "18px");
    const indOpen = sheet.raw(open(" > .pb-acc-title > .pb-acc-ind"));
    // seta/"+" simples acompanham a cor do título aberto; no círculo, a cor própria
    indOpen.set("color", p.iconStyle === "plus-circle" ? p.activeIconColor : p.activeTitleColor);
    if (p.iconStyle === "plus-circle") {
      sheet
        .rule(ind)
        .set("width", "32px")
        .set("height", "32px")
        .set("border-radius", "999px")
        .set("background-color", p.iconBackground);
      sheet.rule(`${ind} > svg`).set("width", "16px").set("height", "16px");
      indOpen.set("background-color", p.activeIconBackground).set("transform", "rotate(45deg)");
    } else {
      indOpen.set("transform", p.iconStyle === "plus" ? "rotate(45deg)" : "rotate(180deg)");
    }

    // painel: altura anima de 0fr a 1fr (fechar também anima)
    sheet.rule(`${I} > .pb-acc-panel`).set("display", "grid").set("grid-template-rows", "1fr");
    sheet
      .raw(`${S}.pb-acc-js${I} > .pb-acc-panel`)
      .set("grid-template-rows", "0fr")
      .set("transition", `grid-template-rows ${ms} ${ease}`);
    sheet.raw(`${S}.pb-acc-js${I}.is-open > .pb-acc-panel`).set("grid-template-rows", "1fr");
    sheet.rule(`${I} > .pb-acc-panel > .pb-acc-clip`).set("min-height", "0").set("overflow", "hidden");
    sheet
      .rule(`${I} > .pb-acc-panel > .pb-acc-clip > .pb-acc-body`)
      .set("display", "flex")
      .set("flex-direction", "column")
      .set("gap", p.bodyGap)
      .set("padding", p.bodyPadding, sidesToCss);
    // conteúdo aparece com um leve fade enquanto o painel abre
    sheet
      .raw(`${S}.pb-acc-js${I} > .pb-acc-panel > .pb-acc-clip > .pb-acc-body`)
      .set("opacity", "0")
      .set("transform", "translateY(-6px)")
      .set("transition", `opacity ${ms} ${ease}, transform ${ms} ${ease}`);
    sheet
      .raw(`${S}.pb-acc-js${I}.is-open > .pb-acc-panel > .pb-acc-clip > .pb-acc-body`)
      .set("opacity", "1")
      .set("transform", "none");

    applyBox(sheet, p.box, "flex");
    sheet.appendRaw(`@media (prefers-reduced-motion:reduce){${S} *{transition:none !important}}`);
    return sheet.toString();
  },
  Settings: AccordionSettings,
  fonts: (p) => [p.titleTypography.fontFamily],
};

/* ------------------------------------------------------------------ */
/* Item do acordeão (filho)                                            */
/* ------------------------------------------------------------------ */

export type AccordionItemProps = {
  title: string;
  /** Ícone do lucide antes do título (opcional). */
  icon: string;
  openByDefault: boolean;
  box: Box;
};

function Indicator({ style }: { style: AccordionProps["iconStyle"] }) {
  if (style === "none") return null;
  return (
    <span className="pb-acc-ind" aria-hidden="true">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {style === "chevron" ? <path d="m6 9 6 6 6-6" /> : <path d="M12 5v14M5 12h14" />}
      </svg>
    </span>
  );
}

function AccordionItemView({ id, props, children, rootRef, onPropChange }: NodeViewProps<AccordionItemProps>) {
  const isEditor = useIsEditor();
  const ctx = useContext(AccordionContext);
  const parent = ctx?.props ?? ACCORDION_DEFAULTS;
  const index = ctx?.index ?? 0;
  const initial = initiallyOpen(parent, index, props.openByDefault);
  const open = ctx?.isOpen ? ctx.isOpen(index, initial) : initial;
  const title = useInlineEdit(props.title, onPropChange && ((v) => onPropChange("title", v)));
  const empty = !children || (Array.isArray(children) && children.length === 0);
  const indicator = <Indicator style={parent.iconStyle} />;
  return (
    <details
      ref={rootRef as React.Ref<HTMLDetailsElement>}
      className={cn(nodeClassName(id, "pb-acc-item", props.box), open && "is-open")}
      data-pb-node={id}
      // no editor fica sempre "open": quem mostra/esconde é a classe is-open
      open={isEditor || open || undefined}
    >
      <summary
        className="pb-acc-title"
        onClick={
          isEditor
            ? (e) => {
                e.preventDefault();
                if (!title.editing) ctx?.toggle?.(index, initial);
              }
            : undefined
        }
      >
        {parent.iconPosition === "left" ? indicator : null}
        {props.icon ? <IconView name={props.icon} className="pb-acc-title-icon" /> : null}
        <span className="pb-acc-title-text" ref={title.ref as React.Ref<HTMLSpanElement>} {...title.attrs}>
          {title.editing ? null : props.title}
        </span>
        {parent.iconPosition === "right" ? indicator : null}
      </summary>
      <div className="pb-acc-panel">
        <div className="pb-acc-clip">
          <div className="pb-acc-body">
            {children}
            {isEditor && empty ? <div className="pb-placeholder">Arraste elementos para este item</div> : null}
          </div>
        </div>
      </div>
      {isEditor ? (
        <RevealOnSelect
          id={id}
          onReveal={(selected) => {
            if (selected && !open) ctx?.reveal?.(index);
          }}
        />
      ) : null}
    </details>
  );
}

function AccordionItemSettings() {
  return (
    <SettingsTabs
      content={
        <Group title="Item">
          <TextField path="title" label="Título" />
          <IconField path="icon" label="Ícone antes do título" allowNone />
          <SwitchField
            path="openByDefault"
            label="Aberto ao carregar"
            hint="A aparência de todos os itens fica nas configurações do acordeão."
          />
        </Group>
      }
      advanced={<BoxFields withSize={false} />}
    />
  );
}

/** Tipos que não podem ir para dentro de um item (evita aninhar acordeões). */
const ITEM_BLOCKED = new Set(["Page", "Accordion", "AccordionItem"]);

export const AccordionItem: ComponentDefinition<AccordionItemProps> = {
  type: "AccordionItem",
  displayName: "Item do acordeão",
  category: "layout",
  icon: PanelTopOpen,
  isCanvas: true,
  inToolbox: false,
  defaults: {
    title: "Pergunta",
    icon: "",
    openByDefault: false,
    box: defaultBox(),
  },
  rules: {
    canDrop: (target) => target.data.name === "Accordion",
    canMoveIn: (incoming) => incoming.every((n) => !TOP_LEVEL_TYPES.has(n.data.name) && !ITEM_BLOCKED.has(n.data.name)),
  },
  View: AccordionItemView,
  css: (id, p) => {
    const sheet = createSheet(id);
    applyBox(sheet, p.box, "block");
    return sheet.toString();
  },
  Settings: AccordionItemSettings,
};

/** Acordeão inicial (Toolbox): 3 perguntas com resposta. */
export const accordionSpec = (): NodeSpec =>
  h(
    "Accordion",
    {},
    [
      ["Como funciona?", "Explique em poucas linhas como o cliente usa o produto."],
      ["Quanto tempo leva?", "Diga em quanto tempo o cliente vê os primeiros resultados."],
      ["Tem garantia?", "Descreva a garantia e como pedir o reembolso."],
    ].map(([title, answer]) => h("AccordionItem", { title }, [h("Text", { html: `<p>${answer}</p>` })])),
  );

/** "Perguntas frequentes" da Toolbox: o acordeão já com perguntas e respostas. */
export const faqSpec = (): NodeSpec =>
  h(
    "Accordion",
    {},
    [
      ["Por quanto tempo terei acesso?", "O acesso é vitalício. Você pode assistir quando e quantas vezes quiser."],
      ["Tem garantia?", "Sim! Você tem 7 dias de garantia incondicional. Se não gostar, devolvemos 100% do valor."],
      ["Quais são as formas de pagamento?", "Cartão de crédito em até 12x, Pix ou boleto."],
      ["Como recebo o acesso?", "Logo após a confirmação do pagamento, você recebe o acesso por e-mail."],
    ].map(([title, answer]) => h("AccordionItem", { title }, [h("Text", { html: `<p>${answer}</p>` })])),
    "Perguntas frequentes",
  );
