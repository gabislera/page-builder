/**
 * Carrossel composto: cada slide é um nó de verdade (CarouselSlide) com
 * conteúdo livre.
 *
 * A trilha usa scroll-snap do CSS (`overflow-x:auto` + `scroll-snap-type`),
 * então funciona sem JS (arrastar/rolar no celular). O runtime "carousel"
 * liga setas e pontos, autoplay, loop e o ponto ativo. No editor as setas e
 * os pontos rolam a trilha via React, sem autoplay.
 */
import { GalleryHorizontalEnd, RectangleHorizontal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChildItemsField } from "../controls/child-items.tsx";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import { BackgroundFields, BorderFields, BoxFields, NumberField, SidesField } from "../controls/groups.tsx";
import { NumberUnitField, SegmentedField, SwitchField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { h, type NodeSpec } from "../core/build.ts";
import { flattenChildren } from "../core/children.ts";
import { corners, defaultBackground, defaultBorder, defaultBox, sides } from "../core/defaults.ts";
import { mergeRefs } from "../core/inline-edit.tsx";
import { nodeClassName, TOP_LEVEL_TYPES } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import { applyBackground, applyBorder, applyBox, createSheet, sidesToCss } from "../core/style-engine.ts";
import type { Background, Border, Box, Length, Sides } from "../core/style-types.ts";
import { C } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import { RevealOnSelect } from "./shared/editor-reveal.tsx";

/* ------------------------------------------------------------------ */
/* Carrossel (pai)                                                     */
/* ------------------------------------------------------------------ */

export type CarouselProps = {
  slidesPerView: Responsive<number>;
  gap: Responsive<Length>;
  /** "auto" = altura do conteúdo (todos os slides ficam com a do maior). */
  slideHeight: Responsive<Length>;
  showArrows: Responsive<boolean>;
  arrowIcon: "chevron" | "arrow";
  arrowShape: "circle" | "square" | "none";
  arrowPosition: "inside" | "outside";
  arrowSize: Length;
  arrowColor: string;
  arrowBackground: string;
  showDots: Responsive<boolean>;
  dotColor: string;
  dotActiveColor: string;
  dotSize: Length;
  /** Segundos entre um slide e outro; 0 = desligado. */
  autoplay: number;
  /** Setas voltam ao início/fim. O autoplay sempre recomeça do início. */
  loop: boolean;
  pauseOnHover: boolean;
  box: Box;
};

const CAROUSEL_DEFAULTS: CarouselProps = {
  slidesPerView: responsive(1),
  gap: responsive("16px"),
  slideHeight: responsive("auto"),
  showArrows: responsive(true),
  arrowIcon: "chevron",
  arrowShape: "circle",
  arrowPosition: "inside",
  arrowSize: "44px",
  arrowColor: C.text,
  arrowBackground: C.background,
  showDots: responsive(true),
  dotColor: "color-mix(in srgb, var(--pb-c-text) 25%, transparent)",
  dotActiveColor: C.primary,
  dotSize: "8px",
  autoplay: 0,
  loop: true,
  pauseOnHover: true,
  box: defaultBox({ width: responsive("100%") }),
};

/** Slides visíveis (ignora <style> do editor e slides ocultos no dispositivo). */
function slideElements(track: HTMLElement): HTMLElement[] {
  return Array.from(track.children).filter(
    (el): el is HTMLElement => el.classList.contains("pb-car-slide") && el.getClientRects().length > 0,
  );
}

/** Posição de rolagem que alinha o slide ao início da trilha. */
function slideOffset(track: HTMLElement, slide: HTMLElement): number {
  return slide.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
}

type NavState = {
  current: number;
  last: number;
  atStart: boolean;
  atEnd: boolean;
};

function readNav(track: HTMLElement): NavState {
  const slides = slideElements(track);
  const max = track.scrollWidth - track.clientWidth;
  const x = track.scrollLeft;
  let current = 0;
  let best = Number.POSITIVE_INFINITY;
  let last = Math.max(slides.length - 1, 0);
  slides.forEach((slide, i) => {
    const offset = slideOffset(track, slide);
    const d = Math.abs(offset - x);
    if (d < best) {
      best = d;
      current = i;
    }
    // último slide que ainda consegue ficar no início da trilha
    if (offset >= max - 2 && i < last) last = i;
  });
  const atEnd = x >= max - 2;
  return { current: atEnd ? last : current, last, atStart: x <= 2, atEnd };
}

function ArrowIcon({ icon, dir }: { icon: CarouselProps["arrowIcon"]; dir: 1 | -1 }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {icon === "arrow" ? (
        <path d={dir > 0 ? "M5 12h14m-6-6 6 6-6 6" : "M19 12H5m6-6-6 6 6 6"} />
      ) : (
        <path d={dir > 0 ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
      )}
    </svg>
  );
}

function CarouselView({ id, props, children, rootRef }: NodeViewProps<CarouselProps>) {
  const isEditor = useIsEditor();
  const slides = flattenChildren(children);
  const count = slides.length;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [nav, setNav] = useState<NavState>({
    current: 0,
    last: Math.max(count - 1, 0),
    atStart: true,
    atEnd: count <= 1,
  });

  // editor: acompanha a rolagem da trilha (pontos e setas)
  // biome-ignore lint/correctness/useExhaustiveDependencies: recalcula quando muda o número de slides
  useEffect(() => {
    const track = trackRef.current;
    if (!isEditor || !track) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setNav(readNav(track)));
    };
    update();
    track.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(track);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [isEditor, count]);

  const go = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const list = slideElements(track);
    const slide = list[Math.max(0, Math.min(index, list.length - 1))];
    if (slide) track.scrollTo({ left: slideOffset(track, slide), behavior: "smooth" });
  }, []);

  const move = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const state = readNav(track);
    if (dir > 0 && state.atEnd) {
      if (props.loop) go(0);
      return;
    }
    if (dir < 0 && state.atStart) {
      if (props.loop) go(state.last);
      return;
    }
    go(state.current + dir);
  };

  const disablePrev = isEditor && !props.loop && nav.atStart;
  const disableNext = isEditor && !props.loop && nav.atEnd;

  return (
    <div
      ref={rootRef as React.Ref<HTMLDivElement>}
      className={nodeClassName(id, "pb-carousel", props.box)}
      data-pb-node={id}
      data-pb-carousel=""
      data-pb-autoplay={props.autoplay > 0 ? String(props.autoplay) : undefined}
      data-pb-loop={props.loop ? "1" : undefined}
      data-pb-pause={props.pauseOnHover ? "1" : undefined}
    >
      <div className="pb-car-viewport">
        <div className="pb-car-track" ref={trackRef}>
          {children}
          {isEditor && count === 0 ? <div className="pb-placeholder">Adicione slides no painel</div> : null}
        </div>
        <button
          type="button"
          className="pb-car-arrow pb-car-prev"
          aria-label="Slide anterior"
          disabled={disablePrev || undefined}
          onClick={isEditor ? () => move(-1) : undefined}
        >
          <ArrowIcon icon={props.arrowIcon} dir={-1} />
        </button>
        <button
          type="button"
          className="pb-car-arrow pb-car-next"
          aria-label="Próximo slide"
          disabled={disableNext || undefined}
          onClick={isEditor ? () => move(1) : undefined}
        >
          <ArrowIcon icon={props.arrowIcon} dir={1} />
        </button>
      </div>
      {count > 1 ? (
        <div className="pb-car-dots">
          {slides.map((_, i) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: um ponto por posição
              key={i}
              type="button"
              className={i === nav.current ? "pb-car-dot pb-car-dot-active" : "pb-car-dot"}
              aria-label={`Ir para o slide ${i + 1}`}
              aria-current={i === nav.current ? "true" : undefined}
              hidden={isEditor && i > nav.last ? true : undefined}
              onClick={isEditor ? () => go(i) : undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CarouselSettings() {
  const arrows = useField<boolean>("showArrows").value;
  const dots = useField<boolean>("showDots").value;
  const autoplay = useField<number>("autoplay").value;
  return (
    <SettingsTabs
      content={
        <>
          <Group title="Slides">
            <ChildItemsField
              label="Slides"
              childType="CarouselSlide"
              itemLabel={(_, i) => `Slide ${i + 1}`}
              addLabel="Adicionar slide"
              create={(i) => carouselSlideSpec(i)}
              min={1}
            />
          </Group>
          <Group title="Layout">
            <NumberField path="slidesPerView" label="Slides visíveis" min={1} max={6} />
            <NumberUnitField path="gap" label="Espaço entre slides" units={["px", "rem"]} max={80} />
            <NumberUnitField
              path="slideHeight"
              label="Altura dos slides"
              units={["px", "vh"]}
              keywords={["auto"]}
              max={1000}
            />
          </Group>
          <Group title="Reprodução">
            <NumberField path="autoplay" label="Autoplay (segundos, 0 = desligado)" min={0} max={30} />
            {autoplay > 0 ? <SwitchField path="pauseOnHover" label="Pausar com o mouse em cima" /> : null}
            <SwitchField
              path="loop"
              label="Voltar ao início"
              hint="As setas vão do último slide para o primeiro (e vice-versa)."
            />
          </Group>
        </>
      }
      style={
        <>
          <Group title="Setas">
            <SwitchField path="showArrows" label="Mostrar setas" />
            {arrows ? (
              <>
                <SegmentedField
                  path="arrowIcon"
                  label="Ícone"
                  options={[
                    { value: "chevron", label: "Seta simples" },
                    { value: "arrow", label: "Flecha" },
                  ]}
                />
                <SegmentedField
                  path="arrowShape"
                  label="Formato"
                  options={[
                    { value: "circle", label: "Círculo" },
                    { value: "square", label: "Quadrado" },
                    { value: "none", label: "Sem fundo" },
                  ]}
                />
                <SegmentedField
                  path="arrowPosition"
                  label="Posição"
                  options={[
                    { value: "inside", label: "Dentro" },
                    { value: "outside", label: "Fora" },
                  ]}
                />
                <NumberUnitField path="arrowSize" label="Tamanho" units={["px"]} max={96} />
                <ColorField path="arrowColor" label="Cor" />
                <ColorField path="arrowBackground" label="Fundo" allowEmpty />
              </>
            ) : null}
          </Group>
          <Group title="Pontos" defaultOpen={false}>
            <SwitchField path="showDots" label="Mostrar pontos" />
            {dots ? (
              <>
                <NumberUnitField path="dotSize" label="Tamanho" units={["px"]} max={24} />
                <ColorField path="dotColor" label="Cor" />
                <ColorField path="dotActiveColor" label="Cor do ativo" />
              </>
            ) : null}
          </Group>
        </>
      }
      advanced={<BoxFields />}
    />
  );
}

export const Carousel: ComponentDefinition<CarouselProps> = {
  type: "Carousel",
  displayName: "Carrossel",
  category: "media",
  icon: GalleryHorizontalEnd,
  isCanvas: true,
  inToolbox: true,
  defaults: CAROUSEL_DEFAULTS,
  rules: {
    canMoveIn: (incoming) => incoming.every((n) => n.data.name === "CarouselSlide"),
  },
  View: CarouselView,
  css: (id, p) => {
    const sheet = createSheet(id);
    sheet
      .root()
      .set("position", "relative")
      .set("--pb-car-n", p.slidesPerView, (n) => String(Math.max(1, n || 1)))
      .set("--pb-car-gap", p.gap);

    const outside = p.arrowPosition === "outside";
    sheet
      .rule(" .pb-car-viewport")
      .set("position", "relative")
      .set("padding", p.showArrows, (on) => (on && outside ? `0 calc(${p.arrowSize} + 12px)` : "0"));

    sheet
      .rule(" .pb-car-track")
      .set("display", "flex")
      .set("align-items", "stretch")
      .set("gap", "var(--pb-car-gap)")
      .set("overflow-x", "auto")
      .set("overflow-y", "hidden")
      .set("scroll-snap-type", "x mandatory")
      .set("scroll-behavior", "smooth")
      .set("overscroll-behavior-x", "contain")
      .set("scrollbar-width", "none")
      .set("-webkit-overflow-scrolling", "touch");
    sheet
      .rule(" .pb-car-track > .pb-car-slide")
      .set("flex", "0 0 calc((100% - (var(--pb-car-n) - 1) * var(--pb-car-gap)) / var(--pb-car-n))")
      .set("min-width", "0")
      .set("scroll-snap-align", "start")
      .set("height", p.slideHeight);

    const arrow = sheet.rule(" .pb-car-arrow");
    arrow
      .set("position", "absolute")
      .set("top", "50%")
      .set("translate", "0 -50%")
      .set("z-index", "2")
      .set("display", p.showArrows, (on) => (on ? "flex" : "none"))
      .set("align-items", "center")
      .set("justify-content", "center")
      .set("width", p.arrowSize)
      .set("height", p.arrowSize)
      .set("padding", "0")
      .set("border", "0")
      .set("cursor", "pointer")
      .set("color", p.arrowColor)
      .set("background-color", p.arrowShape === "none" ? "transparent" : p.arrowBackground || "transparent")
      .set("border-radius", p.arrowShape === "circle" ? "50%" : p.arrowShape === "square" ? "8px" : "0")
      .set("box-shadow", p.arrowShape === "none" ? undefined : "0 2px 10px rgba(0,0,0,.12)")
      .set("transition", "opacity .2s ease, transform .2s ease");
    sheet.rule(" .pb-car-arrow:hover").set("opacity", ".85");
    sheet.rule(" .pb-car-arrow:disabled").set("opacity", ".35").set("cursor", "default");
    sheet
      .rule(" .pb-car-arrow svg")
      .set("width", "55%")
      .set("height", "55%")
      .set("fill", "none")
      .set("stroke", "currentColor")
      .set("stroke-width", "2")
      .set("stroke-linecap", "round")
      .set("stroke-linejoin", "round");
    const edge = outside ? "0" : "12px";
    sheet.rule(" .pb-car-prev").set("left", edge);
    sheet.rule(" .pb-car-next").set("right", edge);

    sheet
      .rule(" .pb-car-dots")
      .set("display", p.showDots, (on) => (on ? "flex" : "none"))
      .set("flex-wrap", "wrap")
      .set("justify-content", "center")
      .set("align-items", "center")
      .set("gap", "8px")
      .set("margin-top", "16px");
    sheet
      .rule(" .pb-car-dot")
      .set("width", p.dotSize)
      .set("height", p.dotSize)
      .set("padding", "0")
      .set("border", "0")
      .set("border-radius", "999px")
      .set("cursor", "pointer")
      .set("background-color", p.dotColor)
      .set("transition", "width .25s ease, background-color .25s ease");
    sheet
      .rule(" .pb-car-dot.pb-car-dot-active")
      .set("width", `calc(${p.dotSize} * 2.5)`)
      .set("background-color", p.dotActiveColor);
    sheet.rule(" .pb-car-dot[hidden]").set("display", "none");

    applyBox(sheet, p.box, "block");
    const s = sheet.selector;
    return (
      sheet.toString() +
      `${s} .pb-car-track::-webkit-scrollbar{display:none}` +
      `@media (prefers-reduced-motion:reduce){${s} .pb-car-track{scroll-behavior:auto}${s} .pb-car-dot,${s} .pb-car-arrow{transition:none}}`
    );
  },
  Settings: CarouselSettings,
  runtime: ["carousel"],
};

/* ------------------------------------------------------------------ */
/* Slide (filho)                                                       */
/* ------------------------------------------------------------------ */

export type CarouselSlideProps = {
  background: Background;
  padding: Responsive<Sides>;
  minHeight: Responsive<Length>;
  verticalAlign: Responsive<"flex-start" | "center" | "flex-end">;
  alignItems: Responsive<"stretch" | "flex-start" | "center" | "flex-end">;
  gap: Responsive<Length>;
  border: Border;
  box: Box;
};

function CarouselSlideView({ id, props, children, rootRef }: NodeViewProps<CarouselSlideProps>) {
  const isEditor = useIsEditor();
  const localRef = useRef<HTMLDivElement | null>(null);
  const empty = !children || (Array.isArray(children) && children.length === 0);
  return (
    <div
      ref={mergeRefs(rootRef as React.Ref<HTMLDivElement>, localRef)}
      className={nodeClassName(id, "pb-car-slide", props.box)}
      data-pb-node={id}
    >
      {children}
      {isEditor && empty ? <div className="pb-placeholder">Arraste elementos para este slide</div> : null}
      {isEditor ? (
        <RevealOnSelect
          id={id}
          onReveal={(selected) => {
            // selecionar o slide (ou algo dentro dele) rola a trilha até ele
            if (selected)
              localRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "nearest",
              });
          }}
        />
      ) : null}
    </div>
  );
}

function CarouselSlideSettings() {
  return (
    <SettingsTabs
      content={
        <Group title="Layout">
          <NumberUnitField path="minHeight" label="Altura mínima" units={["px", "vh"]} max={1000} />
          <SegmentedField
            path="verticalAlign"
            label="Alinhamento vertical"
            options={[
              { value: "flex-start", label: "Topo" },
              { value: "center", label: "Centro" },
              { value: "flex-end", label: "Base" },
            ]}
          />
          <SegmentedField
            path="alignItems"
            label="Alinhamento horizontal"
            options={[
              { value: "stretch", label: "Esticar" },
              { value: "flex-start", label: "Início" },
              { value: "center", label: "Centro" },
              { value: "flex-end", label: "Fim" },
            ]}
          />
          <NumberUnitField path="gap" label="Espaço entre elementos" units={["px", "rem"]} max={80} />
          <SidesField path="padding" label="Espaço interno" units={["px", "%", "rem"]} />
        </Group>
      }
      style={
        <>
          <Group title="Fundo">
            <BackgroundFields base="background" />
          </Group>
          <Group title="Borda" defaultOpen={false}>
            <BorderFields base="border" />
          </Group>
        </>
      }
      advanced={<BoxFields withSize={false} />}
    />
  );
}

const SLIDE_BLOCKED = new Set(["Page", "Carousel", "CarouselSlide"]);

export const CarouselSlide: ComponentDefinition<CarouselSlideProps> = {
  type: "CarouselSlide",
  displayName: "Slide",
  category: "media",
  icon: RectangleHorizontal,
  isCanvas: true,
  inToolbox: false,
  defaults: {
    background: defaultBackground({ type: "color", color: C.surface }),
    padding: responsive(sides("48px", "32px"), undefined, sides("32px", "20px")),
    minHeight: responsive("320px", undefined, "260px"),
    verticalAlign: responsive("center"),
    alignItems: responsive("center"),
    gap: responsive("16px"),
    border: defaultBorder({ radius: responsive(corners("16px")) }),
    box: defaultBox(),
  },
  rules: {
    canDrop: (target) => target.data.name === "Carousel",
    canMoveIn: (incoming) =>
      incoming.every((n) => !TOP_LEVEL_TYPES.has(n.data.name) && !SLIDE_BLOCKED.has(n.data.name)),
  },
  View: CarouselSlideView,
  css: (id, p) => {
    const sheet = createSheet(id);
    const root = sheet.root();
    root
      .set("position", "relative")
      .set("display", "flex")
      .set("flex-direction", "column")
      .set("justify-content", p.verticalAlign)
      .set("align-items", p.alignItems)
      .set("gap", p.gap)
      .set("padding", p.padding, sidesToCss)
      .set("min-height", p.minHeight, (v) => (v === "0px" ? undefined : v));
    applyBackground(root, p.background);
    applyBorder(root, p.border);
    // largura vem do carrossel; padding e altura mínima têm campos próprios
    applyBox(
      sheet,
      {
        ...p.box,
        padding: undefined,
        minHeight: undefined,
        width: undefined,
        maxWidth: undefined,
      },
      "flex",
    );
    return sheet.toString();
  },
  Settings: CarouselSlideSettings,
};

/* ------------------------------------------------------------------ */
/* Estruturas iniciais (Toolbox e "Adicionar")                         */
/* ------------------------------------------------------------------ */

const centered = { textAlign: responsive("center") };

/** Slide com título + texto centralizados. */
export function carouselSlideSpec(index: number): NodeSpec {
  return h("CarouselSlide", {}, [
    h("Heading", {
      text: `Slide ${index + 1}`,
      tag: "h3",
      typography: {
        fontSize: responsive("28px", undefined, "22px"),
        ...centered,
      },
    }),
    h("Text", {
      html: "<p>Escreva aqui uma mensagem curta para este slide.</p>",
      typography: centered,
    }),
  ]);
}

/** Carrossel com 3 slides (título + texto). */
export const carouselSpec = (): NodeSpec => h("Carousel", {}, [0, 1, 2].map(carouselSlideSpec));
