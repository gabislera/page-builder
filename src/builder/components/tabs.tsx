/**
 * Abas compostas: cada aba é um nó de verdade (TabItem) e o painel dela é um
 * canvas onde qualquer elemento pode ser arrastado.
 *
 * Cada TabItem renderiza o próprio botão e o próprio painel como irmãos
 * diretos do elemento das Abas. O CSS do pai monta o layout sem JS:
 * - horizontal: flex com quebra; botões com `order:0`, o painel ativo com
 *   `order:1` e largura total, então os botões ficam numa linha em cima;
 * - vertical: grade com os botões na 1ª coluna e o painel ativo na 2ª,
 *   ocupando todas as linhas (o número de abas vem na variável --pb-tabs-n);
 * - celular "empilhado": cada botão seguido do seu painel (como acordeão).
 * Painéis inativos ficam ocultos. Na página publicada, o runtime "tabs"
 * troca a aba ativa; no editor, o estado fica na view das Abas (React), sem
 * passar pelo histórico de desfazer.
 */
import { Folders, PanelTop } from "lucide-react";
import { createContext, isValidElement, useContext, useState } from "react";
import { ChildItemsField } from "../controls/child-items.tsx";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
	BackgroundFields,
	BorderFields,
	BoxFields,
	SidesField,
	TypographyFields,
} from "../controls/groups.tsx";
import { IconField } from "../controls/icon.tsx";
import {
	NumberUnitField,
	SegmentedField,
	TextField,
} from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { h, type NodeSpec } from "../core/build.ts";
import { flattenChildren } from "../core/children.ts";
import {
	corners,
	defaultBackground,
	defaultBorder,
	defaultBox,
	defaultTypography,
	sides,
} from "../core/defaults.ts";
import { IconView } from "../core/icons.tsx";
import { useInlineEdit } from "../core/inline-edit.tsx";
import { nodeClassName, TOP_LEVEL_TYPES } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
	applyBackground,
	applyBorder,
	applyBox,
	applyTypography,
	cornersToCss,
	createSheet,
	sidesToCss,
} from "../core/style-engine.ts";
import type {
	Background,
	Border,
	Box,
	Corners,
	Length,
	Sides,
	Typography,
} from "../core/style-types.ts";
import { C, FONT_BODY } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import { RevealOnSelect } from "./shared/editor-reveal.tsx";

/* ------------------------------------------------------------------ */
/* Abas (pai)                                                          */
/* ------------------------------------------------------------------ */

export type TabsProps = {
	/** Posição das abas no desktop e tablet. */
	orientation: "horizontal" | "vertical";
	/** No celular: abas em linha (quebrando) ou cada aba seguida do conteúdo. */
	mobileMode: "tabs" | "stack";
	justify: "flex-start" | "center" | "flex-end" | "stretch";
	/** Largura da coluna de abas (vertical). */
	navWidth: Responsive<Length>;
	tabGap: Responsive<Length>;
	/** Espaço entre as abas e o conteúdo. */
	navGap: Responsive<Length>;
	tabTypography: Typography;
	tabPadding: Responsive<Sides>;
	tabRadius: Responsive<Corners>;
	tabBackground: string;
	hoverColor: string;
	hoverBackground: string;
	activeColor: string;
	activeBackground: string;
	indicator: "underline" | "pill" | "box" | "none";
	indicatorColor: string;
	/** Cor do texto sobre o indicador (estilo "pílula"). */
	indicatorTextColor: string;
	indicatorWidth: Length;
	panelPadding: Responsive<Sides>;
	panelGap: Responsive<Length>;
	panelBackground: Background;
	panelBorder: Border;
	box: Box;
};

