/**
 * Botões de compartilhar: WhatsApp, Facebook, LinkedIn, X, Telegram, e-mail,
 * copiar link e o compartilhamento nativo do celular. O link compartilhado é
 * o da própria página (lido no navegador) ou um link fixo; o runtime "share"
 * monta os endereços e cuida do copiar/compartilhar.
 */
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  Share,
} from "lucide-react";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import { BoxFields, TypographyFields } from "../controls/groups.tsx";
import { NumberUnitField, SegmentedField, SelectField, TextField } from "../controls/inputs.tsx";
import { ListField, newItemId } from "../controls/list.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { defaultBox, defaultTypography } from "../core/defaults.ts";
import { IconView } from "../core/icons.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import { applyBox, applyTypography, createSheet } from "../core/style-engine.ts";
import type { Box, Length, Typography } from "../core/style-types.ts";
import { C, FONT_BODY } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type ShareNetwork = "whatsapp" | "facebook" | "linkedin" | "x" | "telegram" | "email" | "copy" | "native";

/** Nome, ícone e cor oficial de cada opção. */
export const SHARE_NETWORKS: Record<ShareNetwork, { label: string; icon: string; color: string }> = {
  whatsapp: { label: "WhatsApp", icon: "whatsapp", color: "#25D366" },
  facebook: { label: "Facebook", icon: "facebook", color: "#1877F2" },
  linkedin: { label: "LinkedIn", icon: "linkedin", color: "#0A66C2" },
  x: { label: "X", icon: "twitter", color: "#000000" },
  telegram: { label: "Telegram", icon: "send", color: "#229ED9" },
  email: { label: "E-mail", icon: "mail", color: "#52525b" },
  copy: { label: "Copiar link", icon: "link", color: "#52525b" },
  native: { label: "Compartilhar", icon: "share-2", color: "#52525b" },
};

export type ShareItem = { id: string; network: ShareNetwork };

export type ShareButtonsProps = {
  items: ShareItem[];
  /** "page": link da página aberta; "custom": link fixo. */
  urlMode: "page" | "custom";
  url: string;
  /** Texto que acompanha o link. Vazio: título da página. */
  text: string;
  /** Texto antes dos botões ("Compartilhe:"). */
  label: string;
  layout: "icons" | "buttons";
  shape: "circle" | "rounded" | "square";
  size: Responsive<Length>;
  iconSize: Responsive<Length>;
  gap: Responsive<Length>;
  align: Responsive<"flex-start" | "center" | "flex-end">;
  colorMode: "official" | "custom";
  iconColor: string;
  background: string;
  copiedText: string;
  labelTypography: Typography;
  box: Box;
};

