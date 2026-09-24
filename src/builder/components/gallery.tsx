import { GalleryHorizontalEnd } from "lucide-react";
import { ActionField } from "../controls/action.tsx";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import { BoxFields, MediaPathField, NumberField, TypographyFields } from "../controls/groups.tsx";
import { NumberUnitField, SegmentedField, SelectField, SwitchField, TextField } from "../controls/inputs.tsx";
import { ListField, newItemId } from "../controls/list.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { actionLink } from "../core/actions.ts";
import { defaultBox, defaultTypography } from "../core/defaults.ts";
import { nodeClassName } from "../core/node-helpers.ts";
import { useRender } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import { applyBox, applyTypography, createSheet } from "../core/style-engine.ts";
import type { Action, Box, Length, Typography } from "../core/style-types.ts";
import { C, FONT_BODY } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import { PLACEHOLDER_IMAGE } from "./image.tsx";

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  /** Com link, o clique segue o link em vez de abrir a imagem ampliada. */
  link: Action;
};

type HoverEffect = "none" | "zoom" | "overlay" | "zoom-overlay";

export type GalleryProps = {
  images: GalleryItem[];
  /** grid: linhas alinhadas; masonry: colunas com alturas livres. */
  layout: "grid" | "masonry";
  columns: Responsive<number>;
  gap: Responsive<Length>;
  /** Proporção no layout grade ("original" = altura livre). */
  ratio: "1/1" | "4/3" | "3/2" | "16/9" | "3/4" | "original";
  fit: "cover" | "contain";
  radius: Length;
  hoverEffect: HoverEffect;
  overlayColor: string;
  captions: "below" | "overlay" | "none";
  captionTypography: Typography;
  /** Abre a imagem ampliada ao clicar (na página publicada). */
  lightbox: boolean;
  box: Box;
};

const sample = (n: number): GalleryItem[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `g${i + 1}`,
    src: "",
    alt: "",
    caption: `Legenda da imagem ${i + 1}`,
    link: { type: "none" },
  }));

