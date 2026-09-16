import {
	AlignHorizontalJustifyCenter,
	AlignHorizontalJustifyEnd,
	AlignHorizontalJustifyStart,
	AlignHorizontalSpaceBetween,
	ArrowDown,
	ArrowRight,
	PanelTop,
} from "lucide-react";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
	BackgroundFields,
	BoxFields,
	ShadowFields,
	SidesField,
} from "../controls/groups.tsx";
import {
	NumberUnitField,
	SegmentedField,
	SwitchField,
} from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import {
	defaultBackground,
	defaultBox,
	defaultShadow,
	sides,
} from "../core/defaults.ts";
import { nodeClassName, TOP_LEVEL_TYPES } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
	applyBackground,
	applyBox,
	createSheet,
	shadowToCss,
	sidesToCss,
} from "../core/style-engine.ts";
import type {
	Background,
	Box,
	Length,
	Shadow,
	Sides,
} from "../core/style-types.ts";
import { C } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

type Justify =
	| "flex-start"
	| "center"
	| "flex-end"
	| "space-between"
	| "space-around";
type Align = "stretch" | "flex-start" | "center" | "flex-end";

export type HeaderProps = {
	direction: Responsive<"row" | "column">;
	justify: Responsive<Justify>;
	align: Responsive<Align>;
	gap: Responsive<Length>;
	wrap: Responsive<boolean>;
	fullWidth: boolean;
	minHeight: Responsive<Length>;
	padding: Responsive<Sides>;
	background: Background;
	borderBottom: boolean;
	borderColor: string;
	shadow: Shadow;

	/** Fica preso no topo ao rolar a página. */
	sticky: boolean;
	/** Sobreposto à primeira seção, sem fundo até rolar a página. */
	transparent: boolean;
	/** Fundo do cabeçalho transparente depois de rolar (só fixo). */
	scrolledBackground: string;
	/** Cor dos links, do logo em texto e do ícone do menu depois de rolar. */
	scrolledTextColor: string;
	shadowOnScroll: boolean;
	/** Esconde ao rolar para baixo e volta ao rolar para cima (só fixo). */
	hideOnScrollDown: boolean;
	/** Reduz o espaço interno vertical depois de rolar (só fixo). */
	shrinkOnScroll: boolean;
	shrinkPadding: Length;

	box: Box;
};

const BADGES_STYLE: React.CSSProperties = {
	position: "absolute",
	top: 4,
	left: 4,
	zIndex: 5,
	display: "flex",
	gap: 4,
	pointerEvents: "none",
};
const BADGE_STYLE: React.CSSProperties = {
	padding: "2px 6px",
	borderRadius: 4,
	background: "#2563eb",
	color: "#ffffff",
	font: "600 10px/1.4 Inter,system-ui,sans-serif",
	letterSpacing: 0,
	textTransform: "none",
};

function HeaderView({
	id,
	props,
	children,
	rootRef,
}: NodeViewProps<HeaderProps>) {
	const isEditor = useIsEditor();
	const empty = !children || (Array.isArray(children) && children.length === 0);
	const badges = isEditor
		? [
				props.sticky ? "Fixo ao rolar" : null,
				props.transparent ? "Transparente" : null,
				props.sticky && props.hideOnScrollDown ? "Some ao rolar" : null,
			].filter((b): b is string => Boolean(b))
		: [];
	return (
		<header
			ref={rootRef as React.Ref<HTMLElement>}
			className={nodeClassName(id, "pb-header", props.box)}
			data-pb-node={id}
			data-pb-header=""
			// comportamentos de rolagem só na página publicada: no editor o
			// cabeçalho fica no fluxo normal para ser editável
			data-pb-live={isEditor ? undefined : ""}
			data-pb-hide-on-scroll={
				!isEditor && props.sticky && props.hideOnScrollDown ? "" : undefined
			}
		>
			{props.box.anchorId ? (
				<span id={props.box.anchorId} className="pb-anchor" />
			) : null}
			{badges.length > 0 ? (
				<div style={BADGES_STYLE}>
					{badges.map((b) => (
						<span key={b} style={BADGE_STYLE}>
							{b}
						</span>
					))}
				</div>
			) : null}
			<div className="pb-header-inner">
				{children}
				{isEditor && empty ? (
					<div className="pb-placeholder">
						Arraste Logo, Menu e Botão para cá
					</div>
				) : null}
			</div>
		</header>
	);
}

function HeaderSettings() {
	const sticky = useField<boolean>("sticky");
	const transparent = useField<boolean>("transparent");
	const shrink = useField<boolean>("shrinkOnScroll");
	const border = useField<boolean>("borderBottom");
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Layout">
						<SwitchField path="fullWidth" label="Conteúdo em largura total" />
						<SegmentedField
							path="direction"
							label="Direção"
							options={[
								{ value: "row", label: "Horizontal", icon: ArrowRight },
								{ value: "column", label: "Vertical", icon: ArrowDown },
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
						<SwitchField path="wrap" label="Quebrar linha" />
						<NumberUnitField
							path="gap"
							label="Espaço entre elementos"
							units={["px", "rem"]}
							max={120}
						/>
						<NumberUnitField
							path="minHeight"
							label="Altura mínima"
							units={["px"]}
							max={240}
						/>
						<SidesField
							path="padding"
							label="Espaço interno"
							units={["px", "%", "rem"]}
						/>
					</Group>
					<Group title="Ao rolar a página">
						<SwitchField path="sticky" label="Fixo no topo" />
						<SwitchField
							path="transparent"
							label="Transparente sobre a 1ª seção"
							hint="No editor o cabeçalho aparece com o fundo normal."
						/>
						{sticky.value ? (
							<>
								{transparent.value ? (
									<>
										<ColorField
											path="scrolledBackground"
											label="Fundo depois de rolar"
											allowEmpty
										/>
										<ColorField
											path="scrolledTextColor"
											label="Texto depois de rolar"
											allowEmpty
										/>
									</>
								) : null}
								<SwitchField path="shadowOnScroll" label="Sombra ao rolar" />
								<SwitchField
									path="hideOnScrollDown"
									label="Esconder ao rolar para baixo"
								/>
								<SwitchField path="shrinkOnScroll" label="Diminuir ao rolar" />
								{shrink.value ? (
									<NumberUnitField
										path="shrinkPadding"
										label="Espaço vertical ao rolar"
										units={["px"]}
										max={60}
									/>
								) : null}
							</>
						) : null}
					</Group>
				</>
			}
			style={
				<>
					<Group title="Fundo">
						<BackgroundFields base="background" />
					</Group>
					<Group title="Borda e sombra" defaultOpen={false}>
						<SwitchField path="borderBottom" label="Linha inferior" />
						{border.value ? (
							<ColorField path="borderColor" label="Cor da linha" />
						) : null}
						<ShadowFields base="shadow" />
					</Group>
				</>
			}
			advanced={<BoxFields withSize={false} />}
		/>
	);
}