function ShareButtonsView({ id, props, rootRef }: NodeViewProps<ShareButtonsProps>) {
  const isEditor = useIsEditor();
  const withText = props.layout === "buttons";
  return (
    <div
      ref={rootRef as React.Ref<HTMLDivElement>}
      className={nodeClassName(id, "pb-share", props.box)}
      data-pb-node={id}
      data-pb-share=""
      data-pb-share-url={props.urlMode === "custom" && props.url.trim() ? props.url.trim() : undefined}
      data-pb-share-text={props.text.trim() || undefined}
    >
      {props.label ? <span className="pb-share-label">{props.label}</span> : null}
      <div className="pb-share-list">
        {props.items.map((item) => {
          const net = SHARE_NETWORKS[item.network] ?? SHARE_NETWORKS.copy;
          const content = (
            <>
              <IconView name={net.icon} />
              {withText ? <span className="pb-share-text">{net.label}</span> : null}
            </>
          );
          const common = {
            className: `pb-share-btn pb-share-${item.network}`,
            "data-pb-share-net": item.network,
            "aria-label": withText ? undefined : net.label,
            title: withText ? undefined : net.label,
          };
          // copiar e nativo são botões; as redes são links (href no runtime)
          return item.network === "copy" || item.network === "native" ? (
            <button
              key={item.id}
              type="button"
              {...common}
              // o nativo só aparece se o navegador suportar
              hidden={item.network === "native" && !isEditor ? true : undefined}
              data-pb-copied={item.network === "copy" ? props.copiedText : undefined}
              tabIndex={isEditor ? -1 : undefined}
            >
              {content}
            </button>
          ) : (
            // biome-ignore lint/a11y/useValidAnchor: o href real (com o link da página aberta) é montado no navegador pelo runtime
            <a
              key={item.id}
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              {...common}
              tabIndex={isEditor ? -1 : undefined}
              onClick={isEditor ? (e) => e.preventDefault() : undefined}
            >
              {content}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ShareButtonsSettings() {
  const urlMode = useField<ShareButtonsProps["urlMode"]>("urlMode");
  const mode = useField<ShareButtonsProps["colorMode"]>("colorMode");
  const layout = useField<ShareButtonsProps["layout"]>("layout");
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Botões">
            <ListField<ShareItem>
              path="items"
              label="Opções"
              addLabel="Adicionar opção"
              min={1}
              max={8}
              create={() => ({ id: newItemId(), network: "whatsapp" })}
              itemLabel={(item) => SHARE_NETWORKS[item.network]?.label ?? item.network}
              renderItem={(itemPath) => (
                <SelectField
                  path={`${itemPath}.network`}
                  label="Rede"
                  options={(Object.keys(SHARE_NETWORKS) as ShareNetwork[]).map((n) => ({
                    value: n,
                    label: SHARE_NETWORKS[n].label,
                  }))}
                />
              )}
            />
            <TextField path="label" label="Texto antes dos botões" placeholder="ex.: Compartilhe:" />
          </Group>
          <Group title="O que compartilhar">
            <SegmentedField
              path="urlMode"
              label="Link"
              options={[
                { value: "page", label: "Esta página" },
                { value: "custom", label: "Outro link" },
              ]}
            />
            {urlMode.value === "custom" ? <TextField path="url" label="Endereço" placeholder="https://" /> : null}
            <TextField
              path="text"
              label="Mensagem"
              placeholder="Vazio: título da página"
              hint="Vai junto com o link no WhatsApp, X, Telegram e e-mail."
            />
            <TextField path="copiedText" label="Aviso ao copiar o link" />
          </Group>
        </>
      }
      style={
        <>
          <Group title="Layout">
            <SegmentedField
              path="layout"
              label="Exibir"
              options={[
                { value: "icons", label: "Só ícones" },
                { value: "buttons", label: "Ícone e nome" },
              ]}
            />
            <SegmentedField
              path="shape"
              label="Forma"
              options={[
                { value: "circle", label: "Redondo" },
                { value: "rounded", label: "Arred." },
                { value: "square", label: "Quadrado" },
              ]}
            />
            <NumberUnitField
              path="size"
              label={layout.value === "buttons" ? "Altura" : "Tamanho"}
              units={["px"]}
              min={24}
              max={80}
            />
            <NumberUnitField path="iconSize" label="Tamanho do ícone" units={["px"]} max={48} />
            <NumberUnitField path="gap" label="Espaço entre botões" units={["px"]} max={40} />
            <SegmentedField
              path="align"
              label="Alinhamento"
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
              ]}
            />
          </Group>
          <Group title="Cores">
            <SegmentedField
              path="colorMode"
              label="Cores"
              options={[
                { value: "official", label: "Oficiais" },
                { value: "custom", label: "Personalizadas" },
              ]}
            />
            {mode.value === "custom" ? (
              <>
                <ColorField path="iconColor" label="Ícone e texto" />
                <ColorField path="background" label="Fundo" allowEmpty />
              </>
            ) : null}
          </Group>
          <Group title="Texto antes dos botões" defaultOpen={false}>
            <TypographyFields base="labelTypography" withAlign={false} />
          </Group>
        </>
      }
      advanced={<BoxFields withSize={false} />}
    />
  );
}

const RADIUS: Record<ShareButtonsProps["shape"], string> = {
  circle: "999px",
  rounded: "10px",
  square: "0",
};

export const ShareButtons: ComponentDefinition<ShareButtonsProps> = {
  type: "ShareButtons",
  displayName: "Compartilhar",
  category: "basic",
  icon: Share,
  inToolbox: true,
  runtime: ["share"],
  defaults: {
    items: [
      { id: "share-whatsapp", network: "whatsapp" },
      { id: "share-facebook", network: "facebook" },
      { id: "share-linkedin", network: "linkedin" },
      { id: "share-x", network: "x" },
      { id: "share-copy", network: "copy" },
    ],
    urlMode: "page",
    url: "",
    text: "",
    label: "Compartilhe:",
    layout: "icons",
    shape: "circle",
    size: responsive("40px"),
    iconSize: responsive("18px"),
    gap: responsive("8px"),
    align: responsive("flex-start"),
    colorMode: "official",
    iconColor: C.text,
    background: C.surface,
    copiedText: "Link copiado!",
    labelTypography: defaultTypography({
      fontFamily: FONT_BODY,
      fontSize: responsive("14px"),
      fontWeight: "600",
      color: C.text,
    }),
    box: defaultBox(),
  },
  View: ShareButtonsView,
  css: (id, p) => {
    const sheet = createSheet(id);
    sheet
      .root()
      .set("display", "flex")
      .set("flex-wrap", "wrap")
      .set("align-items", "center")
      .set("justify-content", p.align)
      .set("gap", "8px 12px");
    applyTypography(sheet.rule(" .pb-share-label"), p.labelTypography);
    sheet.rule(" .pb-share-list").set("display", "flex").set("flex-wrap", "wrap").set("gap", p.gap);

    const buttons = p.layout === "buttons";
    const btn = sheet.rule(" .pb-share-btn");
    btn
      .set("position", "relative")
      .set("display", "inline-flex")
      .set("align-items", "center")
      .set("justify-content", "center")
      .set("gap", "8px")
      .set("height", p.size)
      .set("min-width", p.size)
      .set("padding", buttons ? "0 16px" : "0")
      .set("border", "0")
      .set("border-radius", RADIUS[p.shape])
      .set("font", "inherit")
      .set("font-size", "14px")
      .set("font-weight", "600")
      .set("text-decoration", "none")
      .set("cursor", "pointer")
      .set("transition", "transform .15s ease, opacity .15s ease");
    sheet.rule(" .pb-share-btn:hover").set("transform", "translateY(-2px)").set("opacity", ".92");
    sheet.rule(" .pb-share-btn svg").set("width", p.iconSize).set("height", p.iconSize).set("flex-shrink", "0");
    sheet.rule(" .pb-share-btn[hidden]").set("display", "none");

    if (p.colorMode === "custom") {
      btn.set("color", p.iconColor).set("background-color", p.background || "transparent");
    } else {
      // oficiais: fundo na cor da marca, ícone branco
      for (const n of new Set(p.items.map((i) => i.network))) {
        const color = SHARE_NETWORKS[n]?.color ?? "#52525b";
        sheet.rule(` .pb-share-${n}`).set("background-color", color).set("color", "#ffffff");
      }
    }

    // aviso "Link copiado!" num balão acima do botão
    sheet
      .rule(" .pb-share-btn[data-pb-copied-show]::after")
      .set("content", "attr(data-pb-copied)")
      .set("position", "absolute")
      .set("bottom", "calc(100% + 8px)")
      .set("left", "50%")
      .set("transform", "translateX(-50%)")
      .set("padding", "4px 10px")
      .set("border-radius", "6px")
      .set("background", "#18181b")
      .set("color", "#ffffff")
      .set("font-size", "12px")
      .set("font-weight", "500")
      .set("white-space", "nowrap")
      .set("pointer-events", "none");
    applyBox(sheet, p.box, "flex");
    return sheet.toString();
  },
  Settings: ShareButtonsSettings,
  fonts: (p) => [p.labelTypography.fontFamily],
};
