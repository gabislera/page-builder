/**
 * Motor de estilos: transforma props em CSS com media queries.
 *
 * É a mesma função no editor e na publicação. Como o canvas do editor é um
 * iframe com a largura do dispositivo, as media queries se aplicam
 * naturalmente, e o que se vê no editor é o que vai ao ar.
 */

import {
	DEVICE_MEDIA,
	DEVICES,
	type Device,
	isResponsive,
	type Responsive,
} from "./responsive.ts";
import type {
	Background,
	Border,
	Box,
	Corners,
	Gradient,
	Hover,
	Shadow,
	Sides,
	TextShadow,
	Typography,
} from "./style-types.ts";

type Declarations = Map<string, string>;
type MaybeResponsive<T> = T | Responsive<T>;
type Formatter<T> = (value: T) => string | undefined | null;

const isEmpty = (v: unknown) => v === undefined || v === null || v === "";

export class StyleRule {
	private readonly decls: Record<Device, Declarations> = {
		desktop: new Map(),
		tablet: new Map(),
		mobile: new Map(),
	};

	constructor(readonly selector: string) {}

	/** Define uma propriedade, aceitando valor fixo ou responsivo. */
	set<T>(
		property: string,
		value: MaybeResponsive<T> | undefined,
		format: Formatter<T> = (v) => (isEmpty(v) ? undefined : String(v)),
	): this {
		if (value === undefined) return this;
		if (isResponsive<T>(value)) {
			for (const device of DEVICES) {
				const v = value[device];
				if (v === undefined) continue;
				const css = format(v);
				if (!isEmpty(css)) this.decls[device].set(property, css as string);
			}
			return this;
		}
		const css = format(value as T);
		if (!isEmpty(css)) this.decls.desktop.set(property, css as string);
		return this;
	}

	/** Define uma propriedade apenas em um dispositivo. */
	setOn(device: Device, property: string, value: string | undefined): this {
		if (!isEmpty(value)) this.decls[device].set(property, value as string);
		return this;
	}

	declarations(device: Device): Declarations {
		return this.decls[device];
	}
}

export class StyleSheet {
	private readonly rules: StyleRule[] = [];

	constructor(private readonly base: string) {}

	/** Regra do próprio nó. */
	root(): StyleRule {
		return this.rule("");
	}

	/** Regra para um seletor relativo ao nó (":hover", " .label"...). */
	rule(suffix: string): StyleRule {
		const selector = `${this.base}${suffix}`;
		let rule = this.rules.find((r) => r.selector === selector);
		if (!rule) {
			rule = new StyleRule(selector);
			this.rules.push(rule);
		}
		return rule;
	}

	/** Regra com seletor livre (ex.: "@keyframes" não entra aqui). */
	raw(selector: string): StyleRule {
		const rule = new StyleRule(selector);
		this.rules.push(rule);
		return rule;
	}

	toString(): string {
		let out = "";
		for (const device of DEVICES) {
			let block = "";
			for (const rule of this.rules) {
				const decls = rule.declarations(device);
				if (decls.size === 0) continue;
				block += `${rule.selector}{${[...decls]
					.map(([p, v]) => `${p}:${v}`)
					.join(";")}}`;
			}
			if (!block) continue;
			const media = DEVICE_MEDIA[device];
			out += media ? `@media ${media}{${block}}` : block;
		}
		return out;
	}
}

/** Seletor de classe usado por cada nó no editor e na página publicada. */
export const nodeClass = (id: string) => `n-${id}`;
export const nodeSelector = (id: string) => `.${nodeClass(id)}`;

export const createSheet = (id: string) => new StyleSheet(nodeSelector(id));

/* ------------------------------------------------------------------ */
/* Formatadores                                                        */
/* ------------------------------------------------------------------ */

export const sidesToCss = (s: Sides) =>
	`${s.top} ${s.right} ${s.bottom} ${s.left}`;

