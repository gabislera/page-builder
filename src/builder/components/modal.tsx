import { AppWindow } from "lucide-react";
import type { CSSProperties } from "react";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
  BackgroundFields,
  BorderFields,
  BoxFields,
  NumberField,
  ShadowFields,
  SidesField,
} from "../controls/groups.tsx";
import { IconField } from "../controls/icon.tsx";
import { NumberUnitField, SegmentedField, SwitchField, TextField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { corners, defaultBackground, defaultBorder, defaultBox, defaultShadow, sides } from "../core/defaults.ts";
import { IconView } from "../core/icons.tsx";
import { nodeClassName, TOP_LEVEL_TYPES } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import { applyBackground, applyBorder, applyBox, createSheet, shadowToCss, sidesToCss } from "../core/style-engine.ts";
import type { Background, Border, Box, Length, Shadow, Sides } from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import { type ButtonStyle, ButtonStyleGroups, buttonStyleCss, defaultButtonStyle } from "./shared/button-style.tsx";

type Align = "stretch" | "flex-start" | "center" | "flex-end";

export type ModalProps = {
  /** Name shown in the editor. */
  name: string;
  /** Show the content in the editor (otherwise, only the label). */
  previewInEditor: boolean;
  maxWidth: Responsive<Length>;
  padding: Responsive<Sides>;
  gap: Responsive<Length>;
  contentAlign: Responsive<Align>;
  background: Background;
  border: Border;
  shadow: Shadow;
  backdropColor: string;
  /** Backdrop blur, in px. */
  backdropBlur: number;
  closeColor: string;
  closeSize: Length;
  autoOpen: "none" | "delay" | "exit";
  /** Seconds until it opens on its own (autoOpen "delay"). */
  delay: number;
  /** Open automatically only once per visitor session. */
  oncePerSession: boolean;
  showTrigger: boolean;
  triggerText: string;
  triggerIcon: string;
  triggerAlign: Responsive<Align>;
  trigger: ButtonStyle;
  box: Box;
};

/** Outline styles the modal gets only in the editor. */
const EDITOR_FRAME: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  outline: "1.5px dashed #93c5fd",
  outlineOffset: "4px",
  borderRadius: 6,
  padding: 8,
};
const EDITOR_LABEL: CSSProperties = {
  display: "inline-flex",
  alignSelf: "flex-start",
  alignItems: "center",
  gap: 6,
  padding: "3px 8px",
  borderRadius: 4,
  background: "#eff6ff",
  color: "color-mix(in srgb, var(--pb-c-primary) 85%, black)",
  font: "600 11px/1.4 Inter, system-ui, sans-serif",
  pointerEvents: "none",
};

