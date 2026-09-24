import { ImageIcon } from "lucide-react";
import { ActionField } from "../controls/action.tsx";
import { Group } from "../controls/field.tsx";
import { BorderFields, BoxFields, HoverFields, MediaPathField, ShadowFields } from "../controls/groups.tsx";
import { NumberUnitField, SegmentedField, TextField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { actionLink } from "../core/actions.ts";
import { defaultBorder, defaultBox, defaultHover, defaultShadow } from "../core/defaults.ts";
import { nodeClassName } from "../core/node-helpers.ts";
import { useRender } from "../core/render-context.tsx";
import { DEVICE_MEDIA, type Responsive, responsive } from "../core/responsive.ts";
import { applyBorder, applyBox, applyHover, createSheet, shadowToCss } from "../core/style-engine.ts";
import type { Action, Border, Box, Hover, Length, Shadow } from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="#e4e4e7"/><path d="M330 300l60-80 50 60 30-35 70 55H330z" fill="#a1a1aa"/><circle cx="360" cy="200" r="22" fill="#a1a1aa"/></svg>',
  );

export type ImageProps = {
  /** Imagem por dispositivo: mobile/tablet podem usar outra imagem. */
  src: Responsive<string>;
  alt: string;
  height: Responsive<Length>;
  fit: Responsive<"cover" | "contain">;
  action: Action;
  border: Border;
  shadow: Shadow;
  hover: Hover;
  box: Box;
};

function ImageView({ id, props, rootRef }: NodeViewProps<ImageProps>) {
  const ctx = useRender();
  const link = actionLink(props.action, ctx);
  const desktop = props.src.desktop || PLACEHOLDER_IMAGE;
  const picture = (
    <picture>
      {props.src.mobile ? <source media={DEVICE_MEDIA.mobile ?? undefined} srcSet={props.src.mobile} /> : null}
      {props.src.tablet ? <source media={DEVICE_MEDIA.tablet ?? undefined} srcSet={props.src.tablet} /> : null}
      <img src={desktop} alt={props.alt} loading={ctx.mode === "publish" ? "lazy" : undefined} decoding="async" />
    </picture>
  );
  const className = nodeClassName(id, "pb-image", props.box);
  if (link) {
    return (
      <a ref={rootRef as React.Ref<HTMLAnchorElement>} className={className} data-pb-node={id} {...link}>
        {picture}
      </a>
    );
  }
  return (
    <div ref={rootRef as React.Ref<HTMLDivElement>} className={className} data-pb-node={id}>
      {picture}
    </div>
  );
}

function ImageSettings() {
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Imagem">
            <MediaPathField
              path="src"
              label="Arquivo"
              accept="image"
              hint="No tablet e no celular você pode escolher outra imagem."
            />
            <TextField path="alt" label="Texto alternativo (SEO)" />
          </Group>
          <Group title="Link" defaultOpen={false}>
            <ActionField path="action" />
          </Group>
        </>
      }
      style={
        <>
          <Group title="Dimensões">
            <NumberUnitField path="height" label="Altura" units={["px", "vh"]} keywords={["auto"]} max={1000} />
            <SegmentedField
              path="fit"
              label="Encaixe"
              options={[
                { value: "cover", label: "Cobrir" },
                { value: "contain", label: "Conter" },
              ]}
            />
          </Group>
          <Group title="Borda" defaultOpen={false}>
            <BorderFields base="border" />
          </Group>
          <Group title="Sombra" defaultOpen={false}>
            <ShadowFields base="shadow" />
          </Group>
          <Group title="Hover" defaultOpen={false}>
            <HoverFields base="hover" withBackground={false} withColor={false} />
          </Group>
        </>
      }
      advanced={<BoxFields />}
    />
  );
}

export const Image: ComponentDefinition<ImageProps> = {
  type: "Image",
  displayName: "Imagem",
  category: "media",
  icon: ImageIcon,
  inToolbox: true,
  defaults: {
    src: responsive(""),
    alt: "",
    height: responsive("auto"),
    fit: responsive("cover"),
    action: { type: "none" },
    border: defaultBorder(),
    shadow: defaultShadow(),
    hover: defaultHover(),
    box: defaultBox({ width: responsive("100%") }),
  },
  View: ImageView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const root = sheet.root();
    root.set("display", "block").set("overflow", "hidden").set("box-shadow", shadowToCss(p.shadow));
    applyBorder(root, p.border);
    applyHover(sheet, p.hover, { background: false });
    applyBox(sheet, p.box);
    sheet.rule(" img").set("width", "100%").set("height", p.height).set("object-fit", p.fit);
    return sheet.toString();
  },
  Settings: ImageSettings,
};