function headerCss(id: string, p: HeaderProps): string {
	const sheet = createSheet(id);
	const root = sheet.root();
	root
		.set("position", "relative")
		.set("z-index", "40")
		.set("display", "block")
		.set("width", "100%")
		.set("padding", p.padding, sidesToCss)
		.set(
			"border-bottom",
			p.borderBottom ? `1px solid ${p.borderColor}` : undefined,
		)
		.set("box-shadow", shadowToCss(p.shadow))
		.set(
			"transition",
			"background-color .3s ease,box-shadow .3s ease,padding .3s ease,transform .3s ease",
		);
	applyBackground(root, p.background);
	applyBox(
		sheet,
		{ ...p.box, padding: undefined, width: undefined, maxWidth: undefined },
		"block",
	);

	sheet
		.rule(" > .pb-header-inner")
		.set("position", "relative")
		.set("display", "flex")
		.set("flex-direction", p.direction)
		.set("justify-content", p.justify)
		.set("align-items", p.align)
		.set("flex-wrap", p.wrap, (v) => (v ? "wrap" : "nowrap"))
		.set("gap", p.gap)
		.set("width", "100%")
		.set("max-width", p.fullWidth ? "none" : "var(--pb-content-width)")
		.set("min-height", p.minHeight, (v) => (v === "0px" ? undefined : v))
		.set("margin", "0 auto");

	// comportamentos de rolagem: só na página publicada ([data-pb-live])
	const live = sheet.rule("[data-pb-live]");
	const scrolled = sheet.rule("[data-pb-live].pb-scrolled");
	if (p.transparent) {
		live
			.set("position", p.sticky ? "fixed" : "absolute")
			.set("top", "0")
			.set("left", "0")
			.set("right", "0")
			.set("z-index", "50")
			.set("background", "transparent")
			.set("border-bottom-color", "transparent")
			.set("box-shadow", "none");
		if (p.sticky) {
			scrolled
				.set("background", p.scrolledBackground || undefined)
				.set("border-bottom-color", p.borderBottom ? p.borderColor : undefined);
			if (p.scrolledTextColor) {
				for (const sel of [
					" .pb-menu-list > .pb-menu-item > .pb-menu-link:not(:hover):not(.pb-active)",
					" .pb-menu-toggle",
					" .pb-logo",
				]) {
					sheet
						.rule(`[data-pb-live].pb-scrolled${sel}`)
						.set("color", p.scrolledTextColor);
				}
			}
		}
	} else if (p.sticky) {
		live.set("position", "sticky").set("top", "0").set("z-index", "50");
	}
	if (p.sticky) {
		if (p.shadowOnScroll)
			scrolled.set("box-shadow", "0 8px 24px -12px rgba(0,0,0,.25)");
		if (p.shrinkOnScroll)
			scrolled
				.set("padding-top", p.shrinkPadding)
				.set("padding-bottom", p.shrinkPadding);
		if (p.hideOnScrollDown)
			sheet
				.rule("[data-pb-live].pb-header-hidden")
				.set("transform", "translateY(-100%)");
	}
	return sheet.toString();
}

export const Header: ComponentDefinition<HeaderProps> = {
	type: "Header",
	displayName: "Cabeçalho",
	category: "structure",
	icon: PanelTop,
	isCanvas: true,
	notDuplicable: true,
	defaults: {
		direction: responsive("row"),
		justify: responsive("space-between"),
		align: responsive("center"),
		gap: responsive("32px", "24px", "16px"),
		wrap: responsive(false),
		fullWidth: false,
		minHeight: responsive("0px"),
		padding: responsive(
			sides("14px", "24px"),
			undefined,
			sides("10px", "16px"),
		),
		background: defaultBackground({ type: "color", color: C.background }),
		borderBottom: true,
		borderColor: C.border,
		shadow: defaultShadow(),

		sticky: true,
		transparent: false,
		scrolledBackground: C.background,
		scrolledTextColor: "",
		shadowOnScroll: true,
		hideOnScrollDown: false,
		shrinkOnScroll: false,
		shrinkPadding: "8px",

		box: defaultBox({
			width: responsive("100%"),
			maxWidth: responsive("none"),
		}),
	},
	rules: {
		canDrop: (target) => target.data.name === "Page",
		canMoveIn: (incoming) =>
			incoming.every(
				(n) => !TOP_LEVEL_TYPES.has(n.data.name) && n.data.name !== "Page",
			),
	},
	View: HeaderView,
	css: headerCss,
	Settings: HeaderSettings,
	runtime: ["header"],
};