function GalleryView({ id, props, rootRef }: NodeViewProps<GalleryProps>) {
  const ctx = useRender();
  const lazy = ctx.mode === "publish" ? "lazy" : undefined;
  return (
    <div
      ref={rootRef as React.Ref<HTMLDivElement>}
      className={nodeClassName(id, `pb-gallery pb-gallery-${props.layout}`, props.box)}
      data-pb-node={id}
      data-pb-gallery={props.lightbox ? "" : undefined}
    >
      {props.images.map((item) => {
        const src = item.src || PLACEHOLDER_IMAGE;
        const link = actionLink(item.link, ctx);
        const caption = item.caption && props.captions !== "none";
        const img = <img src={src} alt={item.alt} loading={lazy} decoding="async" />;
        const overlayCaption =
          caption && props.captions === "overlay" ? (
            <span className="pb-gallery-overlay-cap">{item.caption}</span>
          ) : null;
        let media: React.ReactNode;
        if (link) {
          media = (
            <a className="pb-gallery-media" {...link}>
              {img}
              {overlayCaption}
            </a>
          );
        } else if (props.lightbox) {
          // o href para a imagem funciona mesmo sem JavaScript
          media = (
            <a
              className="pb-gallery-media"
              href={src}
              data-pb-lightbox=""
              data-pb-caption={item.caption || undefined}
              aria-label={item.alt || item.caption || "Ampliar imagem"}
            >
              {img}
              {overlayCaption}
            </a>
          );
        } else {
          media = (
            <span className="pb-gallery-media">
              {img}
              {overlayCaption}
            </span>
          );
        }
        return (
          <figure key={item.id} className="pb-gallery-item">
            {media}
            {caption && props.captions === "below" ? (
              <figcaption className="pb-gallery-cap">{item.caption}</figcaption>
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}

function GallerySettings() {
  const layout = useField<GalleryProps["layout"]>("layout");
  const captions = useField<GalleryProps["captions"]>("captions");
  const hover = useField<HoverEffect>("hoverEffect");
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Imagens">
            <ListField<GalleryItem>
              path="images"
              label="Imagens da galeria"
              addLabel="Adicionar imagem"
              max={60}
              create={() => ({
                id: newItemId(),
                src: "",
                alt: "",
                caption: "",
                link: { type: "none" },
              })}
              itemLabel={(item, i) => item.caption || item.alt || `Imagem ${i + 1}`}
              renderItem={(itemPath) => (
                <>
                  <MediaPathField path={`${itemPath}.src`} label="Arquivo" accept="image" />
                  <TextField path={`${itemPath}.alt`} label="Texto alternativo (SEO)" />
                  <TextField path={`${itemPath}.caption`} label="Legenda" />
                  <ActionField path={`${itemPath}.link`} label="Link (opcional)" />
                </>
              )}
            />
          </Group>
          <Group title="Ao clicar">
            <SwitchField
              path="lightbox"
              label="Ampliar imagem (lightbox)"
              hint="Funciona na página publicada. Imagens com link seguem o link."
            />
          </Group>
        </>
      }
      style={
        <>
          <Group title="Layout">
            <SegmentedField
              path="layout"
              label="Disposição"
              options={[
                { value: "grid", label: "Grade" },
                { value: "masonry", label: "Mosaico" },
              ]}
            />
            <NumberField path="columns" label="Colunas" min={1} max={8} />
            <NumberUnitField path="gap" label="Espaçamento" units={["px", "em"]} max={60} />
            {layout.value === "grid" ? (
              <SelectField
                path="ratio"
                label="Proporção"
                options={[
                  { value: "1/1", label: "1:1 (quadrada)" },
                  { value: "4/3", label: "4:3" },
                  { value: "3/2", label: "3:2" },
                  { value: "16/9", label: "16:9" },
                  { value: "3/4", label: "3:4 (retrato)" },
                  { value: "original", label: "Original" },
                ]}
              />
            ) : null}
            <SegmentedField
              path="fit"
              label="Encaixe"
              options={[
                { value: "cover", label: "Cobrir" },
                { value: "contain", label: "Conter" },
              ]}
            />
            <NumberUnitField path="radius" label="Arredondamento" units={["px", "%"]} max={60} />
          </Group>
          <Group title="Hover">
            <SelectField
              path="hoverEffect"
              label="Efeito"
              options={[
                { value: "none", label: "Nenhum" },
                { value: "zoom", label: "Zoom" },
                { value: "overlay", label: "Escurecer" },
                { value: "zoom-overlay", label: "Zoom + escurecer" },
              ]}
            />
            {hover.value === "overlay" || hover.value === "zoom-overlay" ? (
              <ColorField path="overlayColor" label="Cor da sobreposição" />
            ) : null}
          </Group>
          <Group title="Legendas">
            <SegmentedField
              path="captions"
              label="Exibir"
              options={[
                { value: "below", label: "Abaixo" },
                { value: "overlay", label: "Sobre" },
                { value: "none", label: "Ocultar" },
              ]}
            />
            {captions.value !== "none" ? <TypographyFields base="captionTypography" /> : null}
          </Group>
        </>
      }
      advanced={<BoxFields />}
    />
  );
}

export const Gallery: ComponentDefinition<GalleryProps> = {
  type: "Gallery",
  displayName: "Galeria",
  category: "media",
  icon: GalleryHorizontalEnd,
  inToolbox: true,
  defaults: {
    images: sample(6),
    layout: "grid",
    columns: responsive(3, undefined, 2),
    gap: responsive("12px", undefined, "8px"),
    ratio: "4/3",
    fit: "cover",
    radius: "10px",
    hoverEffect: "zoom",
    overlayColor: "#000000",
    captions: "none",
    captionTypography: defaultTypography({
      fontFamily: FONT_BODY,
      fontSize: responsive("14px"),
      lineHeight: responsive("1.4"),
      color: C.textMuted,
    }),
    lightbox: true,
    box: defaultBox({ width: responsive("100%") }),
  },
  View: GalleryView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const root = sheet.root();
    const grid = p.layout === "grid";
    const overlayHover = p.hoverEffect === "overlay" || p.hoverEffect === "zoom-overlay";
    const zoom = p.hoverEffect === "zoom" || p.hoverEffect === "zoom-overlay";

    if (grid) {
      root
        .set("display", "grid")
        .set("grid-template-columns", p.columns, (n) => `repeat(${Math.max(1, n)}, minmax(0, 1fr))`)
        .set("gap", p.gap);
    } else {
      root
        .set("display", "block")
        .set("columns", p.columns, (n) => String(Math.max(1, n)))
        .set("column-gap", p.gap);
    }

    const item = sheet.rule(" .pb-gallery-item");
    item
      .set("margin", "0")
      .set("display", "flex")
      .set("flex-direction", "column")
      .set("gap", "8px")
      .set("min-width", "0");
    // mosaico: o espaço vertical vem da margem (colunas CSS não têm gap)
    if (!grid) item.set("break-inside", "avoid").set("margin-bottom", p.gap);

    const media = sheet.rule(" .pb-gallery-media");
    media
      .set("position", "relative")
      .set("display", "block")
      .set("overflow", "hidden")
      .set("border-radius", p.radius)
      .set("background-color", C.surface)
      .set("aspect-ratio", grid && p.ratio !== "original" ? p.ratio : undefined);
    sheet.rule(" a.pb-gallery-media").set("cursor", "zoom-in");
    sheet.rule(" a.pb-gallery-media:not([data-pb-lightbox])").set("cursor", "pointer");
    sheet
      .rule(" .pb-gallery-media img")
      .set("width", "100%")
      .set("height", grid && p.ratio !== "original" ? "100%" : "auto")
      .set("object-fit", p.fit)
      .set("transition", "transform .5s ease");
    if (zoom) sheet.rule(" .pb-gallery-media:hover img").set("transform", "scale(1.06)");

    // escurecer no hover
    const overlay = sheet.rule(" .pb-gallery-media::after");
    overlay
      .set("content", '""')
      .set("position", "absolute")
      .set("inset", "0")
      .set("pointer-events", "none")
      .set("transition", "opacity .3s ease")
      .set("opacity", "0")
      .set("background", `color-mix(in srgb, ${p.overlayColor} 40%, transparent)`);
    if (overlayHover) sheet.rule(" .pb-gallery-media:hover::after").set("opacity", "1");
    else overlay.set("display", "none");

    // legenda sobre a imagem
    const cap = sheet.rule(" .pb-gallery-overlay-cap");
    applyTypography(cap, { ...p.captionTypography, color: "#ffffff" });
    cap
      .set("position", "absolute")
      .set("left", "0")
      .set("right", "0")
      .set("bottom", "0")
      .set("z-index", "1")
      .set("padding", "28px 14px 12px")
      .set("background", `linear-gradient(to top, color-mix(in srgb, ${p.overlayColor} 70%, transparent), transparent)`)
      .set("transition", "opacity .3s ease,transform .3s ease");
    if (overlayHover) {
      // com escurecer, a legenda aparece junto no hover
      cap.set("opacity", "0").set("transform", "translateY(6px)");
      sheet.rule(" .pb-gallery-media:hover .pb-gallery-overlay-cap").set("opacity", "1").set("transform", "none");
    }

    applyTypography(sheet.rule(" .pb-gallery-cap"), p.captionTypography);

    applyBox(sheet, p.box, grid ? "grid" : "block");
    let css = sheet.toString();
    // em telas de toque não há hover: legenda sobre a imagem sempre visível
    if (overlayHover && p.captions === "overlay") {
      css += `@media (hover:none){${sheet.selector} .pb-gallery-overlay-cap{opacity:1;transform:none}}`;
    }
    return css;
  },
  Settings: GallerySettings,
  runtime: ["gallery"],
  fonts: (p) => [p.captionTypography.fontFamily],
};
