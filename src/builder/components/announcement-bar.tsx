/**
 * Announcement bar: thin highlight strip ("Promoção termina hoje →").
 * Lives directly on the page, always above the header.
 * Can stick to the top on scroll and can be dismissed by the visitor; the site
 * remembers for a few days (localStorage). A one-line script right after
 * the bar hides it during HTML parse, with no flash.
 */
import { Megaphone, X } from "lucide-react";
import { ActionField } from "../controls/action.tsx";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import { BackgroundFields, BoxFields, NumberField, SidesField, TypographyFields } from "../controls/groups.tsx";
import { IconField } from "../controls/icon.tsx";
import { SegmentedField, SwitchField, TextField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { actionLink } from "../core/actions.ts";
import { defaultBackground, defaultBox, defaultTypography, sides } from "../core/defaults.ts";
import { IconView } from "../core/icons.tsx";
import { useInlineEdit } from "../core/inline-edit.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useIsEditor, useRender } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
  applyBackground,
  applyBox,
  applyTypography,
  createSheet,
  nodeSelector,
  sidesToCss,
} from "../core/style-engine.ts";
import type { Action, Background, Box, Length, Sides, Typography } from "../core/style-types.ts";
import { C, FONT_BODY } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type AnnouncementBarProps = {
  text: string;
  icon: string;
  linkText: string;
  action: Action;
  linkStyle: "link" | "button";
  dismissible: boolean;
  /** How many days the bar stays hidden after it is dismissed. */
  rememberDays: number;
  /** Sticks to the top of the screen while scrolling. */
  sticky: boolean;
  align: Responsive<"center" | "space-between">;
  background: Background;
  typography: Typography;
  linkColor: string;
  buttonBackground: string;
  buttonColor: string;
  padding: Responsive<Sides>;
  gap: Responsive<Length>;
  box: Box;
};

const storageKey = (id: string) => `pb-bar-${id}`;

function AnnouncementBarView({ id, props, rootRef, onPropChange }: NodeViewProps<AnnouncementBarProps>) {
  const ctx = useRender();
  const isEditor = useIsEditor();
  const text = useInlineEdit(props.text, onPropChange && ((v) => onPropChange("text", v)));
  const link = props.linkText ? actionLink(props.action, ctx) : null;
  const bar = (
    <aside
      ref={rootRef as React.Ref<HTMLElement>}
      className={nodeClassName(id, "pb-bar", props.box)}
      data-pb-node={id}
      data-pb-live={isEditor ? undefined : ""}
      data-pb-sticky={props.sticky ? "" : undefined}
      data-pb-bar={props.dismissible ? storageKey(id) : undefined}
      data-pb-remember={props.dismissible ? props.rememberDays : undefined}
      aria-label="Aviso"
    >
      <div className="pb-bar-inner">
        <span className="pb-bar-text">
          {props.icon ? <IconView name={props.icon} className="pb-bar-icon" /> : null}
          <span ref={text.ref as React.Ref<HTMLSpanElement>} {...text.attrs}>
            {text.editing ? null : props.text}
          </span>
        </span>
        {props.linkText ? (
          <a className={props.linkStyle === "button" ? "pb-bar-btn" : "pb-bar-link"} {...(link ?? {})}>
            {props.linkText}
          </a>
        ) : null}
      </div>
      {props.dismissible ? (
        <button type="button" className="pb-bar-close" aria-label="Fechar aviso" data-pb-bar-close="">
          <X width="16" height="16" aria-hidden="true" />
        </button>
      ) : null}
    </aside>
  );
  if (isEditor || !props.dismissible) return bar;
  // hide before paint if the visitor already dismissed it (no flash)
  const hideIfDismissed = `try{var e=document.currentScript.previousElementSibling,v=+localStorage.getItem(${JSON.stringify(storageKey(id))});if(v&&v>Date.now())e.hidden=true}catch(_){}`;
  return (
    <>
      {bar}
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: fixed script, no user content */}
      <script dangerouslySetInnerHTML={{ __html: hideIfDismissed }} />
    </>
  );
}

function AnnouncementBarSettings() {
  const dismissible = useField<boolean>("dismissible").value;
  const linkStyle = useField<string>("linkStyle").value;
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Aviso">
            <TextField path="text" label="Texto" />
            <IconField path="icon" label="Ícone" allowNone />
          </Group>
          <Group title="Link">
            <TextField path="linkText" label="Texto do link" placeholder="ex.: Aproveitar →" />
            <ActionField path="action" />
            <SegmentedField
              path="linkStyle"
              label="Aparência"
              options={[
                { value: "link", label: "Link" },
                { value: "button", label: "Botão" },
              ]}
            />
          </Group>
          <Group title="Comportamento">
            <SwitchField path="sticky" label="Fixa no topo ao rolar" />
            <SwitchField path="dismissible" label="Visitante pode fechar" />
            {dismissible ? (
              <NumberField path="rememberDays" label="Fica escondida por (dias)" min={0} max={60} step={1} />
            ) : null}
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
                { value: "center", label: "Centro" },
                { value: "space-between", label: "Nas pontas" },
              ]}
            />
            <SidesField path="padding" label="Espaço interno" units={["px", "rem"]} />
          </Group>
          <Group title="Fundo">
            <BackgroundFields base="background" />
          </Group>
          <Group title="Texto" defaultOpen={false}>
            <TypographyFields base="typography" withAlign={false} />
            {linkStyle === "button" ? (
              <>
                <ColorField path="buttonBackground" label="Fundo do botão" />
                <ColorField path="buttonColor" label="Texto do botão" />
              </>
            ) : (
              <ColorField path="linkColor" label="Cor do link" allowEmpty />
            )}
          </Group>
        </>
      }
      advanced={<BoxFields withSize={false} />}
    />
  );
}

