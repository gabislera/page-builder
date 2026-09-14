import {
	AlignHorizontalJustifyCenter,
	AlignHorizontalJustifyEnd,
	AlignHorizontalJustifyStart,
	AlignHorizontalSpaceBetween,
	ArrowDown,
	ArrowRight,
	Columns3,
	Rows3,
	Square,
} from "lucide-react";
import { ActionField } from "../controls/action.tsx";
import { Group } from "../controls/field.tsx";
import {
	BackgroundFields,
	BorderFields,
	BoxFields,
	HoverFields,
	NumberField,
	ShadowFields,
} from "../controls/groups.tsx";
import {
	NumberUnitField,
	SegmentedField,
	SelectField,
	SwitchField,
} from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { actionLink } from "../core/actions.ts";
import {
	defaultBackground,
	defaultBorder,
	defaultBox,
	defaultHover,
	defaultShadow,
} from "../core/defaults.ts";
import { nodeClassName, TOP_LEVEL_TYPES } from "../core/node-helpers.ts";
import { useIsEditor, useRender } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
	applyBackground,
	applyBorder,
	applyBox,
	applyHover,
	createSheet,
	shadowToCss,
} from "../core/style-engine.ts";
import type {
	Action,
	Background,
	Border,
	Box,
	Hover,
	Length,
	Shadow,
} from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

type Justify =
	| "flex-start"
	| "center"
	| "flex-end"
	| "space-between"
	| "space-around";
type Align = "stretch" | "flex-start" | "center" | "flex-end";

export type ContainerProps = {
	display: Responsive<"flex" | "grid">;
	direction: Responsive<"column" | "row">;
	justify: Responsive<Justify>;
	align: Responsive<Align>;
	wrap: Responsive<boolean>;
	gap: Responsive<Length>;
	columns: Responsive<number>;
	htmlTag: "div" | "section" | "article" | "aside" | "nav" | "ul";
	action: Action;
	background: Background;
	border: Border;
	shadow: Shadow;
	hover: Hover;
	box: Box;
};

function ContainerView({
	id,
	props,
	children,
	rootRef,
}: NodeViewProps<ContainerProps>) {
	const isEditor = useIsEditor();
	const ctx = useRender();
	const Tag = props.htmlTag;
	const empty = !children || (Array.isArray(children) && children.length === 0);
	const link = actionLink(props.action, ctx);
	return (
		<Tag
			ref={rootRef as React.Ref<never>}
			className={nodeClassName(id, "pb-container", props.box)}
			data-pb-node={id}
			// clique no container inteiro é tratado pelo runtime (não aninha <a>)
			data-pb-href={link?.href}
			data-pb-target={link?.target}
			data-pb-modal={link?.["data-pb-modal"]}
		>
			{children}
			{isEditor && empty ? (
				<div className="pb-placeholder">Container vazio</div>
			) : null}
		</Tag>
	);
}

