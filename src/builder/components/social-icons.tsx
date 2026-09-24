import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  Share2,
} from "lucide-react";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import { BoxFields } from "../controls/groups.tsx";
import { NumberUnitField, SegmentedField, SelectField, SwitchField, TextField } from "../controls/inputs.tsx";
import { ListField, newItemId } from "../controls/list.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { normalizeUrl } from "../core/actions.ts";
import { defaultBox } from "../core/defaults.ts";
import { ICONS, IconView } from "../core/icons.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { type Responsive, responsive } from "../core/responsive.ts";
import { applyBox, createSheet } from "../core/style-engine.ts";
import type { Box, Length } from "../core/style-types.ts";
import { C } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

/** Offered networks and contacts, with each one's official color. */
export const SOCIAL_NETWORKS: Record<string, { color: string }> = {
  instagram: { color: "#E4405F" },
  facebook: { color: "#1877F2" },
  youtube: { color: "#FF0000" },
  linkedin: { color: "#0A66C2" },
  twitter: { color: "#000000" },
  whatsapp: { color: "#25D366" },
  mail: { color: C.primary },
  phone: { color: C.primary },
  "map-pin": { color: C.primary },
};

export type SocialItem = { id: string; network: string; url: string };

export type SocialIconsProps = {
  items: SocialItem[];
  shape: "none" | "circle" | "rounded" | "square";
  /** Button size (with shape) or clickable area (no shape). */
  size: Responsive<Length>;
  iconSize: Responsive<Length>;
  gap: Responsive<Length>;
  align: Responsive<"flex-start" | "center" | "flex-end">;
  colorMode: "official" | "custom";
  iconColor: string;
  background: string;
  hoverIconColor: string;
  hoverBackground: string;
  hoverEffect: "none" | "lift" | "scale" | "opacity";
  newTab: boolean;
  box: Box;
};

/** Link for each network: email, phone, and WhatsApp accept just the contact. */
export function socialHref(network: string, url: string): string {
  const v = url.trim();
  if (!v) return "#";
  if (network === "mail" && !/^mailto:/i.test(v)) return `mailto:${v}`;
  if (network === "phone" && !/^tel:/i.test(v)) return `tel:${v.replace(/[^\d+]/g, "")}`;
  if (network === "whatsapp" && /^[\d\s()+-]+$/.test(v)) return `https://wa.me/${v.replace(/\D/g, "")}`;
  return normalizeUrl(v);
}

function SocialIconsView({ id, props, rootRef }: NodeViewProps<SocialIconsProps>) {
  return (
    <div
      ref={rootRef as React.Ref<HTMLDivElement>}
      className={nodeClassName(id, "pb-social", props.box)}
      data-pb-node={id}
    >
      {props.items.map((item) => {
        const href = socialHref(item.network, item.url);
        const external = props.newTab && /^https?:/i.test(href) ? true : undefined;
        return (
          <a
            key={item.id}
            className={`pb-social-link pb-social-${item.network}`}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            aria-label={ICONS[item.network]?.label ?? item.network}
          >
            <IconView name={item.network} />
          </a>
        );
      })}
    </div>
  );
}

