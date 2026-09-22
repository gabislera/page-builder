/**
 * Antes e depois: duas imagens sobrepostas e uma linha com alça que o
 * visitante arrasta para comparar. Por baixo é um <input type="range">
 * invisível (teclado, toque e leitores de tela de graça); o runtime "compare"
 * só repassa o valor para a variável CSS --pb-ba.
 */
import { SplitSquareHorizontal } from "lucide-react";
import type { CSSProperties } from "react";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
	BorderFields,
	BoxFields,
	MediaPathField,
	NumberField,
	ShadowFields,
} from "../controls/groups.tsx";
import { SelectField, SwitchField, TextField } from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import {
	corners,
	defaultBorder,
	defaultBox,
	defaultShadow,
} from "../core/defaults.ts";
import { nodeClassName } from "../core/node-helpers.ts";
import { useIsEditor, useRender } from "../core/render-context.tsx";
import {
	applyBorder,
	applyBox,
	createSheet,
	shadowToCss,
} from "../core/style-engine.ts";
import type { Border, Box, Shadow } from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type BeforeAfterProps = {
	beforeSrc: string;
	beforeAlt: string;
	afterSrc: string;
	afterAlt: string;
	showLabels: boolean;
	beforeLabel: string;
	afterLabel: string;
	/** Posição inicial da linha, em % da largura. */
	start: number;
	ratio: "auto" | "16 / 9" | "4 / 3" | "1 / 1" | "3 / 4";
	lineColor: string;
	border: Border;
	shadow: Shadow;
	box: Box;
};

/** Imagens de exemplo, para o componente já fazer sentido ao ser solto. */
const sample = (label: string, bg: string, fg: string, x: number) =>
	"data:image/svg+xml;utf8," +
	encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750"><rect width="1200" height="750" fill="${bg}"/><path d="M480 470l90-120 75 90 45-52 105 82H480z" fill="${fg}"/><circle cx="525" cy="320" r="33" fill="${fg}"/><text x="${x}" y="660" font-family="system-ui,sans-serif" font-size="44" font-weight="700" fill="${fg}" text-anchor="middle">${label}</text></svg>`,
	);
export const BEFORE_SAMPLE = sample("Antes", "#d4d4d8", "#71717a", 300);
export const AFTER_SAMPLE = sample("Depois", "#dbeafe", "#2563eb", 900);

function BeforeAfterView({
	id,
	props,
	rootRef,
}: NodeViewProps<BeforeAfterProps>) {
	const isEditor = useIsEditor();
	const ctx = useRender();
	const start = Math.min(100, Math.max(0, props.start));
	const lazy = ctx.mode === "publish" ? ("lazy" as const) : undefined;
	return (
		<div
			ref={rootRef as React.Ref<HTMLDivElement>}
			className={nodeClassName(id, "pb-ba", props.box)}
			data-pb-node={id}
			data-pb-ba=""
			style={{ "--pb-ba": `${start}%` } as CSSProperties}
		>
			<img
				className="pb-ba-img pb-ba-after"
				src={props.afterSrc || AFTER_SAMPLE}
				alt={props.afterAlt}
				loading={lazy}
				decoding="async"
			/>
			<img
				className="pb-ba-img pb-ba-before"
				src={props.beforeSrc || BEFORE_SAMPLE}
				alt={props.beforeAlt}
				loading={lazy}
				decoding="async"
			/>
			{props.showLabels ? (
				<>
					<span className="pb-ba-tag pb-ba-tag-before" aria-hidden="true">
						{props.beforeLabel}
					</span>
					<span className="pb-ba-tag pb-ba-tag-after" aria-hidden="true">
						{props.afterLabel}
					</span>
				</>
			) : null}
			<span className="pb-ba-line" aria-hidden="true">
				<span className="pb-ba-knob">
					<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
						<path
							d="M9 6l-6 6 6 6M15 6l6 6-6 6"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</span>
			</span>
			<input
				className="pb-ba-range"
				type="range"
				min={0}
				max={100}
				step={0.5}
				defaultValue={start}
				aria-label={`Comparar ${props.beforeLabel || "antes"} e ${props.afterLabel || "depois"}`}
				// no editor o clique seleciona; a posição vem do painel
				tabIndex={isEditor ? -1 : undefined}
				disabled={isEditor}
			/>
		</div>
	);
}

function BeforeAfterSettings() {
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Antes">
						<MediaPathField path="beforeSrc" label="Imagem" accept="image" />
						<TextField path="beforeAlt" label="Texto alternativo (SEO)" />
					</Group>
					<Group title="Depois">
						<MediaPathField path="afterSrc" label="Imagem" accept="image" />
						<TextField path="afterAlt" label="Texto alternativo (SEO)" />
					</Group>
					<Group title="Comparação">
						<NumberField
							path="start"
							label="Posição inicial da linha (%)"
							min={0}
							max={100}
						/>
						<SwitchField path="showLabels" label="Mostrar etiquetas" />
						<TextField path="beforeLabel" label="Etiqueta de antes" />
						<TextField path="afterLabel" label="Etiqueta de depois" />
					</Group>
				</>
			}
			style={
				<>
					<Group title="Dimensões">
						<SelectField
							path="ratio"
							label="Proporção"
							options={[
								{ value: "auto", label: "Da imagem de depois" },
								{ value: "16 / 9", label: "16:9 (paisagem)" },
								{ value: "4 / 3", label: "4:3" },
								{ value: "1 / 1", label: "1:1 (quadrado)" },
								{ value: "3 / 4", label: "3:4 (retrato)" },
							]}
						/>
					</Group>
					<Group title="Linha">
						<ColorField path="lineColor" label="Cor da linha e da alça" />
					</Group>
					<Group title="Borda" defaultOpen={false}>
						<BorderFields base="border" />
					</Group>
					<Group title="Sombra" defaultOpen={false}>
						<ShadowFields base="shadow" />
					</Group>
				</>
			}
			advanced={<BoxFields />}
		/>
	);
}

