import type { Responsive } from "./responsive.ts";

/** Valores CSS com unidade: "16px", "100%", "auto", "2rem"... */
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
	/** Cor aplicada por cima da imagem (ex.: "#00000080"). */
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
	/** 1 = sem zoom */
	scale: number;
	durationMs: number;
};

export type Animation = "none" | "pulse" | "fade-in" | "fade-up";

/** Propriedades de caixa comuns a todos os elementos (aba "Avançado"). */
export type Box = {
	margin: Responsive<Sides>;
	padding: Responsive<Sides>;
	width: Responsive<Length>;
	maxWidth: Responsive<Length>;
	minHeight: Responsive<Length>;
	alignSelf: Responsive<
		"auto" | "flex-start" | "center" | "flex-end" | "stretch"
	>;
	visible: Responsive<boolean>;
	animation: Animation;
	anchorId: string;
	cssClass: string;
};

/** Ação de clique (botões, imagens, links de menu, containers). */
export type Action =
	| { type: "none" }
	| { type: "url"; url: string; newTab: boolean }
	| { type: "section"; sectionId: string }
	| { type: "page"; pageId: string; newTab: boolean }
	| { type: "modal"; modalId: string }
	| { type: "whatsapp"; phone: string; message: string };