export const cornersToCss = (c: Corners) =>
	`${c.topLeft} ${c.topRight} ${c.bottomRight} ${c.bottomLeft}`;

export const gradientToCss = (g: Gradient) =>
	g.type === "radial"
		? `radial-gradient(circle, ${g.from} ${g.fromPosition}%, ${g.to} ${g.toPosition}%)`
		: `linear-gradient(${g.angle}deg, ${g.from} ${g.fromPosition}%, ${g.to} ${g.toPosition}%)`;

export const shadowToCss = (s: Shadow) =>
	s.enabled
		? `${s.inset ? "inset " : ""}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`
		: undefined;

export const textShadowToCss = (s: TextShadow) =>
	s.enabled ? `${s.x}px ${s.y}px ${s.blur}px ${s.color}` : undefined;

const cssUrl = (url: string) => `url("${url.replace(/"/g, "%22")}")`;

/* ------------------------------------------------------------------ */
/* Aplicadores de grupos de props                                      */
/* ------------------------------------------------------------------ */

export function applyTypography(rule: StyleRule, t: Partial<Typography>) {
	rule
		.set("font-family", t.fontFamily, (v) => (v ? fontStack(v) : undefined))
		.set("font-size", t.fontSize)
		.set("font-weight", t.fontWeight)
		.set("line-height", t.lineHeight)
		.set("letter-spacing", t.letterSpacing)
		.set("text-align", t.textAlign)
		.set("text-transform", t.textTransform, (v) =>
			v === "none" ? undefined : v,
		)
		.set("font-style", t.fontStyle, (v) => (v === "normal" ? undefined : v))
		.set("text-decoration", t.textDecoration, (v) =>
			v === "none" ? undefined : v,
		)
		.set("color", t.color);
}

export function applyBackground(rule: StyleRule, b: Background | undefined) {
	if (!b) return;
	switch (b.type) {
		case "color":
			rule.set("background-color", b.color);
			break;
		case "gradient":
			rule.set("background-image", gradientToCss(b.gradient));
			break;
		case "image": {
			if (!b.image.url) break;
			const layers = [cssUrl(b.image.url)];
			if (b.overlay)
				layers.unshift(`linear-gradient(${b.overlay}, ${b.overlay})`);
			rule
				.set("background-image", layers.join(", "))
				.set("background-size", b.image.size)
				.set("background-position", b.image.position)
				.set("background-repeat", b.image.repeat ? "repeat" : "no-repeat")
				.set("background-attachment", b.image.fixed ? "fixed" : undefined)
				.set("background-color", b.color);
			break;
		}
		default:
			break;
	}
}

export function applyBorder(rule: StyleRule, b: Border | undefined) {
	if (!b) return;
	if (b.style !== "none") {
		rule
			.set("border-style", b.style)
			.set("border-width", b.width, sidesToCss)
			.set("border-color", b.color);
	}
	rule.set("border-radius", b.radius, cornersToCss);
}

export function applyHover(
	sheet: StyleSheet,
	h: Hover | undefined,
	opts: { background?: boolean } = { background: true },
) {
	if (!h?.enabled) return;
	const base = sheet.root();
	const transition = `all ${h.durationMs}ms ease`;
	base.set("transition", transition);
	const hover = sheet.rule(":hover");
	hover
		.set("color", h.color)
		.set("border-color", h.borderColor)
		.set("opacity", h.opacity === 1 ? undefined : h.opacity)
		.set("transform", h.scale === 1 ? undefined : `scale(${h.scale})`);
	if (opts.background && h.background) {
		hover.set("background", h.background);
	}
}

/**
 * Valor usado para ocultar um elemento por dispositivo (visibilidade da aba
 * Avançado). O comentário marca a regra para o editor mostrar o elemento
 * translúcido em vez de sumir com ele; outros "display:none" não são afetados.
 */
