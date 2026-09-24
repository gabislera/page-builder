import { responsive } from "./responsive.ts";
import type { Background, Border, Box, Corners, Hover, Shadow, Sides, TextShadow, Typography } from "./style-types.ts";
import { C } from "./theme.ts";

export const sides = (top: string, right = top, bottom = top, left = right): Sides => ({ top, right, bottom, left });

export const corners = (all: string): Corners => ({
  topLeft: all,
  topRight: all,
  bottomRight: all,
  bottomLeft: all,
});

export const defaultBox = (overrides: Partial<Box> = {}): Box => ({
  margin: responsive(sides("0px")),
  padding: responsive(sides("0px")),
  width: responsive("auto"),
  maxWidth: responsive("100%"),
  minHeight: responsive("0px"),
  alignSelf: responsive("auto"),
  visible: responsive(true),
  animation: "none",
  anchorId: "",
  cssClass: "",
  position: responsive("static"),
  offsets: responsive(sides("auto")),
  zIndex: responsive(""),
  transform: { rotate: 0, scale: 1, translateX: "0px", translateY: "0px" },
  opacity: responsive(1),
  overflow: "visible",
  scrollEffect: { type: "none", speed: 0.3 },
  customCss: "",
  ...overrides,
});

export const defaultTypography = (overrides: Partial<Typography> = {}): Typography => ({
  fontFamily: "inherit",
  fontSize: responsive("16px"),
  fontWeight: "400",
  lineHeight: responsive("1.5"),
  letterSpacing: responsive("0px"),
  textAlign: responsive("left"),
  textTransform: "none",
  fontStyle: "normal",
  textDecoration: "none",
  color: C.text,
  ...overrides,
});

export const defaultBackground = (overrides: Partial<Background> = {}): Background => ({
  type: "none",
  color: C.background,
  gradient: {
    type: "linear",
    angle: 135,
    from: C.primary,
    fromPosition: 0,
    to: C.secondary,
    toPosition: 100,
  },
  image: {
    url: "",
    size: "cover",
    position: "center center",
    repeat: false,
    fixed: false,
  },
  overlay: "",
  ...overrides,
});

export const defaultBorder = (overrides: Partial<Border> = {}): Border => ({
  style: "none",
  width: responsive(sides("1px")),
  color: C.border,
  radius: responsive(corners("0px")),
  ...overrides,
});

export const defaultShadow = (overrides: Partial<Shadow> = {}): Shadow => ({
  enabled: false,
  x: 0,
  y: 8,
  blur: 24,
  spread: 0,
  color: "#0000001f",
  inset: false,
  ...overrides,
});

export const defaultTextShadow = (overrides: Partial<TextShadow> = {}): TextShadow => ({
  enabled: false,
  x: 0,
  y: 2,
  blur: 4,
  color: "#00000040",
  ...overrides,
});

export const defaultHover = (overrides: Partial<Hover> = {}): Hover => ({
  enabled: false,
  color: "",
  background: "",
  borderColor: "",
  opacity: 1,
  scale: 1,
  durationMs: 200,
  ...overrides,
});