function SocialIconsSettings() {
  const mode = useField<SocialIconsProps["colorMode"]>("colorMode");
  const shape = useField<SocialIconsProps["shape"]>("shape");
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Redes">
            <ListField<SocialItem>
              path="items"
              label="Ícones"
              addLabel="Adicionar rede"
              max={12}
              create={() => ({
                id: newItemId(),
                network: "instagram",
                url: "",
              })}
              itemLabel={(item) => ICONS[item.network]?.label ?? item.network}
              renderItem={(itemPath) => (
                <>
                  <SelectField
                    path={`${itemPath}.network`}
                    label="Rede"
                    options={Object.keys(SOCIAL_NETWORKS).map((n) => ({
                      value: n,
                      label: ICONS[n]?.label ?? n,
                    }))}
                  />
                  <TextField
                    path={`${itemPath}.url`}
                    label="Link"
                    hint="E-mail, telefone e WhatsApp: basta o endereço ou o número."
                  />
                </>
              )}
            />
          </Group>
          <Group title="Links">
            <SwitchField path="newTab" label="Abrir em nova aba" />
          </Group>
        </>
      }
      style={
        <>
          <Group title="Layout">
            <SegmentedField
              path="shape"
              label="Forma"
              options={[
                { value: "none", label: "Sem" },
                { value: "circle", label: "Círculo" },
                { value: "rounded", label: "Arred." },
                { value: "square", label: "Quadrado" },
              ]}
            />
            <NumberUnitField path="size" label="Tamanho do botão" units={["px"]} max={96} />
            <NumberUnitField path="iconSize" label="Tamanho do ícone" units={["px"]} max={64} />
            <NumberUnitField path="gap" label="Espaço entre ícones" units={["px"]} max={60} />
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
                <ColorField path="iconColor" label="Ícone" />
                {shape.value !== "none" ? <ColorField path="background" label="Fundo" allowEmpty /> : null}
                <ColorField path="hoverIconColor" label="Ícone no hover" allowEmpty />
                {shape.value !== "none" ? (
                  <ColorField path="hoverBackground" label="Fundo no hover" allowEmpty />
                ) : null}
              </>
            ) : null}
            <SelectField
              path="hoverEffect"
              label="Efeito no hover"
              options={[
                { value: "none", label: "Nenhum" },
                { value: "lift", label: "Subir" },
                { value: "scale", label: "Aumentar" },
                { value: "opacity", label: "Transparência" },
              ]}
            />
          </Group>
        </>
      }
      advanced={<BoxFields withSize={false} />}
    />
  );
}

const RADIUS: Record<SocialIconsProps["shape"], string | undefined> = {
  none: undefined,
  circle: "999px",
  rounded: "25%",
  square: "0",
};

const HOVER: Record<SocialIconsProps["hoverEffect"], [string, string]> = {
  none: ["", ""],
  lift: ["transform", "translateY(-2px)"],
  scale: ["transform", "scale(1.12)"],
  opacity: ["opacity", ".75"],
};

export const SocialIcons: ComponentDefinition<SocialIconsProps> = {
  type: "SocialIcons",
  displayName: "Ícones sociais",
  category: "basic",
  icon: Share2,
  inToolbox: true,
  defaults: {
    items: [
      { id: "social-instagram", network: "instagram", url: "" },
      { id: "social-facebook", network: "facebook", url: "" },
      { id: "social-youtube", network: "youtube", url: "" },
      { id: "social-whatsapp", network: "whatsapp", url: "" },
    ],
    shape: "circle",
    size: responsive("40px"),
    iconSize: responsive("18px"),
    gap: responsive("10px"),
    align: responsive("flex-start"),
    colorMode: "custom",
    iconColor: C.text,
    background: C.surface,
    hoverIconColor: C.primary,
    hoverBackground: "",
    hoverEffect: "lift",
    newTab: true,
    box: defaultBox(),
  },
  View: SocialIconsView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const filled = p.shape !== "none";
    sheet
      .root()
      .set("display", "flex")
      .set("flex-wrap", "wrap")
      .set("align-items", "center")
      .set("justify-content", p.align)
      .set("gap", p.gap);
    applyBox(sheet, p.box, "flex");

    const link = sheet.rule(" .pb-social-link");
    link
      .set("display", "inline-flex")
      .set("align-items", "center")
      .set("justify-content", "center")
      .set("flex-shrink", "0")
      .set("width", filled ? p.size : undefined)
      .set("height", filled ? p.size : undefined)
      .set("border-radius", RADIUS[p.shape])
      .set("transition", "color .2s ease,background-color .2s ease,transform .2s ease,opacity .2s ease");
    sheet.rule(" .pb-social-link svg").set("width", p.iconSize).set("height", p.iconSize);

    const hover = sheet.rule(" .pb-social-link:hover");
    const [prop, value] = HOVER[p.hoverEffect];
    if (prop) hover.set(prop, value);

    if (p.colorMode === "custom") {
      link.set("color", p.iconColor).set("background-color", filled ? p.background : undefined);
      hover
        .set("color", p.hoverIconColor || undefined)
        .set("background-color", filled ? p.hoverBackground || undefined : undefined);
    } else {
      // official: icon in the brand color, or white icon on the brand color
      const networks = new Set(p.items.map((i) => i.network));
      for (const n of networks) {
        const color = SOCIAL_NETWORKS[n]?.color ?? C.primary;
        const rule = sheet.rule(` .pb-social-${n}`);
        if (filled) rule.set("background-color", color).set("color", "#ffffff");
        else rule.set("color", color);
      }
    }
    return sheet.toString();
  },
  Settings: SocialIconsSettings,
};