const TABS_DEFAULTS: TabsProps = {
	orientation: "horizontal",
	mobileMode: "tabs",
	justify: "flex-start",
	navWidth: responsive("220px"),
	tabGap: responsive("4px"),
	navGap: responsive("20px"),
	tabTypography: defaultTypography({
		fontFamily: FONT_BODY,
		fontSize: responsive("16px", undefined, "15px"),
		fontWeight: "600",
		lineHeight: responsive("1.4"),
		color: C.textMuted,
	}),
	tabPadding: responsive(
		sides("12px", "18px"),
		undefined,
		sides("10px", "14px"),
	),
	tabRadius: responsive(corners("8px")),
	tabBackground: "",
	hoverColor: C.text,
	hoverBackground: "",
	activeColor: C.primary,
	activeBackground: "",
	indicator: "underline",
	indicatorColor: C.primary,
	indicatorTextColor: "#ffffff",
	indicatorWidth: "2px",
	panelPadding: responsive(sides("0px")),
	panelGap: responsive("16px"),
	panelBackground: defaultBackground(),
	panelBorder: defaultBorder(),
	box: defaultBox({ width: responsive("100%") }),
};

type TabsContextValue = {
	parentId: string;
	props: TabsProps;
	index: number;
	active: number;
	setActive: (index: number) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function TabsView({ id, props, children, rootRef }: NodeViewProps<TabsProps>) {
	const isEditor = useIsEditor();
	// aba ativa no editor (na página publicada começa na primeira)
	const [editorActive, setActive] = useState(0);
	const items = flattenChildren(children);
	const active = isEditor
		? Math.min(editorActive, Math.max(items.length - 1, 0))
		: 0;
	return (
		<div
			ref={rootRef as React.Ref<HTMLDivElement>}
			className={nodeClassName(id, "pb-tabs", props.box)}
			data-pb-node={id}
			data-pb-tabs=""
			style={
				{ "--pb-tabs-n": Math.max(items.length, 1) } as React.CSSProperties
			}
		>
			{items.map((child, index) => (
				<TabsContext.Provider
					key={isValidElement(child) && child.key !== null ? child.key : index}
					value={{ parentId: id, props, index, active, setActive }}
				>
					{child}
				</TabsContext.Provider>
			))}
			{isEditor && items.length === 0 ? (
				<div className="pb-placeholder">Adicione abas no painel</div>
			) : null}
		</div>
	);
}

function TabsSettings() {
	const orientation = useField<TabsProps["orientation"]>("orientation").value;
	const indicator = useField<TabsProps["indicator"]>("indicator").value;
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Abas">
						<ChildItemsField
							label="Abas"
							childType="TabItem"
							itemLabel={(p) => String(p.label ?? "")}
							addLabel="Adicionar aba"
							create={(i) =>
								h("TabItem", { label: `Aba ${i + 1}` }, [
									h("Text", { html: "<p>Conteúdo da aba.</p>" }),
								])
							}
							min={1}
						/>
					</Group>
					<Group title="Layout">
						<SegmentedField
							path="orientation"
							label="Posição das abas"
							options={[
								{ value: "horizontal", label: "Em cima" },
								{ value: "vertical", label: "À esquerda" },
							]}
						/>
						<SegmentedField
							path="justify"
							label={
								orientation === "vertical" ? "Texto das abas" : "Alinhamento"
							}
							options={[
								{ value: "flex-start", label: "Início" },
								{ value: "center", label: "Centro" },
								{ value: "flex-end", label: "Fim" },
								{ value: "stretch", label: "Esticar" },
							]}
						/>
						{orientation === "vertical" ? (
							<NumberUnitField
								path="navWidth"
								label="Largura das abas"
								units={["px", "%"]}
								max={480}
							/>
						) : null}
						<SegmentedField
							path="mobileMode"
							label="No celular"
							options={[
								{ value: "tabs", label: "Abas" },
								{ value: "stack", label: "Empilhar" },
							]}
						/>
					</Group>
				</>
			}
			style={
				<>
					<Group title="Abas">
						<TypographyFields base="tabTypography" withAlign={false} />
						<ColorField path="tabBackground" label="Fundo" allowEmpty />
						<SidesField
							path="tabPadding"
							label="Espaço interno"
							units={["px", "rem"]}
						/>
						<NumberUnitField
							path="tabGap"
							label="Espaço entre abas"
							units={["px", "rem"]}
							max={60}
						/>
						<NumberUnitField
							path="navGap"
							label="Espaço até o conteúdo"
							units={["px", "rem"]}
							max={80}
						/>
					</Group>
					<Group title="Aba ativa e hover" defaultOpen={false}>
						<ColorField path="activeColor" label="Texto ativo" allowEmpty />
						<ColorField
							path="activeBackground"
							label="Fundo ativo"
							allowEmpty
						/>
						<ColorField path="hoverColor" label="Texto no hover" allowEmpty />
						<ColorField
							path="hoverBackground"
							label="Fundo no hover"
							allowEmpty
						/>
					</Group>
					<Group title="Indicador" defaultOpen={false}>
						<SegmentedField
							path="indicator"
							label="Estilo"
							options={[
								{ value: "underline", label: "Linha" },
								{ value: "pill", label: "Pílula" },
								{ value: "box", label: "Caixa" },
								{ value: "none", label: "Nenhum" },
							]}
						/>
						{indicator !== "none" ? (
							<ColorField path="indicatorColor" label="Cor" />
						) : null}
						{indicator === "pill" ? (
							<ColorField
								path="indicatorTextColor"
								label="Texto sobre o indicador"
							/>
						) : null}
						{indicator === "underline" || indicator === "box" ? (
							<NumberUnitField
								path="indicatorWidth"
								label="Espessura"
								units={["px"]}
								max={8}
							/>
						) : null}
					</Group>
					<Group title="Conteúdo" defaultOpen={false}>
						<SidesField
							path="panelPadding"
							label="Espaço interno"
							units={["px", "rem"]}
						/>
						<NumberUnitField
							path="panelGap"
							label="Espaço entre elementos"
							units={["px", "rem"]}
							max={80}
						/>
						<BackgroundFields base="panelBackground" />
					</Group>
					<Group title="Borda do conteúdo" defaultOpen={false}>
						<BorderFields base="panelBorder" />
					</Group>
				</>
			}
			advanced={<BoxFields />}
		/>
	);
}