export const BeforeAfter: ComponentDefinition<BeforeAfterProps> = {
	type: "BeforeAfter",
	displayName: "Antes e depois",
	category: "media",
	icon: SplitSquareHorizontal,
	inToolbox: true,
	runtime: ["compare"],
	defaults: {
		beforeSrc: "",
		beforeAlt: "",
		afterSrc: "",
		afterAlt: "",
		showLabels: true,
		beforeLabel: "Antes",
		afterLabel: "Depois",
		start: 50,
		ratio: "16 / 9",
		lineColor: "#ffffff",
		border: defaultBorder({ radius: { desktop: corners("12px") } }),
		shadow: defaultShadow(),
		box: defaultBox({ width: { desktop: "100%" } }),
	},
	View: BeforeAfterView,
	css: (id, p) => {
		const sheet = createSheet(id);
		const root = sheet.root();
		const fixed = p.ratio !== "auto";
		root
			.set("position", "relative")
			.set("display", "block")
			.set("overflow", "hidden")
			.set("aspect-ratio", fixed ? p.ratio : undefined)
			.set("user-select", "none")
			.set("box-shadow", shadowToCss(p.shadow));
		applyBorder(root, p.border);

		// "depois" embaixo (define a altura quando a proporção é automática);
		// "antes" por cima, recortado até a linha
		sheet
			.rule(" > .pb-ba-img")
			.set("display", "block")
			.set("width", "100%")
			.set("height", "100%")
			.set("object-fit", "cover")
			.set("pointer-events", "none");
		sheet
			.rule(" > .pb-ba-after")
			.set("position", fixed ? "absolute" : "relative")
			.set("inset", fixed ? "0" : undefined);
		sheet
			.rule(" > .pb-ba-before")
			.set("position", "absolute")
			.set("inset", "0")
			.set("clip-path", "inset(0 calc(100% - var(--pb-ba, 50%)) 0 0)");

		sheet
			.rule(" > .pb-ba-line")
			.set("position", "absolute")
			.set("top", "0")
			.set("bottom", "0")
			.set("left", "var(--pb-ba, 50%)")
			.set("width", "3px")
			.set("transform", "translateX(-50%)")
			.set("background", p.lineColor)
			.set("box-shadow", "0 0 12px rgba(0,0,0,.25)")
			.set("pointer-events", "none");
		sheet
			.rule(" .pb-ba-knob")
			.set("position", "absolute")
			.set("top", "50%")
			.set("left", "50%")
			.set("display", "grid")
			.set("place-items", "center")
			.set("width", "44px")
			.set("height", "44px")
			.set("border-radius", "999px")
			.set("transform", "translate(-50%, -50%)")
			.set("background", p.lineColor)
			.set("color", "#18181b")
			.set("box-shadow", "0 4px 16px rgba(0,0,0,.3)")
			.set("transition", "transform .15s ease");
		sheet
			.rule(":has(.pb-ba-range:focus-visible) .pb-ba-knob")
			.set("outline", "3px solid var(--pb-c-primary)")
			.set("outline-offset", "2px");
		sheet
			.rule(":active .pb-ba-knob")
			.set("transform", "translate(-50%, -50%) scale(1.08)");

		sheet
			.rule(" > .pb-ba-tag")
			.set("position", "absolute")
			.set("top", "14px")
			.set("padding", "5px 12px")
			.set("border-radius", "999px")
			.set("background", "rgba(0,0,0,.55)")
			.set("color", "#ffffff")
			.set("font-family", "var(--pb-font-body)")
			.set("font-size", "13px")
			.set("font-weight", "600")
			.set("pointer-events", "none")
			.set("backdrop-filter", "blur(4px)");
		sheet.rule(" > .pb-ba-tag-before").set("left", "14px");
		sheet.rule(" > .pb-ba-tag-after").set("right", "14px");

		// o range cobre tudo: clicar ou arrastar em qualquer ponto move a linha
		const range = sheet.rule(" > .pb-ba-range");
		range
			.set("position", "absolute")
			.set("inset", "0")
			.set("width", "100%")
			.set("height", "100%")
			.set("margin", "0")
			.set("opacity", "0")
			.set("cursor", "ew-resize")
			.set("appearance", "none")
			.set("-webkit-appearance", "none")
			.set("background", "transparent")
			// no celular, arrastar na vertical continua rolando a página
			.set("touch-action", "pan-y");
		sheet.rule(" > .pb-ba-range:disabled").set("pointer-events", "none");
		for (const thumb of ["::-webkit-slider-thumb", "::-moz-range-thumb"])
			sheet
				.rule(` > .pb-ba-range${thumb}`)
				.set("-webkit-appearance", "none")
				.set("appearance", "none")
				.set("width", "44px")
				.set("height", "100%")
				.set("border", "0")
				.set("cursor", "ew-resize");
		applyBox(sheet, p.box);
		return sheet.toString();
	},
	Settings: BeforeAfterSettings,
};
