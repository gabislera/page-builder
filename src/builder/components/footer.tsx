import { PanelBottom } from "lucide-react";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
	BackgroundFields,
	BorderFields,
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
import {
	defaultBackground,
	defaultBorder,
	defaultBox,
	defaultShadow,
	sides,
} from "../core/defaults.ts";
import { nodeClassName, TOP_LEVEL_TYPES } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
	applyBackground,
	applyBorder,
	applyBox,
	createSheet,
	shadowToCss,
	sidesToCss,
} from "../core/style-engine.ts";
import type {
	Background,
	Border,
	Box,
	Length,
	Shadow,
	Sides,
} from "../core/style-types.ts";
import { C } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type FooterProps = {
	fullWidth: boolean;
	padding: Responsive<Sides>;
	gap: Responsive<Length>;
	minHeight: Responsive<Length>;
	alignItems: Responsive<"stretch" | "flex-start" | "center" | "flex-end">;
	/** Cor herdada pelos elementos que usam "cor do texto" (`color`). */
	textColor: string;
	background: Background;
	border: Border;
	shadow: Shadow;
	box: Box;
};

function FooterView({
	id,
	props,
	children,
	rootRef,
}: NodeViewProps<FooterProps>) {
	const isEditor = useIsEditor();
	const empty = !children || (Array.isArray(children) && children.length === 0);
	return (
		<footer
			ref={rootRef as React.Ref<HTMLElement>}
			className={nodeClassName(id, "pb-footer", props.box)}
			data-pb-node={id}
		>
			{props.box.anchorId ? (
				<span id={props.box.anchorId} className="pb-anchor" />
			) : null}
			<div className="pb-footer-inner">
				{children}
				{isEditor && empty ? (
					<div className="pb-placeholder">
						Arraste colunas, textos e menus para cá
					</div>
				) : null}
			</div>
		</footer>
	);
}

function FooterSettings() {
	return (
		<SettingsTabs
			content={
				<Group title="Layout">
					<SwitchField path="fullWidth" label="Conteúdo em largura total" />
					<SegmentedField
						path="alignItems"
						label="Alinhamento dos elementos"
						options={[
							{ value: "stretch", label: "Esticar" },
							{ value: "flex-start", label: "Início" },
							{ value: "center", label: "Centro" },
							{ value: "flex-end", label: "Fim" },
						]}
					/>
					<NumberUnitField
						path="gap"
						label="Espaço entre elementos"
						units={["px", "rem"]}
						max={120}
					/>
					<NumberUnitField
						path="minHeight"
						label="Altura mínima"
						units={["px", "vh"]}
						max={800}
					/>
					<SidesField
						path="padding"
						label="Espaço interno"
						units={["px", "%", "rem"]}
					/>
				</Group>
			}
			style={
				<>
					<Group title="Cores">
						<ColorField path="textColor" label="Cor do texto" allowEmpty />
					</Group>
					<Group title="Fundo">
						<BackgroundFields base="background" />
					</Group>
					<Group title="Borda" defaultOpen={false}>
						<BorderFields base="border" />
					</Group>
					<Group title="Sombra" defaultOpen={false}>
						<ShadowFields base="shadow" />
					</Group>
				</>
			}
			advanced={<BoxFields withSize={false} />}
		/>
	);
}

export const Footer: ComponentDefinition<FooterProps> = {
	type: "Footer",
	displayName: "Rodapé",
	category: "structure",
	icon: PanelBottom,
	isCanvas: true,
	notDuplicable: true,
	defaults: {
		fullWidth: false,
		padding: responsive(
			sides("64px", "24px", "32px"),
			undefined,
			sides("48px", "16px", "24px"),
		),
		gap: responsive("32px", undefined, "24px"),
		minHeight: responsive("0px"),
		alignItems: responsive("stretch"),
		textColor: "#ffffff",
		background: defaultBackground({ type: "color", color: C.secondary }),
		border: defaultBorder(),
		shadow: defaultShadow(),
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
	View: FooterView,
	css: (id, p) => {
		const sheet = createSheet(id);
		const root = sheet.root();
		root
			.set("position", "relative")
			.set("display", "flex")
			.set("flex-direction", "column")
			.set("width", "100%")
			.set("padding", p.padding, sidesToCss)
			.set("min-height", p.minHeight, (v) => (v === "0px" ? undefined : v))
			.set("color", p.textColor || undefined)
			.set("box-shadow", shadowToCss(p.shadow));
		applyBackground(root, p.background);
		applyBorder(root, p.border);
		applyBox(
			sheet,
			{ ...p.box, padding: undefined, width: undefined, maxWidth: undefined },
			"flex",
		);
		sheet
			.rule(" > .pb-footer-inner")
			.set("position", "relative")
			.set("display", "flex")
			.set("flex-direction", "column")
			.set("width", "100%")
			.set("max-width", p.fullWidth ? "none" : "var(--pb-content-width)")
			.set("margin", "0 auto")
			.set("gap", p.gap)
			.set("align-items", p.alignItems);
		return sheet.toString();
	},
	Settings: FooterSettings,
};