export const Tabs: ComponentDefinition<TabsProps> = {
	type: "Tabs",
	displayName: "Abas",
	category: "layout",
	icon: Folders,
	isCanvas: true,
	inToolbox: true,
	defaults: TABS_DEFAULTS,
	rules: {
		canMoveIn: (incoming) => incoming.every((n) => n.data.name === "TabItem"),
	},
	View: TabsView,
	css: (id, p) => {
		const sheet = createSheet(id);
		const vertical = p.orientation === "vertical";
		const root = sheet.root();
		const B = " > .pb-tab-btn";
		const P = " > .pb-tab-panel";
		const btn = sheet.rule(B);
		const panel = sheet.rule(P);
		const activePanel = sheet.rule(`${P}.pb-tab-active`);

		if (vertical) {
			root
				.set("display", "grid")
				.set("grid-template-columns", p.navWidth, (w) => `${w} minmax(0, 1fr)`)
				.set("grid-template-rows", "repeat(var(--pb-tabs-n, 1), auto) 1fr")
				.set("column-gap", p.navGap)
				.set("row-gap", p.tabGap)
				.set("align-items", "start");
			btn.set("grid-column", "1");
			activePanel.set("grid-column", "2").set("grid-row", "1 / -1");
		} else {
			root
				.set("display", "flex")
				.set("flex-wrap", "wrap")
				.set("align-items", "flex-end")
				.set("gap", p.tabGap)
				.set(
					"justify-content",
					p.justify === "stretch" ? "flex-start" : p.justify,
				);
			activePanel
				.set("flex", "0 0 100%")
				.set("order", "1")
				.set("margin-top", p.navGap);
			if (p.justify === "stretch") btn.set("flex", "1 1 0");
		}

		// botão
		btn
			.set("display", "flex")
			.set("align-items", "center")
			.set("justify-content", p.justify === "stretch" ? "center" : p.justify)
			.set("gap", "8px")
			.set("order", "0")
			.set("min-width", "0")
			.set("margin", "0")
			.set("border", "0")
			.set("cursor", "pointer")
			.set("text-align", vertical ? "left" : "center")
			.set("background-color", p.tabBackground || "transparent")
			.set("padding", p.tabPadding, sidesToCss)
			.set("border-radius", p.indicator === "pill" ? "999px" : undefined)
			.set(
				"transition",
				"color .2s ease, background-color .2s ease, box-shadow .2s ease",
			);
		if (p.indicator !== "pill")
			btn.set("border-radius", p.tabRadius, cornersToCss);
		applyTypography(btn, p.tabTypography);
		sheet
			.rule(`${B}:hover`)
			.set("color", p.hoverColor)
			.set("background-color", p.hoverBackground);
		sheet
			.rule(`${B}:focus-visible`)
			.set("outline", `2px solid ${p.indicatorColor}`)
			.set("outline-offset", "2px");
		const active = sheet.rule(`${B}.pb-tab-active`);
		active
			.set("color", p.activeColor)
			.set("background-color", p.activeBackground);
		const line = p.indicatorWidth;
		if (p.indicator === "underline") {
			// sombra interna não mexe no tamanho do botão
			active.set(
				"box-shadow",
				vertical
					? `inset -${line} 0 0 ${p.indicatorColor}`
					: `inset 0 -${line} 0 ${p.indicatorColor}`,
			);
		} else if (p.indicator === "pill") {
			active
				.set("background-color", p.indicatorColor)
				.set("color", p.indicatorTextColor);
		} else if (p.indicator === "box") {
			active.set("box-shadow", `inset 0 0 0 ${line} ${p.indicatorColor}`);
		}
		sheet
			.rule(`${B} > .pb-tab-icon`)
			.set("flex-shrink", "0")
			.set("width", "1.1em")
			.set("height", "1.1em");
		sheet
			.rule(`${B} > .pb-tab-label`)
			.set("min-width", "0")
			.set("overflow-wrap", "anywhere");
		sheet
			.rule(`${B} > .pb-tab-chev`)
			.set("display", "none")
			.set("width", "1em")
			.set("height", "1em")
			.set("margin-left", "auto")
			.set("fill", "none")
			.set("stroke", "currentColor")
			.set("stroke-width", "2")
			.set("stroke-linecap", "round")
			.set("stroke-linejoin", "round")
			.set("transition", "transform .2s ease");

		// painel
		panel.set("display", "none").set("min-width", "0");
		activePanel
			.set("display", "flex")
			.set("flex-direction", "column")
			.set("gap", p.panelGap)
			.set("padding", p.panelPadding, sidesToCss);
		applyBackground(activePanel, p.panelBackground);
		applyBorder(activePanel, p.panelBorder);

		// celular
		if (p.mobileMode === "stack") {
			root
				.setOn("mobile", "display", "flex")
				.setOn("mobile", "flex-direction", "column")
				.setOn("mobile", "flex-wrap", "nowrap")
				.setOn("mobile", "align-items", "stretch");
			btn
				.setOn("mobile", "width", "100%")
				.setOn("mobile", "flex", "none")
				.setOn("mobile", "justify-content", "flex-start")
				.setOn("mobile", "text-align", "left");
			activePanel
				.setOn("mobile", "order", "0")
				.setOn("mobile", "flex", "none")
				.setOn("mobile", "margin-top", "0")
				.setOn("mobile", "margin-bottom", "8px");
			sheet.rule(`${B} > .pb-tab-chev`).setOn("mobile", "display", "block");
			sheet
				.rule(`${B}.pb-tab-active > .pb-tab-chev`)
				.setOn("mobile", "transform", "rotate(180deg)");
		} else if (vertical) {
			// abas à esquerda viram abas em cima no celular
			root
				.setOn("mobile", "display", "flex")
				.setOn("mobile", "flex-wrap", "wrap")
				.setOn("mobile", "align-items", "flex-end")
				.setOn("mobile", "gap", "4px");
			activePanel
				.setOn("mobile", "flex", "0 0 100%")
				.setOn("mobile", "order", "1")
				.setOn("mobile", "margin-top", "16px");
			if (p.indicator === "underline") {
				active.setOn(
					"mobile",
					"box-shadow",
					`inset 0 -${line} 0 ${p.indicatorColor}`,
				);
			}
		}

		applyBox(sheet, p.box, vertical ? "grid" : "flex");
		return `${sheet.toString()}@media (prefers-reduced-motion:reduce){${sheet.selector}${B}{transition:none}}`;
	},
	Settings: TabsSettings,
	runtime: ["tabs"],
	fonts: (p) => [p.tabTypography.fontFamily],
};

