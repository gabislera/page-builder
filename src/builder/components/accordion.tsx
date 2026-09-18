/**
 * Acordeão composto: cada item é um nó de verdade (AccordionItem) e o corpo
 * dele é um canvas onde qualquer elemento pode ser arrastado.
 *
 * Usa <details>/<summary> nativos (abre e fecha sem JS). "Só um aberto por
 * vez" usa o atributo `name` compartilhado pelos itens. O estilo fica no
 * acordeão (pai) e chega aos itens por seletores descendentes, então todos
 * os itens ficam iguais; o item só cuida da própria caixa (aba Avançado).
 */
import { ListCollapse, PanelTopOpen } from "lucide-react";
import { createContext, isValidElement, useContext, useState } from "react";
import { ChildItemsField } from "../controls/child-items.tsx";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
	BorderFields,
	BoxFields,
	ShadowFields,
	SidesField,
	TypographyFields,
} from "../controls/groups.tsx";
import { IconField } from "../controls/icon.tsx";
import {
	NumberUnitField,
	SegmentedField,
	SelectField,
	SwitchField,
	TextField,
} from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { h, type NodeSpec } from "../core/build.ts";
import { flattenChildren } from "../core/children.ts";
import {
	corners,
	defaultBorder,
	defaultBox,
	defaultShadow,
	defaultTypography,
	sides,
} from "../core/defaults.ts";
import { IconView } from "../core/icons.tsx";
import { useInlineEdit } from "../core/inline-edit.tsx";
import { nodeClassName, TOP_LEVEL_TYPES } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
	applyBorder,
	applyBox,
	applyTypography,
	createSheet,
	nodeSelector,
	shadowToCss,
	sidesToCss,
} from "../core/style-engine.ts";
import type {
	Border,
	BorderStyle,
	Box,
	Length,
	Shadow,
	Sides,
	Typography,
} from "../core/style-types.ts";
import { C, FONT_HEADING } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import { RevealOnSelect } from "./shared/editor-reveal.tsx";

/* ------------------------------------------------------------------ */
/* Acordeão (pai)                                                      */
/* ------------------------------------------------------------------ */

export type AccordionProps = {
	/** Abrir um item fecha os outros (atributo `name` do <details>). */
	exclusive: boolean;
	firstOpen: boolean;
	/** Só no editor: mostra todos os itens abertos para receber elementos. */
	editorExpandAll: boolean;
	iconStyle: "chevron" | "plus" | "none";
	iconPosition: "left" | "right";
	iconSize: Length;
	iconColor: string;
	activeIconColor: string;
	titleTypography: Typography;
	activeTitleColor: string;
	titleBackground: string;
	activeTitleBackground: string;
	titlePadding: Responsive<Sides>;
	bodyPadding: Responsive<Sides>;
	bodyBackground: string;
	bodyGap: Responsive<Length>;
	itemBackground: string;
	border: Border;
	shadow: Shadow;
	gap: Responsive<Length>;
	/** Linha entre um item e outro (estilo lista). */
	dividerStyle: BorderStyle;
	dividerColor: string;
	dividerWidth: Length;
	box: Box;
};

const ACCORDION_DEFAULTS: AccordionProps = {
	exclusive: true,
	firstOpen: true,
	editorExpandAll: true,
	iconStyle: "chevron",
	iconPosition: "right",
	iconSize: "20px",
	iconColor: "",
	activeIconColor: "",
	titleTypography: defaultTypography({
		fontFamily: FONT_HEADING,
		fontSize: responsive("18px", undefined, "16px"),
		fontWeight: "600",
		lineHeight: responsive("1.4"),
		color: C.text,
	}),
	activeTitleColor: C.primary,
	titleBackground: "",
	activeTitleBackground: "",
	titlePadding: responsive(sides("18px", "20px"), undefined, sides("16px")),
	bodyPadding: responsive(
		sides("0px", "20px", "20px"),
		undefined,
		sides("0px", "16px", "16px"),
	),
	bodyBackground: "",
	bodyGap: responsive("12px"),
	itemBackground: C.background,
	border: defaultBorder({
		style: "solid",
		color: C.border,
		radius: responsive(corners("10px")),
	}),
	shadow: defaultShadow(),
	gap: responsive("12px"),
	dividerStyle: "none",
	dividerColor: C.border,
	dividerWidth: "1px",
	box: defaultBox({ width: responsive("100%") }),
};

/** O item lê a aparência e o comportamento do acordeão por contexto. */
const AccordionContext = createContext<{
	parentId: string;
	props: AccordionProps;
	index: number;
} | null>(null);