function ContainerSettings() {
	const display = useField<"flex" | "grid">("display");
	const isGrid = display.value === "grid";
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Layout">
						<SegmentedField
							path="display"
							label="Tipo"
							options={[
								{ value: "flex", label: "Flexível" },
								{ value: "grid", label: "Grade" },
							]}
						/>
						{isGrid ? (
							<NumberField path="columns" label="Colunas" min={1} max={12} />
						) : (
							<>
								<SegmentedField
									path="direction"
									label="Direção"
									options={[
										{ value: "column", label: "Vertical", icon: ArrowDown },
										{ value: "row", label: "Horizontal", icon: ArrowRight },
									]}
								/>
								<SegmentedField
									path="justify"
									label="Distribuição"
									options={[
										{
											value: "flex-start",
											label: "Início",
											icon: AlignHorizontalJustifyStart,
										},
										{
											value: "center",
											label: "Centro",
											icon: AlignHorizontalJustifyCenter,
										},
										{
											value: "flex-end",
											label: "Fim",
											icon: AlignHorizontalJustifyEnd,
										},
										{
											value: "space-between",
											label: "Espaçado",
											icon: AlignHorizontalSpaceBetween,
										},
									]}
								/>
								<SwitchField path="wrap" label="Quebrar linha" />
							</>
						)}
						<SegmentedField
							path="align"
							label="Alinhamento"
							options={[
								{ value: "stretch", label: "Esticar" },
								{ value: "flex-start", label: "Início" },
								{ value: "center", label: "Centro" },
								{ value: "flex-end", label: "Fim" },
							]}
						/>
						<NumberUnitField
							path="gap"
							label="Espaço entre itens"
							units={["px", "rem"]}
							max={120}
						/>
					</Group>
					<Group title="Link" defaultOpen={false}>
						<ActionField path="action" />
					</Group>
				</>
			}
			style={
				<>
					<Group title="Fundo">
						<BackgroundFields base="background" />
					</Group>
					<Group title="Borda" defaultOpen={false}>
						<BorderFields base="border" />
					</Group>
					<Group title="Sombra" defaultOpen={false}>
						<ShadowFields base="shadow" />
					</Group>
					<Group title="Hover" defaultOpen={false}>
						<HoverFields base="hover" withColor={false} />
					</Group>
				</>
			}
			advanced={
				<>
					<BoxFields />
					<Group title="HTML" defaultOpen={false}>
						<SelectField
							path="htmlTag"
							label="Tag"
							options={["div", "section", "article", "aside", "nav", "ul"].map(
								(t) => ({ value: t, label: t }),
							)}
						/>
					</Group>
				</>
			}
		/>
	);
}

const containerDefaults = (
	overrides: Partial<ContainerProps> = {},
): ContainerProps => ({
	display: responsive("flex"),
	direction: responsive("column"),
	justify: responsive("flex-start"),
	align: responsive("stretch"),
	wrap: responsive(false),
	gap: responsive("16px"),
	columns: responsive(2, undefined, 1),
	htmlTag: "div",
	action: { type: "none" },
	background: defaultBackground(),
	border: defaultBorder(),
	shadow: defaultShadow(),
	hover: defaultHover(),
	box: defaultBox({ width: responsive("100%") }),
	...overrides,
});

export const Container: ComponentDefinition<ContainerProps> = {
	type: "Container",
	displayName: "Container",
	category: "layout",
	icon: Square,
	isCanvas: true,
	inToolbox: true,
	defaults: containerDefaults(),
	rules: {
		canMoveIn: (incoming) =>
			incoming.every(
				(n) => !TOP_LEVEL_TYPES.has(n.data.name) && n.data.name !== "Page",
			),
	},
	View: ContainerView,
	css: (id, p) => {
		const sheet = createSheet(id);
		const root = sheet.root();
		root
			.set("display", p.display)
			.set("flex-direction", p.direction)
			.set("justify-content", p.justify)
			.set("align-items", p.align)
			.set("flex-wrap", p.wrap, (v) => (v ? "wrap" : "nowrap"))
			.set("gap", p.gap)
			.set(
				"grid-template-columns",
				p.columns,
				(n) => `repeat(${n}, minmax(0, 1fr))`,
			)
			.set("position", "relative")
			.set("list-style", p.htmlTag === "ul" ? "none" : undefined)
			.set("box-shadow", shadowToCss(p.shadow))
			.set("cursor", p.action.type !== "none" ? "pointer" : undefined);
		applyBackground(root, p.background);
		applyBorder(root, p.border);
		applyHover(sheet, p.hover);
		applyBox(sheet, p.box, "flex");
		// em linha, cada filho divide o espaço; em grade, a grade cuida disso
		sheet.rule(" > *").set("min-width", "0");
		return sheet.toString();
	},
	Settings: ContainerSettings,
};

/** Variações prontas oferecidas na Toolbox. */
export const containerPresets = {
	stack: containerDefaults(),
	row: containerDefaults({
		direction: responsive("row", undefined, "column"),
		align: responsive("center"),
	}),
	grid: (columns: number) =>
		containerDefaults({
			display: responsive("grid"),
			columns: responsive(columns, columns > 2 ? 2 : undefined, 1),
			gap: responsive("24px"),
		}),
};

export const ContainerIcons = { Columns3, Rows3 };