/* ------------------------------------------------------------------ */
/* Aba (filho)                                                         */
/* ------------------------------------------------------------------ */

export type TabItemProps = {
	label: string;
	/** Ícone do lucide antes do rótulo (opcional). */
	icon: string;
	box: Box;
};

function TabItemView({
	id,
	props,
	children,
	rootRef,
	onPropChange,
}: NodeViewProps<TabItemProps>) {
	const isEditor = useIsEditor();
	const ctx = useContext(TabsContext);
	const index = ctx?.index ?? 0;
	const isActive = ctx ? ctx.active === index : true;
	const label = useInlineEdit(
		props.label,
		onPropChange && ((v) => onPropChange("label", v)),
	);
	const empty = !children || (Array.isArray(children) && children.length === 0);
	const active = isActive ? " pb-tab-active" : "";
	return (
		<>
			<button
				type="button"
				id={`tabbtn-${id}`}
				className={`pb-tab-btn${active}`}
				role="tab"
				aria-selected={isActive}
				aria-controls={`tab-${id}`}
				tabIndex={isActive ? 0 : -1}
				onClick={isEditor && ctx ? () => ctx.setActive(index) : undefined}
			>
				{props.icon ? (
					<IconView name={props.icon} className="pb-tab-icon" />
				) : null}
				<span
					className="pb-tab-label"
					ref={label.ref as React.Ref<HTMLSpanElement>}
					{...label.attrs}
				>
					{label.editing ? null : props.label}
				</span>
				<svg className="pb-tab-chev" viewBox="0 0 24 24" aria-hidden="true">
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>
			<div
				ref={rootRef as React.Ref<HTMLDivElement>}
				id={`tab-${id}`}
				className={`${nodeClassName(id, "pb-tab-panel", props.box)}${active}`}
				data-pb-node={id}
				role="tabpanel"
				aria-labelledby={`tabbtn-${id}`}
			>
				{children}
				{isEditor && empty ? (
					<div className="pb-placeholder">Arraste elementos para esta aba</div>
				) : null}
				{isEditor && ctx ? (
					<RevealOnSelect
						id={id}
						onReveal={(selected) => {
							if (selected) ctx.setActive(index);
						}}
					/>
				) : null}
			</div>
		</>
	);
}