function AccordionView({
	id,
	props,
	children,
	rootRef,
}: NodeViewProps<AccordionProps>) {
	const isEditor = useIsEditor();
	const items = flattenChildren(children);
	return (
		<div
			ref={rootRef as React.Ref<HTMLDivElement>}
			className={nodeClassName(id, "pb-acc", props.box)}
			data-pb-node={id}
		>
			{items.map((child, index) => (
				<AccordionContext.Provider
					key={isValidElement(child) && child.key !== null ? child.key : index}
					value={{ parentId: id, props, index }}
				>
					{child}
				</AccordionContext.Provider>
			))}
			{isEditor && items.length === 0 ? (
				<div className="pb-placeholder">Adicione itens no painel</div>
			) : null}
		</div>
	);
}

function AccordionSettings() {
	const iconStyle = useField<AccordionProps["iconStyle"]>("iconStyle").value;
	const divider = useField<BorderStyle>("dividerStyle").value;
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Itens">
						<ChildItemsField
							label="Itens do acordeão"
							childType="AccordionItem"
							itemLabel={(p) => String(p.title ?? "")}
							addLabel="Adicionar item"
							create={(i) =>
								h("AccordionItem", { title: `Item ${i + 1}` }, [
									h("Text", { html: "<p>Conteúdo do item.</p>" }),
								])
							}
							min={1}
						/>
					</Group>
					<Group title="Comportamento">
						<SwitchField
							path="exclusive"
							label="Só um aberto por vez"
							hint="Abrir um item fecha os outros."
						/>
						<SwitchField path="firstOpen" label="Primeiro item aberto" />
						<SwitchField
							path="editorExpandAll"
							label="Mostrar todos abertos no editor"
							hint="Só no editor, para arrastar elementos para dentro dos itens."
						/>
					</Group>
				</>
			}
			style={
				<>
					<Group title="Itens">
						<NumberUnitField
							path="gap"
							label="Espaço entre itens"
							units={["px", "rem"]}
							max={80}
						/>
						<ColorField path="itemBackground" label="Fundo" allowEmpty />
					</Group>
					<Group title="Título" defaultOpen={false}>
						<TypographyFields base="titleTypography" />
						<ColorField
							path="activeTitleColor"
							label="Cor quando aberto"
							allowEmpty
						/>
						<ColorField path="titleBackground" label="Fundo" allowEmpty />
						<ColorField
							path="activeTitleBackground"
							label="Fundo quando aberto"
							allowEmpty
						/>
						<SidesField
							path="titlePadding"
							label="Espaço interno"
							units={["px", "rem"]}
						/>
					</Group>
					<Group title="Ícone" defaultOpen={false}>
						<SegmentedField
							path="iconStyle"
							label="Estilo"
							options={[
								{ value: "chevron", label: "Seta" },
								{ value: "plus", label: "Mais" },
								{ value: "none", label: "Nenhum" },
							]}
						/>
						{iconStyle !== "none" ? (
							<>
								<SegmentedField
									path="iconPosition"
									label="Posição"
									options={[
										{ value: "left", label: "Esquerda" },
										{ value: "right", label: "Direita" },
									]}
								/>
								<NumberUnitField
									path="iconSize"
									label="Tamanho"
									units={["px", "em"]}
									max={64}
								/>
								<ColorField path="iconColor" label="Cor" allowEmpty />
								<ColorField
									path="activeIconColor"
									label="Cor quando aberto"
									allowEmpty
								/>
							</>
						) : null}
					</Group>
					<Group title="Conteúdo" defaultOpen={false}>
						<SidesField
							path="bodyPadding"
							label="Espaço interno"
							units={["px", "rem"]}
						/>
						<NumberUnitField
							path="bodyGap"
							label="Espaço entre elementos"
							units={["px", "rem"]}
							max={80}
						/>
						<ColorField path="bodyBackground" label="Fundo" allowEmpty />
					</Group>
					<Group title="Borda" defaultOpen={false}>
						<BorderFields base="border" />
					</Group>
					<Group title="Divisória" defaultOpen={false}>
						<SelectField
							path="dividerStyle"
							label="Linha entre itens"
							options={[
								{ value: "none", label: "Nenhuma" },
								{ value: "solid", label: "Sólida" },
								{ value: "dashed", label: "Tracejada" },
								{ value: "dotted", label: "Pontilhada" },
							]}
						/>
						{divider !== "none" ? (
							<>
								<NumberUnitField
									path="dividerWidth"
									label="Espessura"
									units={["px"]}
									max={10}
								/>
								<ColorField path="dividerColor" label="Cor" />
							</>
						) : null}
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

export const Accordion: ComponentDefinition<AccordionProps> = {
	type: "Accordion",
	displayName: "Acordeão",
	category: "layout",
	icon: ListCollapse,
	isCanvas: true,
	inToolbox: true,
	defaults: ACCORDION_DEFAULTS,
	rules: {
		canMoveIn: (incoming) =>
			incoming.every((n) => n.data.name === "AccordionItem"),
	},
	View: AccordionView,
	css: (id, p) => {
		const sheet = createSheet(id);
		sheet
			.root()
			.set("display", "flex")
			.set("flex-direction", "column")
			.set("gap", p.gap)
			// permite animar a altura até "auto" onde houver suporte
			.set("interpolate-size", "allow-keywords");

		const I = " > .pb-acc-item";
		const item = sheet.rule(I);
		item
			.set("background-color", p.itemBackground)
			.set("box-shadow", shadowToCss(p.shadow))
			.set("overflow", "hidden");
		applyBorder(item, p.border);
		if (p.dividerStyle !== "none") {
			sheet
				.rule(`${I}:not(:last-of-type)`)
				.set(
					"border-bottom",
					`${p.dividerWidth} ${p.dividerStyle} ${p.dividerColor}`,
				);
		}

		const title = sheet.rule(`${I} > .pb-acc-title`);
		title
			.set("display", "flex")
			.set("align-items", "center")
			.set("gap", "12px")
			.set("cursor", "pointer")
			.set("list-style", "none")
			.set("padding", p.titlePadding, sidesToCss)
			.set("background-color", p.titleBackground)
			.set("transition", "color .2s ease, background-color .2s ease");
		applyTypography(title, p.titleTypography);
		sheet
			.rule(`${I}[open] > .pb-acc-title`)
			.set("color", p.activeTitleColor)
			.set("background-color", p.activeTitleBackground);
		sheet.rule(`${I} > .pb-acc-title::marker`).set("content", '""');
		sheet
			.rule(`${I} > .pb-acc-title > .pb-acc-title-text`)
			.set("flex", "1")
			.set("min-width", "0");
		sheet
			.rule(`${I} > .pb-acc-title > .pb-acc-title-icon`)
			.set("flex-shrink", "0")
			.set("width", "1.15em")
			.set("height", "1.15em");

		const ind = `${I} > .pb-acc-title > .pb-acc-ind`;
		sheet
			.rule(ind)
			.set("flex-shrink", "0")
			.set("width", p.iconSize)
			.set("height", p.iconSize)
			.set("fill", "none")
			.set("stroke", p.iconColor || "currentColor")
			.set("stroke-width", "2")
			.set("stroke-linecap", "round")
			.set("stroke-linejoin", "round")
			.set("transition", "transform .25s ease");
		sheet
			.rule(`${I}[open] > .pb-acc-title > .pb-acc-ind`)
			.set("stroke", p.activeIconColor);
		sheet
			.rule(`${I}[open] > .pb-acc-title > .pb-acc-chevron`)
			.set("transform", "rotate(180deg)");
		sheet
			.rule(`${ind} .pb-acc-v`)
			.set("transform-origin", "center")
			.set("transition", "transform .25s ease");
		sheet
			.rule(`${I}[open] > .pb-acc-title > .pb-acc-ind .pb-acc-v`)
			.set("transform", "rotate(90deg)");

		sheet
			.rule(`${I} > .pb-acc-body`)
			.set("display", "flex")
			.set("flex-direction", "column")
			.set("gap", p.bodyGap)
			.set("padding", p.bodyPadding, sidesToCss)
			.set("background-color", p.bodyBackground);

		applyBox(sheet, p.box, "flex");

		// abertura suave onde houver ::details-content; nos demais abre direto
		const s = `${nodeSelector(id)}${I}`;
		const motion =
			`${s} > .pb-acc-title::-webkit-details-marker{display:none}` +
			`${s}::details-content{block-size:0;overflow:hidden;transition:block-size .3s ease,content-visibility .3s allow-discrete}` +
			`${s}[open]::details-content{block-size:auto}` +
			`@media (prefers-reduced-motion:reduce){${s}::details-content,${s} > .pb-acc-title > .pb-acc-ind,${s} .pb-acc-v{transition:none}}`;
		return sheet.toString() + motion;
	},
	Settings: AccordionSettings,
	fonts: (p) => [p.titleTypography.fontFamily],
};

/* ------------------------------------------------------------------ */
/* Item do acordeão (filho)                                            */
/* ------------------------------------------------------------------ */

export type AccordionItemProps = {
	title: string;
	/** Ícone do lucide antes do título (opcional). */
	icon: string;
	openByDefault: boolean;
	box: Box;
};

function Indicator({ style }: { style: AccordionProps["iconStyle"] }) {
	if (style === "none") return null;
	if (style === "plus") {
		return (
			<svg
				className="pb-acc-ind pb-acc-plus"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path d="M5 12h14" />
				<path className="pb-acc-v" d="M12 5v14" />
			</svg>
		);
	}
	return (
		<svg
			className="pb-acc-ind pb-acc-chevron"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}

function AccordionItemView({
	id,
	props,
	children,
	rootRef,
	onPropChange,
}: NodeViewProps<AccordionItemProps>) {
	const isEditor = useIsEditor();
	const ctx = useContext(AccordionContext);
	const parent = ctx?.props ?? ACCORDION_DEFAULTS;
	// no editor, selecionar o item (ou algo dentro dele) abre o painel
	const [revealed, setRevealed] = useState(false);
	const title = useInlineEdit(
		props.title,
		onPropChange && ((v) => onPropChange("title", v)),
	);
	const empty = !children || (Array.isArray(children) && children.length === 0);
	const open =
		props.openByDefault ||
		(parent.firstOpen && ctx?.index === 0) ||
		(isEditor && (parent.editorExpandAll || revealed));
	// no editor o `name` fecharia os outros itens abertos
	const name =
		!isEditor && ctx && parent.exclusive ? `acc-${ctx.parentId}` : undefined;
	const indicator = <Indicator style={parent.iconStyle} />;
	return (
		<details
			ref={rootRef as React.Ref<HTMLDetailsElement>}
			className={nodeClassName(id, "pb-acc-item", props.box)}
			data-pb-node={id}
			name={name}
			open={open || undefined}
		>
			<summary
				className="pb-acc-title"
				// no editor o clique seleciona o item em vez de abrir/fechar
				onClick={isEditor ? (e) => e.preventDefault() : undefined}
			>
				{parent.iconPosition === "left" ? indicator : null}
				{props.icon ? (
					<IconView name={props.icon} className="pb-acc-title-icon" />
				) : null}
				<span
					className="pb-acc-title-text"
					ref={title.ref as React.Ref<HTMLSpanElement>}
					{...title.attrs}
				>
					{title.editing ? null : props.title}
				</span>
				{parent.iconPosition === "right" ? indicator : null}
			</summary>
			<div className="pb-acc-body">
				{children}
				{isEditor && empty ? (
					<div className="pb-placeholder">Arraste elementos para este item</div>
				) : null}
			</div>
			{isEditor ? <RevealOnSelect id={id} onReveal={setRevealed} /> : null}
		</details>
	);
}

function AccordionItemSettings() {
	return (
		<SettingsTabs
			content={
				<Group title="Item">
					<TextField path="title" label="Título" />
					<IconField path="icon" label="Ícone" allowNone />
					<SwitchField
						path="openByDefault"
						label="Aberto ao carregar"
						hint="A aparência é definida no acordeão."
					/>
				</Group>
			}
			advanced={<BoxFields withSize={false} />}
		/>
	);
}

/** Tipos que não podem ir para dentro de um item (evita aninhar acordeões). */
const ITEM_BLOCKED = new Set(["Page", "Accordion", "AccordionItem"]);

export const AccordionItem: ComponentDefinition<AccordionItemProps> = {
	type: "AccordionItem",
	displayName: "Item do acordeão",
	category: "layout",
	icon: PanelTopOpen,
	isCanvas: true,
	inToolbox: false,
	defaults: {
		title: "Item do acordeão",
		icon: "",
		openByDefault: false,
		box: defaultBox(),
	},
	rules: {
		canDrop: (target) => target.data.name === "Accordion",
		canMoveIn: (incoming) =>
			incoming.every(
				(n) =>
					!TOP_LEVEL_TYPES.has(n.data.name) && !ITEM_BLOCKED.has(n.data.name),
			),
	},
	View: AccordionItemView,
	css: (id, p) => {
		const sheet = createSheet(id);
		applyBox(sheet, p.box, "block");
		return sheet.toString();
	},
	Settings: AccordionItemSettings,
};

/** Acordeão inicial (Toolbox): 3 itens com texto. */
export const accordionSpec = (): NodeSpec =>
	h(
		"Accordion",
		{},
		["Primeiro item", "Segundo item", "Terceiro item"].map((title) =>
			h("AccordionItem", { title }, [
				h("Text", { html: "<p>Conteúdo do item.</p>" }),
			]),
		),
	);
