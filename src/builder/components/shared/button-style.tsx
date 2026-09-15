/**
 * Estilo de botão embutido em outro componente (enviar do formulário, gatilho
 * do modal). Mesmas opções do componente Botão, aplicadas a um seletor interno.
 */
import { Group } from "../../controls/field.tsx";
import {
	BackgroundFields,
	BorderFields,
	HoverFields,
	ShadowFields,
	SidesField,
	TypographyFields,
} from "../../controls/groups.tsx";
import { SwitchField } from "../../controls/inputs.tsx";
import {
	corners,
	defaultBackground,
	defaultBorder,
	defaultHover,
	defaultShadow,
	defaultTypography,
	sides,
} from "../../core/defaults.ts";
import { type Responsive, responsive } from "../../core/responsive.ts";
import {
	applyBackground,
	applyBorder,
	applyHover,
	applyTypography,
	nodeSelector,
	StyleSheet,
	shadowToCss,
	sidesToCss,
} from "../../core/style-engine.ts";
import type {
	Background,
	Border,
	Hover,
	Shadow,
	Sides,
	Typography,
} from "../../core/style-types.ts";

export type ButtonStyle = {
	fullWidth: Responsive<boolean>;
	padding: Responsive<Sides>;
	typography: Typography;
	background: Background;
	border: Border;
	shadow: Shadow;
	hover: Hover;
};

export const defaultButtonStyle = (
	overrides: Partial<ButtonStyle> = {},
): ButtonStyle => ({
	fullWidth: responsive(false, undefined, true),
	padding: responsive(sides("16px", "32px")),
	typography: defaultTypography({
		fontSize: responsive("17px", undefined, "16px"),
		fontWeight: "600",
		lineHeight: responsive("1.2"),
		textAlign: responsive("center"),
		color: "#ffffff",
	}),
	background: defaultBackground({ type: "color", color: "#2563eb" }),
	border: defaultBorder({ radius: responsive(corners("10px")) }),
	shadow: defaultShadow({ enabled: true, y: 8, blur: 20, color: "#2563eb40" }),
	hover: defaultHover({ enabled: true, background: "#1d4ed8", scale: 1.02 }),
	...overrides,
});

/** CSS do botão interno `selector` (ex.: ".pb-form-submit") do nó `id`. */
export function buttonStyleCss(id: string, selector: string, s: ButtonStyle) {
	const sheet = new StyleSheet(`${nodeSelector(id)} ${selector}`);
	const root = sheet.root();
	root
		.set("padding", s.padding, sidesToCss)
		.set("width", s.fullWidth, (v) => (v ? "100%" : "auto"))
		.set("box-shadow", shadowToCss(s.shadow));
	applyTypography(root, s.typography);
	applyBackground(root, s.background);
	applyBorder(root, s.border);
	applyHover(sheet, s.hover);
	sheet.rule(" svg").set("width", "1.1em").set("height", "1.1em");
	return sheet.toString();
}

/** Grupos da aba Estilo para um botão interno em `base`. */
export function ButtonStyleGroups({
	base,
	title = "Botão",
}: {
	base: string;
	title?: string;
}) {
	return (
		<>
			<Group title={`${title}: tamanho`} defaultOpen={false}>
				<SwitchField path={`${base}.fullWidth`} label="Largura total" />
				<SidesField
					path={`${base}.padding`}
					label="Espaço interno"
					units={["px", "em"]}
				/>
			</Group>
			<Group title={`${title}: tipografia`} defaultOpen={false}>
				<TypographyFields base={`${base}.typography`} withAlign={false} />
			</Group>
			<Group title={`${title}: fundo`} defaultOpen={false}>
				<BackgroundFields base={`${base}.background`} />
			</Group>
			<Group title={`${title}: borda e sombra`} defaultOpen={false}>
				<BorderFields base={`${base}.border`} />
				<ShadowFields base={`${base}.shadow`} />
			</Group>
			<Group title={`${title}: hover`} defaultOpen={false}>
				<HoverFields base={`${base}.hover`} />
			</Group>
		</>
	);
}
