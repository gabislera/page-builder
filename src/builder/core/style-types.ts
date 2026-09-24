import type { Responsive } from "./responsive.ts";

/** CSS values with a unit: "16px", "100%", "auto", "2rem"... */
export type Length = string;

export type Sides = {
  top: Length;
  right: Length;
  bottom: Length;
  left: Length;
};
export type Corners = {
  topLeft: Length;
  topRight: Length;
  bottomRight: Length;
  bottomLeft: Length;
};

export type TextAlign = "left" | "center" | "right" | "justify";

export type Typography = {
  fontFamily: string;
  fontSize: Responsive<Length>;
  fontWeight: string;
  lineHeight: Responsive<string>;
  letterSpacing: Responsive<Length>;
  textAlign: Responsive<TextAlign>;
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "line-through";
  color: string;
};

export type Gradient = {
  type: "linear" | "radial";
  angle: number;
  from: string;
  fromPosition: number;
  to: string;
  toPosition: number;
};

export type BackgroundImage = {
  url: string;
  size: "cover" | "contain" | "auto";
  position: string;
  repeat: boolean;
  fixed: boolean;
};

export type Background = {
  type: "none" | "color" | "gradient" | "image";
  color: string;
  gradient: Gradient;
  image: BackgroundImage;
  /** Color applied over the image (e.g. "#00000080"). */
  overlay: string;
};

export type BorderStyle = "none" | "solid" | "dashed" | "dotted";

export type Border = {
  style: BorderStyle;
  width: Responsive<Sides>;
  color: string;
  radius: Responsive<Corners>;
};

export type Shadow = {
  enabled: boolean;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
};

export type TextShadow = Omit<Shadow, "spread" | "inset">;

export type Hover = {
  enabled: boolean;
  color: string;
  background: string;
  borderColor: string;
  /** 0–1 */
  opacity: number;
  /** 1 = no zoom */
  scale: number;
  durationMs: number;
};

export type Animation = "none" | "pulse" | "fade-in" | "fade-up";

/** Box properties common to all elements ("Advanced" tab). */
export type Box = {
  margin: Responsive<Sides>;
  padding: Responsive<Sides>;
  width: Responsive<Length>;
  maxWidth: Responsive<Length>;
  minHeight: Responsive<Length>;
  alignSelf: Responsive<"auto" | "flex-start" | "center" | "flex-end" | "stretch">;
  visible: Responsive<boolean>;
  animation: Animation;
  anchorId: string;
  cssClass: string;
  /** Positioning (absolute, fixed, sticky on scroll...). */
  position: Responsive<PositionType>;
  /** Offsets used with relative/absolute/fixed/sticky position. */
  offsets: Responsive<Sides>;
  /** Layer (z-index). Empty = automatic. */
  zIndex: Responsive<string>;
  transform: Transform;
  opacity: Responsive<number>;
  overflow: "visible" | "hidden" | "auto";
  scrollEffect: ScrollEffect;
  /** Free-form CSS. The word `selector` is replaced with this element's selector. */
  customCss: string;
};

export type PositionType = "static" | "relative" | "absolute" | "fixed" | "sticky";

/** Transforms independent of hover (use CSS rotate/scale/translate). */
export type Transform = {
  rotate: number;
  scale: number;
  translateX: Length;
  translateY: Length;
};

export type ScrollEffect = {
  type: "none" | "parallax";
  /** Parallax speed: negative goes up, positive goes down (-1 to 1). */
  speed: number;
};

/** Click action (buttons, images, menu links, containers). */
export type Action =
  | { type: "none" }
  | { type: "url"; url: string; newTab: boolean }
  | { type: "section"; sectionId: string }
  | { type: "page"; pageId: string; newTab: boolean }
  | { type: "modal"; modalId: string }
  | { type: "whatsapp"; phone: string; message: string };