export const HIDDEN_DISPLAY = "none/*pb-hidden*/";
export const EDITOR_HIDDEN_STYLE = "opacity:.35;outline:1px dashed #a1a1aa";

/**
 * Aplica as props de caixa. `display` é o valor usado quando o elemento está
 * visível. Ele é reaplicado nos dispositivos onde a visibilidade volta a ser
 * verdadeira depois de ter sido ocultado em um dispositivo maior.
 */
export function applyBox(
	sheet: StyleSheet,
	box: Partial<Box> | undefined,
	display = "block",
) {
	if (!box) return;
	const rule = sheet.root();
	rule
		.set("margin", box.margin, sidesToCss)
		.set("padding", box.padding, sidesToCss)
		.set("width", box.width)
		.set("max-width", box.maxWidth)
		.set("min-height", box.minHeight, (v) => (v === "0px" ? undefined : v))
		.set("align-self", box.alignSelf, (v) => (v === "auto" ? undefined : v));

	if (box.visible) {
		let previous = true;
		for (const device of DEVICES) {
			const own = isResponsive<boolean>(box.visible)
				? box.visible[device]
				: device === "desktop"
					? (box.visible as unknown as boolean)
					: undefined;
			if (own === undefined) continue;
			if (!own) rule.setOn(device, "display", HIDDEN_DISPLAY);
			else if (!previous) rule.setOn(device, "display", display);
			previous = own;
		}
	}
}

/* ------------------------------------------------------------------ */
/* Fontes                                                              */
/* ------------------------------------------------------------------ */

export const SYSTEM_FONTS: Record<string, string> = {
	"Sans-serif":
		"ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
	Serif: "ui-serif, Georgia, 'Times New Roman', serif",
	Monospace: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
	Arial: "Arial, Helvetica, sans-serif",
	Georgia: "Georgia, serif",
	Tahoma: "Tahoma, Verdana, sans-serif",
	"Times New Roman": "'Times New Roman', Times, serif",
};

/**
 * Fontes do Google oferecidas no editor, com os pesos que cada uma possui.
 * Pesos inexistentes fazem a API do Google Fonts recusar a requisição.
 */
export const GOOGLE_FONTS: Record<string, string> = {
	Inter: "300;400;500;600;700;800;900",
	Roboto: "300;400;500;700;900",
	"Open Sans": "300;400;500;600;700;800",
	Montserrat: "300;400;500;600;700;800;900",
	Poppins: "300;400;500;600;700;800;900",
	Lato: "300;400;700;900",
	Raleway: "300;400;500;600;700;800;900",
	Nunito: "300;400;500;600;700;800;900",
	"Playfair Display": "400;500;600;700;800;900",
	Merriweather: "300;400;700;900",
	Oswald: "300;400;500;600;700",
	"Source Sans 3": "300;400;500;600;700;800;900",
	"DM Sans": "300;400;500;600;700;800;900",
	Manrope: "300;400;500;600;700;800",
	"Work Sans": "300;400;500;600;700;800;900",
	Rubik: "300;400;500;600;700;800;900",
	"Bebas Neue": "400",
	Lora: "400;500;600;700",
	"Space Grotesk": "300;400;500;600;700",
	Outfit: "300;400;500;600;700;800;900",
};

export const FONT_OPTIONS = [
	"inherit",
	...Object.keys(SYSTEM_FONTS),
	...Object.keys(GOOGLE_FONTS),
];

export function fontStack(family: string): string {
	if (family === "inherit") return "inherit";
	if (SYSTEM_FONTS[family]) return SYSTEM_FONTS[family];
	return `'${family}', ${SYSTEM_FONTS["Sans-serif"]}`;
}

export function googleFontsHref(families: Iterable<string>): string | null {
	const list = [...new Set(families)].filter((f) => f in GOOGLE_FONTS);
	if (list.length === 0) return null;
	const params = list
		.map(
			(f) =>
				`family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@${GOOGLE_FONTS[f]}`,
		)
		.join("&");
	return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