export const AnnouncementBar: ComponentDefinition<AnnouncementBarProps> = {
  type: "AnnouncementBar",
  displayName: "Barra de aviso",
  category: "conversion",
  icon: Megaphone,
  inToolbox: true,
  notDuplicable: true,
  runtime: ["announcement"],
  // page-only, always at the top (see editor/top-bar-order)
  rules: {
    canDrop: (target) => target.data.name === "Page",
    canDrag: () => false,
    canMoveIn: () => false,
  },
  defaults: {
    text: "Oferta de lançamento: 50% de desconto só até domingo.",
    icon: "sparkles",
    linkText: "Aproveitar →",
    action: { type: "url", url: "", newTab: false },
    linkStyle: "link",
    dismissible: true,
    rememberDays: 3,
    sticky: false,
    align: responsive("center"),
    background: defaultBackground({ type: "color", color: C.secondary }),
    typography: defaultTypography({
      fontFamily: FONT_BODY,
      fontSize: responsive("14px", undefined, "13px"),
      fontWeight: "500",
      lineHeight: responsive("1.4"),
      color: "#ffffff",
    }),
    linkColor: "",
    buttonBackground: "#ffffff",
    buttonColor: C.secondary,
    padding: responsive(sides("10px", "48px", "10px", "16px"), undefined, sides("10px", "40px", "10px", "12px")),
    gap: responsive("12px"),
    box: defaultBox({ width: responsive("100%") }),
  },
  View: AnnouncementBarView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const root = sheet.root();
    root.set("position", "relative").set("padding", p.padding, sidesToCss);
    applyBackground(root, p.background);
    applyTypography(root, p.typography);

    sheet
      .rule(" > .pb-bar-inner")
      .set("display", "flex")
      .set("flex-wrap", "wrap")
      .set("align-items", "center")
      .set("justify-content", p.align)
      .set("gap", p.gap)
      .set("max-width", "var(--pb-content-width)")
      .set("margin", "0 auto")
      .set("text-align", "center");
    sheet.rule(" .pb-bar-text").set("display", "inline-flex").set("align-items", "center").set("gap", "8px");
    sheet.rule(" .pb-bar-icon").set("width", "1.1em").set("height", "1.1em").set("flex-shrink", "0");
    sheet
      .rule(" .pb-bar-link")
      .set("color", p.linkColor || "inherit")
      .set("font-weight", "700")
      .set("text-decoration", "underline")
      .set("text-underline-offset", "3px")
      .set("white-space", "nowrap");
    sheet
      .rule(" .pb-bar-btn")
      .set("display", "inline-flex")
      .set("padding", "6px 14px")
      .set("border-radius", "999px")
      .set("background-color", p.buttonBackground)
      .set("color", p.buttonColor)
      .set("font-weight", "700")
      .set("white-space", "nowrap")
      .set("transition", "opacity .2s ease");
    sheet.rule(" .pb-bar-btn:hover").set("opacity", ".85");
    sheet
      .rule(" > .pb-bar-close")
      .set("position", "absolute")
      .set("top", "50%")
      .set("right", "10px")
      .set("transform", "translateY(-50%)")
      .set("display", "inline-flex")
      .set("padding", "6px")
      .set("border", "0")
      .set("border-radius", "999px")
      .set("background", "transparent")
      .set("color", "inherit")
      .set("opacity", ".75")
      .set("cursor", "pointer");
    sheet.rule(" > .pb-bar-close:hover").set("opacity", "1").set("background", "rgba(255,255,255,.12)");
    applyBox(sheet, { ...p.box, padding: undefined }, "block");
    // stick to the top only on the published page; stay in flow in the editor
    if (p.sticky) sheet.rule("[data-pb-live]").set("position", "sticky").set("top", "0").set("z-index", "55");
    // sticky header sits just below the bar (height measured at runtime)
    if (p.sticky)
      sheet.appendRaw(
        `${nodeSelector(id)}[data-pb-live]:not([hidden]) ~ .pb-header[data-pb-live]{top:var(--pb-bar-h,0px)}`,
      );
    return sheet.toString();
  },
  Settings: AnnouncementBarSettings,
  fonts: (p) => [p.typography.fontFamily],
};
