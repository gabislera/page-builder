import {
	AlignHorizontalJustifyCenter,
	AlignHorizontalJustifyEnd,
	AlignHorizontalJustifyStart,
} from "lucide-react";
import { ColorField } from "../../controls/color.tsx";
import { NumberField } from "../../controls/groups.tsx";
import { NumberUnitField, SegmentedField } from "../../controls/inputs.tsx";
import { useField } from "../../controls/use-field.ts";
import {
	DEVICES,
	type Device,
	type Responsive,
	responsive,
} from "../../core/responsive.ts";
import type { StyleRule, StyleSheet } from "../../core/style-engine.ts";
import type { Length } from "../../core/style-types.ts";
import { C } from "../../core/theme.ts";

/** Aparência de um ícone com forma opcional (Ícone, Card com ícone). */
export type IconStyle = {
	name: string;
	size: Responsive<Length>;
	color: string;
	strokeWidth: number;
	/** default: só o ícone; stacked: forma preenchida; framed: forma com borda. */
	view: "default" | "stacked" | "framed";
	shape: "circle" | "square" | "rounded";
	/** Espaço entre o ícone e a borda da forma. */
	padding: Responsive<Length>;
	background: string;
	borderColor: string;
	borderWidth: Length;
	/** Graus. */
	rotate: number;
	hoverColor: string;
	hoverBackground: string;
	hoverBorderColor: string;
};

export const defaultIconStyle = (
	overrides: Partial<IconStyle> = {},
): IconStyle => ({
	name: "star",
	size: responsive("48px"),
	color: C.primary,
	strokeWidth: 2,
	view: "default",
	shape: "circle",
	padding: responsive("20px"),
	background: C.surface,
	borderColor: C.primary,
	borderWidth: "2px",
	rotate: 0,
	hoverColor: "",
	hoverBackground: "",
	hoverBorderColor: "",
	...overrides,
});

const RADIUS: Record<IconStyle["shape"], string> = {
	circle: "50%",
	square: "0",
	rounded: "22%",
};

/**
 * CSS do ícone: `selector` é o elemento que envolve o <svg> (a forma) e
 * `hoverSelector` o seletor que dispara o hover (a própria forma ou o card).
 */
export function applyIconStyle(
	sheet: StyleSheet,
	selector: string,
	hoverSelector: string,
	s: IconStyle,
) {
	const shaped = s.view !== "default";
	sheet
		.rule(selector)
		.set("display", "inline-flex")
		.set("align-items", "center")
		.set("justify-content", "center")
		.set("flex-shrink", "0")
		.set("line-height", "0")
		.set("color", s.color)
		.set(
			"transition",
			"color .2s ease,background-color .2s ease,border-color .2s ease,transform .2s ease",
		)
		.set("padding", shaped ? s.padding : undefined)
		.set("border-radius", shaped ? RADIUS[s.shape] : undefined)
		.set("background-color", s.view === "stacked" ? s.background : undefined)
		.set(
			"border",
			s.view === "framed"
				? `${s.borderWidth} solid ${s.borderColor}`
				: undefined,
		);
	sheet
		.rule(`${selector} svg`)
		.set("width", s.size)
		.set("height", s.size)
		.set("transform", s.rotate ? `rotate(${s.rotate}deg)` : undefined);
	sheet
		.rule(hoverSelector)
		.set("color", s.hoverColor || undefined)
		.set(
			"background-color",
			s.view === "stacked" ? s.hoverBackground || undefined : undefined,
		)
		.set(
			"border-color",
			s.view === "framed" ? s.hoverBorderColor || undefined : undefined,
		);
}

/**
 * Define propriedades calculadas por dispositivo (quando dependem de mais de
 * uma prop responsiva). Só emite o que muda em relação ao dispositivo maior.
 */
export function setPerDevice(
	rule: StyleRule,
	compute: (device: Device) => Record<string, string | undefined>,
) {
	let previous: Record<string, string | undefined> = {};
	for (const device of DEVICES) {
		const current = compute(device);
		for (const [prop, value] of Object.entries(current)) {
			if (device === "desktop" || value !== previous[prop])
				rule.setOn(device, prop, value);
		}
		previous = current;
	}
}

/** Opções de alinhamento horizontal (justify-content). */
export const ALIGN_OPTIONS = [
	{
		value: "flex-start" as const,
		label: "Início",
		icon: AlignHorizontalJustifyStart,
	},
	{
		value: "center" as const,
		label: "Centro",
		icon: AlignHorizontalJustifyCenter,
	},
	{ value: "flex-end" as const, label: "Fim", icon: AlignHorizontalJustifyEnd },
];

/* ------------------------------------------------------------------ */
/* Controles                                                           */
/* ------------------------------------------------------------------ */

/** Campos de aparência do ícone (aba Estilo). */
export function IconStyleFields({ base }: { base: string }) {
	const view = useField<IconStyle["view"]>(`${base}.view`);
	return (
		<>
			<SegmentedField
				path={`${base}.view`}
				label="Visual"
				options={[
					{ value: "default", label: "Simples" },
					{ value: "stacked", label: "Preenchido" },
					{ value: "framed", label: "Contorno" },
				]}
			/>
			{view.value !== "default" ? (
				<SegmentedField
					path={`${base}.shape`}
					label="Forma"
					options={[
						{ value: "circle", label: "Círculo" },
						{ value: "rounded", label: "Arred." },
						{ value: "square", label: "Quadrado" },
					]}
				/>
			) : null}
			<NumberUnitField
				path={`${base}.size`}
				label="Tamanho"
				units={["px", "em", "rem"]}
				max={200}
			/>
			{view.value !== "default" ? (
				<NumberUnitField
					path={`${base}.padding`}
					label="Espaço interno da forma"
					units={["px", "em"]}
					max={100}
				/>
			) : null}
			<ColorField path={`${base}.color`} label="Cor do ícone" />
			{view.value === "stacked" ? (
				<ColorField path={`${base}.background`} label="Cor da forma" />
			) : null}
			{view.value === "framed" ? (
				<>
					<ColorField path={`${base}.borderColor`} label="Cor da borda" />
					<NumberUnitField
						path={`${base}.borderWidth`}
						label="Espessura da borda"
						units={["px"]}
						max={12}
					/>
				</>
			) : null}
			<NumberField
				path={`${base}.strokeWidth`}
				label="Espessura do traço"
				min={0.5}
				max={4}
				step={0.25}
			/>
			<NumberField path={`${base}.rotate`} label="Rotação (°)" max={360} />
		</>
	);
}

/** Cores do ícone no hover. */
export function IconHoverFields({ base }: { base: string }) {
	const view = useField<IconStyle["view"]>(`${base}.view`);
	return (
		<>
			<ColorField
				path={`${base}.hoverColor`}
				label="Cor do ícone no hover"
				allowEmpty
			/>
			{view.value === "stacked" ? (
				<ColorField
					path={`${base}.hoverBackground`}
					label="Cor da forma no hover"
					allowEmpty
				/>
			) : null}
			{view.value === "framed" ? (
				<ColorField
					path={`${base}.hoverBorderColor`}
					label="Cor da borda no hover"
					allowEmpty
				/>
			) : null}
		</>
	);
}