function TabItemSettings() {
	return (
		<SettingsTabs
			content={
				<Group title="Aba">
					<TextField path="label" label="Rótulo" />
					<IconField path="icon" label="Ícone" allowNone />
				</Group>
			}
			advanced={<BoxFields withSize={false} />}
		/>
	);
}

const TAB_BLOCKED = new Set(["Page", "TabItem"]);

export const TabItem: ComponentDefinition<TabItemProps> = {
	type: "TabItem",
	displayName: "Aba",
	category: "layout",
	icon: PanelTop,
	isCanvas: true,
	inToolbox: false,
	defaults: { label: "Aba", icon: "", box: defaultBox() },
	rules: {
		canDrop: (target) => target.data.name === "Tabs",
		canMoveIn: (incoming) =>
			incoming.every(
				(n) =>
					!TOP_LEVEL_TYPES.has(n.data.name) && !TAB_BLOCKED.has(n.data.name),
			),
	},
	View: TabItemView,
	css: (id, p) => {
		const sheet = createSheet(id);
		// quem mostra/oculta o painel são as Abas (aba ativa); visibilidade por
		// dispositivo não se aplica aqui
		applyBox(sheet, { ...p.box, visible: undefined }, "flex");
		return sheet.toString();
	},
	Settings: TabItemSettings,
};

/** Abas iniciais (Toolbox): 3 abas com texto. */
export const tabsSpec = (): NodeSpec =>
	h(
		"Tabs",
		{},
		["Aba 1", "Aba 2", "Aba 3"].map((label) =>
			h("TabItem", { label }, [
				h("Text", { html: `<p>Conteúdo da ${label.toLowerCase()}.</p>` }),
			]),
		),
	);
