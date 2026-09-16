import { MousePointerClick } from "lucide-react";
import { ActionField } from "../controls/action.tsx";
import { Group } from "../controls/field.tsx";
import {
	BackgroundFields,
	BorderFields,
	BoxFields,
	HoverFields,
	ShadowFields,
	SidesField,
	TypographyFields,
} from "../controls/groups.tsx";
import { IconField } from "../controls/icon.tsx";
import {
	NumberUnitField,
	SegmentedField,
	SwitchField,
	TextField,
} from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { actionLink } from "../core/actions.ts";
import {
	corners,
	defaultBackground,
	defaultBorder,
	defaultBox,
	defaultHover,
	defaultShadow,
	defaultTypography,
	sides,
} from "../core/defaults.ts";
import { IconView } from "../core/icons.tsx";
import { mergeRefs, useInlineEdit } from "../core/inline-edit.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useRender } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
	applyBackground,
	applyBorder,
	applyBox,
	applyHover,
	applyTypography,
	createSheet,
	shadowToCss,
	sidesToCss,
} from "../core/style-engine.ts";
import type {
	Action,
	Background,
	Border,
	Box,
	Hover,
	Length,
	Shadow,
	Sides,
	Typography,
} from "../core/style-types.ts";
import { C } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type ButtonProps = {
	text: string;
	icon: string;
	iconPosition: "left" | "right";
	iconSize: Length;
	action: Action;
	fullWidth: Responsive<boolean>;
	padding: Responsive<Sides>;
	typography: Typography;
	background: Background;
	border: Border;
	shadow: Shadow;
	hover: Hover;
	box: Box;
};

function ButtonView({
	id,
	props,
	rootRef,
	onPropChange,
}: NodeViewProps<ButtonProps>) {
	const ctx = useRender();
	const edit = useInlineEdit(
		props.text,
		onPropChange && ((v) => onPropChange("text", v)),
	);
	const link = actionLink(props.action, ctx);
	const icon = props.icon ? (
		<IconView name={props.icon} className="pb-btn-icon" />
	) : null;
	const label = (
		<span ref={edit.ref as React.Ref<HTMLSpanElement>} {...edit.attrs}>
			{edit.editing ? null : props.text}
		</span>
	);
	const content = (
		<>
			{props.iconPosition === "left" ? icon : null}
			{label}
			{props.iconPosition === "right" ? icon : null}
		</>
	);
	const className = nodeClassName(id, "pb-btn", props.box);
	if (link) {
		return (
			<a
				ref={mergeRefs(rootRef) as React.Ref<HTMLAnchorElement>}
				className={className}
				data-pb-node={id}
				{...link}
			>
				{content}
			</a>
		);
	}
	return (
		<button
			ref={rootRef as React.Ref<HTMLButtonElement>}
			type="button"
			className={className}
			data-pb-node={id}
		>
			{content}
		</button>
	);
}

function ButtonSettings() {
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Botão">
						<TextField path="text" label="Texto" />
						<IconField path="icon" label="Ícone" />
						<SegmentedField
							path="iconPosition"
							label="Posição do ícone"
							options={[
								{ value: "left", label: "Antes" },
								{ value: "right", label: "Depois" },
							]}
						/>
						<NumberUnitField
							path="iconSize"
							label="Tamanho do ícone"
							units={["px", "em"]}
							max={64}
						/>
					</Group>
					<Group title="Ao clicar">
						<ActionField path="action" label="Ação" />
					</Group>
				</>
			}
			style={
				<>
					<Group title="Tamanho">
						<SwitchField path="fullWidth" label="Largura total" />
						<SidesField
							path="padding"
							label="Espaço interno"
							units={["px", "em"]}
						/>
					</Group>
					<Group title="Tipografia">
						<TypographyFields base="typography" withAlign={false} />
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
					<Group title="Hover">
						<HoverFields base="hover" />
					</Group>
				</>
			}
			advanced={<BoxFields withSize={false} />}
		/>
	);
}

export const Button: ComponentDefinition<ButtonProps> = {
	type: "Button",
	displayName: "Botão",
	category: "basic",
	icon: MousePointerClick,
	inToolbox: true,
	defaults: {
		text: "Quero garantir minha vaga",
		icon: "arrow-right",
		iconPosition: "right",
		iconSize: "1.1em",
		action: { type: "url", url: "", newTab: false },
		fullWidth: responsive(false, undefined, true),
		padding: responsive(sides("16px", "32px")),
		typography: defaultTypography({
			fontSize: responsive("17px", undefined, "16px"),
			fontWeight: "600",
			lineHeight: responsive("1.2"),
			textAlign: responsive("center"),
			color: "#ffffff",
		}),
		background: defaultBackground({ type: "color", color: C.primary }),
		border: defaultBorder({ radius: responsive(corners("10px")) }),
		shadow: defaultShadow({
			enabled: true,
			y: 8,
			blur: 20,
			color: `color-mix(in srgb, ${C.primary} 25%, transparent)`,
		}),
		hover: defaultHover({
			enabled: true,
			background: `color-mix(in srgb, ${C.primary} 85%, black)`,
			scale: 1.02,
		}),
		box: defaultBox({ alignSelf: responsive("flex-start") }),
	},
	View: ButtonView,
	css: (id, p) => {
		const sheet = createSheet(id);
		const root = sheet.root();
		root
			.set("padding", p.padding, sidesToCss)
			.set("width", p.fullWidth, (v) => (v ? "100%" : "auto"))
			.set("box-shadow", shadowToCss(p.shadow));
		applyTypography(root, p.typography);
		applyBackground(root, p.background);
		applyBorder(root, p.border);
		applyHover(sheet, p.hover);
		applyBox(
			sheet,
			{ ...p.box, padding: undefined, width: undefined },
			"inline-flex",
		);
		sheet
			.rule(" .pb-btn-icon")
			.set("width", p.iconSize)
			.set("height", p.iconSize);
		return sheet.toString();
	},
	Settings: ButtonSettings,
	fonts: (p) => [p.typography.fontFamily],
};