function ModalView({ id, props, children, rootRef }: NodeViewProps<ModalProps>) {
  const isEditor = useIsEditor();
  const empty = !children || (Array.isArray(children) && children.length === 0);
  const auto = props.autoOpen !== "none";

  const trigger = props.showTrigger ? (
    <button
      type="button"
      className="pb-btn pb-modal-trigger"
      data-pb-modal={isEditor ? undefined : id}
      style={isEditor ? { pointerEvents: "none" } : undefined}
    >
      <span>{props.triggerText}</span>
      {props.triggerIcon ? <IconView name={props.triggerIcon} /> : null}
    </button>
  ) : null;

  const close = (
    <button type="button" className="pb-modal-close" data-pb-close="" aria-label="Fechar">
      <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );

  if (isEditor) {
    return (
      <div
        ref={rootRef as React.Ref<HTMLDivElement>}
        className={nodeClassName(id, "pb-modal-root", props.box)}
        data-pb-node={id}
        style={EDITOR_FRAME}
      >
        <span style={EDITOR_LABEL}>
          Modal: {props.name || "sem nome"} (visível só ao abrir)
          {auto ? ` · abre sozinho${props.autoOpen === "delay" ? ` após ${props.delay}s` : " na saída"}` : ""}
        </span>
        {trigger}
        <div
          className="pb-modal pb-modal-inline"
          style={props.previewInEditor ? { marginTop: 8 } : { display: "none" }}
        >
          {close}
          <div className="pb-modal-content">
            {children}
            {empty ? <div className="pb-placeholder">Arraste elementos para dentro do modal</div> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={nodeClassName(id, "pb-modal-root", props.box)} data-pb-node={id}>
      {trigger}
      <dialog
        id={`modal-${id}`}
        className="pb-modal"
        aria-label={props.name || undefined}
        data-pb-auto={auto ? props.autoOpen : undefined}
        data-pb-delay={props.autoOpen === "delay" ? String(props.delay) : undefined}
        data-pb-once={auto && props.oncePerSession ? "1" : undefined}
      >
        {close}
        <div className="pb-modal-content">{children}</div>
      </dialog>
    </div>
  );
}

function ModalSettings() {
  const autoOpen = useField<ModalProps["autoOpen"]>("autoOpen");
  const showTrigger = useField<boolean>("showTrigger");
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Modal">
            <TextField path="name" label="Nome" hint="Só para identificar no editor." />
            <SwitchField path="previewInEditor" label="Mostrar conteúdo no editor" />
            <p className="text-[11px] text-muted-foreground">
              Para abrir, use em qualquer botão, imagem ou container a ação “Abrir modal” e escolha este modal.
            </p>
          </Group>
          <Group title="Abrir automaticamente">
            <SegmentedField
              path="autoOpen"
              label="Quando"
              options={[
                { value: "none", label: "Nunca" },
                { value: "delay", label: "Após tempo" },
                { value: "exit", label: "Ao sair" },
              ]}
            />
            {autoOpen.value === "delay" ? <NumberField path="delay" label="Segundos" max={120} /> : null}
            {autoOpen.value === "exit" ? (
              <p className="text-[11px] text-muted-foreground">
                Abre quando o mouse sai pelo topo da janela (só em computadores).
              </p>
            ) : null}
            {autoOpen.value !== "none" ? <SwitchField path="oncePerSession" label="Só uma vez por visita" /> : null}
          </Group>
          <Group title="Botão próprio">
            <SwitchField path="showTrigger" label="Mostrar botão que abre o modal" />
            {showTrigger.value ? (
              <>
                <TextField path="triggerText" label="Texto" />
                <IconField path="triggerIcon" label="Ícone" />
              </>
            ) : null}
          </Group>
        </>
      }
      style={
        <>
          <Group title="Janela">
            <NumberUnitField path="maxWidth" label="Largura máxima" units={["px", "%", "vw"]} max={1200} />
            <SidesField path="padding" label="Espaço interno" units={["px", "rem"]} />
            <NumberUnitField path="gap" label="Espaço entre elementos" units={["px", "rem"]} max={80} />
            <SegmentedField
              path="contentAlign"
              label="Alinhamento"
              options={[
                { value: "stretch", label: "Esticar" },
                { value: "flex-start", label: "Início" },
                { value: "center", label: "Centro" },
                { value: "flex-end", label: "Fim" },
              ]}
            />
          </Group>
          <Group title="Fundo">
            <BackgroundFields base="background" />
          </Group>
          <Group title="Borda e sombra" defaultOpen={false}>
            <BorderFields base="border" />
            <ShadowFields base="shadow" />
          </Group>
          <Group title="Fundo da página (sobreposição)">
            <ColorField path="backdropColor" label="Cor" />
            <NumberField path="backdropBlur" label="Desfoque (px)" max={20} />
          </Group>
          <Group title="Botão fechar" defaultOpen={false}>
            <ColorField path="closeColor" label="Cor" />
            <NumberUnitField path="closeSize" label="Tamanho" units={["px"]} min={12} max={48} />
          </Group>
          {showTrigger.value ? (
            <>
              <Group title="Botão que abre">
                <SegmentedField
                  path="triggerAlign"
                  label="Alinhamento"
                  options={[
                    { value: "flex-start", label: "Início" },
                    { value: "center", label: "Centro" },
                    { value: "flex-end", label: "Fim" },
                    { value: "stretch", label: "Esticar" },
                  ]}
                />
              </Group>
              <ButtonStyleGroups base="trigger" title="Botão que abre" />
            </>
          ) : null}
        </>
      }
      advanced={<BoxFields withSize={false} />}
    />
  );
}

export const Modal: ComponentDefinition<ModalProps> = {
  type: "Modal",
  displayName: "Modal",
  category: "advanced",
  icon: AppWindow,
  isCanvas: true,
  inToolbox: true,
  defaults: {
    name: "Pop-up",
    previewInEditor: true,
    maxWidth: responsive("560px"),
    padding: responsive(sides("40px", "32px"), undefined, sides("32px", "20px")),
    gap: responsive("16px"),
    contentAlign: responsive("stretch"),
    background: defaultBackground({ type: "color", color: "#ffffff" }),
    border: defaultBorder({ radius: responsive(corners("16px")) }),
    shadow: defaultShadow({
      enabled: true,
      y: 24,
      blur: 64,
      color: "#0000003d",
    }),
    backdropColor: "#0a0a0fb3",
    backdropBlur: 2,
    closeColor: "#71717a",
    closeSize: "22px",
    autoOpen: "none",
    delay: 5,
    oncePerSession: true,
    showTrigger: false,
    triggerText: "Abrir",
    triggerIcon: "",
    triggerAlign: responsive("flex-start"),
    trigger: defaultButtonStyle(),
    box: defaultBox(),
  },
  rules: {
    canMoveIn: (incoming) =>
      incoming.every((n) => !TOP_LEVEL_TYPES.has(n.data.name) && n.data.name !== "Page" && n.data.name !== "Modal"),
  },
  runtime: ["modal"],
  View: ModalView,
  css: (id, p) => {
    const sheet = createSheet(id);
    // without its own button, the modal takes no space in the published layout
    const display = p.showTrigger ? "flex" : "contents";
    sheet.root().set("display", display).set("flex-direction", "column").set("align-items", p.triggerAlign);

    // a closed <dialog> must keep native display:none: no display here
    const panel = sheet.rule(" .pb-modal");
    panel
      .set("width", "calc(100% - 32px)")
      .set("max-width", p.maxWidth)
      .set("max-height", "calc(100dvh - 32px)")
      .set("overflow", "auto")
      .set("margin", "auto")
      .set("padding", "0")
      .set("border", "0")
      .set("color", "inherit")
      .set("box-shadow", shadowToCss(p.shadow));
    applyBackground(panel, p.background);
    applyBorder(panel, p.border);
    sheet.rule(" .pb-modal-inline").set("position", "relative").set("width", "100%").set("max-height", "none");
    sheet
      .rule(" .pb-modal::backdrop")
      .set("background", p.backdropColor)
      .set("backdrop-filter", p.backdropBlur > 0 ? `blur(${p.backdropBlur}px)` : undefined);
    sheet.rule(" .pb-modal[open]").set("animation", "pb-modal-in .22s ease-out");
    sheet
      .rule(" .pb-modal-content")
      .set("display", "flex")
      .set("flex-direction", "column")
      .set("align-items", p.contentAlign)
      .set("gap", p.gap)
      .set("padding", p.padding, sidesToCss);
    sheet.rule(" .pb-modal-content > *").set("min-width", "0");
    sheet
      .rule(" .pb-modal-close")
      .set("position", "absolute")
      .set("top", "10px")
      .set("right", "10px")
      .set("z-index", "1")
      .set("display", "flex")
      .set("align-items", "center")
      .set("justify-content", "center")
      .set("padding", "6px")
      .set("border", "0")
      .set("border-radius", "999px")
      .set("background", "transparent")
      .set("cursor", "pointer")
      .set("color", p.closeColor)
      .set("font-size", p.closeSize)
      .set("line-height", "1");
    sheet.rule(" .pb-modal-close:hover").set("background", "#0000000f");
    sheet.rule(" .pb-modal-trigger").set("max-width", "100%");
    applyBox(sheet, { ...p.box, width: undefined }, display);
    return (
      sheet.toString() +
      buttonStyleCss(id, ".pb-modal-trigger", p.trigger) +
      "@keyframes pb-modal-in{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}" +
      "@media (prefers-reduced-motion:reduce){.pb-modal[open]{animation:none}}"
    );
  },
  Settings: ModalSettings,
  fonts: (p) => (p.showTrigger ? [p.trigger.typography.fontFamily] : []),
};
