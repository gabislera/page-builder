import {
	AlignHorizontalJustifyCenter,
	AlignHorizontalJustifyEnd,
	AlignHorizontalJustifyStart,
	PanelTop,
} from "lucide-react";
import { useState } from "react";
import { ActionField } from "../controls/action.tsx";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
	BackgroundFields,
	BoxFields,
	MediaPathField,
	ShadowFields,
	SidesField,
	TypographyFields,
} from "../controls/groups.tsx";
import {
	NumberUnitField,
	SegmentedField,
	SelectField,
	SwitchField,
	TextField,
} from "../controls/inputs.tsx";
import { ListField, newItemId } from "../controls/list.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { actionLink } from "../core/actions.ts";
import {
	defaultBackground,
	defaultBox,
	defaultShadow,
	defaultTypography,
	sides,
} from "../core/defaults.ts";
import { nodeClassName } from "../core/node-helpers.ts";
import { useIsEditor, useRender } from "../core/render-context.tsx";
import {
	DEVICE_MEDIA,
	type Device,
	type Responsive,
	resolve,
	responsive,
} from "../core/responsive.ts";
import {
	applyBackground,
	applyBox,
	applyTypography,
	createSheet,
	fontStack,
	nodeSelector,
	shadowToCss,
	sidesToCss,
} from "../core/style-engine.ts";
import type {
	Action,
	Background,
	Box,
	Length,
	Shadow,
	Sides,
	Typography,
} from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import { InlineText, LogoView } from "./header-footer-shared.tsx";

export type HeaderNavItem = { id: string; text: string; action: Action };

export type HeaderButton = {
	id: string;
	text: string;
	action: Action;
	variant: "solid" | "outline";
	/** Fundo (sólido) ou cor da borda e do texto (contorno). */
	background: string;
	textColor: string;
	radius: Length;
};

export type HeaderProps = {
	logoSrc: string;
	logoAlt: string;
	/** Usado quando não há imagem. */
	logoText: string;
	logoWidth: Responsive<Length>;
	logoAction: Action;
	logoTypography: Typography;

	navItems: HeaderNavItem[];
	navAlign: Responsive<"flex-start" | "center" | "flex-end">;
	navGap: Responsive<Length>;
	navTypography: Typography;
	navHoverColor: string;

	buttons: HeaderButton[];
	buttonFontSize: Responsive<Length>;
	buttonFontWeight: string;
	buttonPadding: Responsive<Sides>;

	fullWidth: boolean;
	padding: Responsive<Sides>;
	gap: Responsive<Length>;
	minHeight: Responsive<Length>;
	background: Background;
	borderBottom: boolean;
	borderColor: string;
	shadow: Shadow;

	/** Fica preso no topo ao rolar a página. */
	fixedOnScroll: boolean;
	/** Sombra quando a página já rolou (só com fixedOnScroll). */
	scrolledShadow: boolean;

	/** A partir de qual dispositivo o menu vira hambúrguer. */
	collapseOn: "tablet" | "mobile";
	menuBackground: string;
	menuTextColor: string;
	toggleColor: string;

	box: Box;
};

function HeaderView({
	id,
	props,
	rootRef,
	onPropChange,
}: NodeViewProps<HeaderProps>) {
	const ctx = useRender();
	const isEditor = useIsEditor();
	// no editor não há runtime: o hambúrguer abre com estado local
	const [open, setOpen] = useState(false);
	const commit = (path: string) =>
		onPropChange && ((v: string) => onPropChange(path, v));

	const className = [
		nodeClassName(id, "pb-header", props.box),
		isEditor && open ? "pb-menu-open" : null,
	]
		.filter(Boolean)
		.join(" ");

	const hasPanel = props.navItems.length > 0 || props.buttons.length > 0;

	return (
		<header
			ref={rootRef as React.Ref<HTMLElement>}
			className={className}
			data-pb-node={id}
			data-pb-header=""
			data-pb-sticky={props.fixedOnScroll ? "" : undefined}
		>
			{props.box.anchorId ? (
				<span id={props.box.anchorId} className="pb-anchor" />
			) : null}
			<div className="pb-header-inner">
				<LogoView
					src={props.logoSrc}
					alt={props.logoAlt}
					text={props.logoText}
					action={props.logoAction}
					onTextChange={commit("logoText")}
				/>
				{hasPanel ? (
					<>
						<div className="pb-header-panel">
							{props.navItems.length > 0 ? (
								<nav className="pb-header-nav" aria-label="Menu principal">
									{props.navItems.map((item, i) => {
										const link = actionLink(item.action, ctx);
										return (
											<a
												key={item.id}
												className="pb-header-link"
												{...(link ?? { href: "#" })}
											>
												<InlineText
													value={item.text}
													onCommit={commit(`navItems.${i}.text`)}
												/>
											</a>
										);
									})}
								</nav>
							) : null}
							{props.buttons.length > 0 ? (
								<div className="pb-header-actions">
									{props.buttons.map((btn, i) => {
										const link = actionLink(btn.action, ctx);
										return (
											<a
												key={btn.id}
												className={`pb-header-btn pb-header-btn-${i}`}
												{...(link ?? { href: "#" })}
											>
												<InlineText
													value={btn.text}
													onCommit={commit(`buttons.${i}.text`)}
												/>
											</a>
										);
									})}
								</div>
							) : null}
						</div>
						<button
							type="button"
							className="pb-header-toggle"
							data-pb-menu-toggle=""
							aria-label="Abrir menu"
							aria-expanded={isEditor ? open : false}
							onClick={isEditor ? () => setOpen((v) => !v) : undefined}
						>
							<span />
							<span />
							<span />
						</button>
					</>
				) : null}
			</div>
		</header>
	);
}

/* ------------------------------------------------------------------ */
/* Configurações                                                       */
/* ------------------------------------------------------------------ */

const NO_ACTION: Action = { type: "none" };

function HeaderSettings() {
	const fixed = useField<boolean>("fixedOnScroll");
	const border = useField<boolean>("borderBottom");
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Logo">
						<MediaPathField
							path="logoSrc"
							label="Imagem"
							accept="image"
							hint="Sem imagem, o texto da marca é exibido."
						/>
						<TextField path="logoAlt" label="Texto alternativo (SEO)" />
						<TextField path="logoText" label="Texto da marca" />
						<ActionField path="logoAction" label="Link do logo" />
					</Group>
					<Group title="Menu">
						<ListField<HeaderNavItem>
							path="navItems"
							label="Links"
							addLabel="Adicionar link"
							max={10}
							create={() => ({
								id: newItemId(),
								text: "Novo link",
								action: { type: "section", sectionId: "" },
							})}
							itemLabel={(item) => item.text}
							renderItem={(itemPath) => (
								<>
									<TextField path={`${itemPath}.text`} label="Texto" />
									<ActionField path={`${itemPath}.action`} />
								</>
							)}
						/>
					</Group>
					<Group title="Botões">
						<ListField<HeaderButton>
							path="buttons"
							label="Botões (até 2)"
							addLabel="Adicionar botão"
							max={2}
							create={() => ({
								id: newItemId(),
								text: "Saiba mais",
								action: { type: "url", url: "", newTab: false },
								variant: "outline",
								background: "#2563eb",
								textColor: "#ffffff",
								radius: "8px",
							})}
							itemLabel={(item) => item.text}
							renderItem={(itemPath) => (
								<>
									<TextField path={`${itemPath}.text`} label="Texto" />
									<ActionField path={`${itemPath}.action`} />
									<SegmentedField
										path={`${itemPath}.variant`}
										label="Estilo"
										options={[
											{ value: "solid", label: "Sólido" },
											{ value: "outline", label: "Contorno" },
										]}
									/>
									<ColorField
										path={`${itemPath}.background`}
										label="Cor principal"
									/>
									<ColorField
										path={`${itemPath}.textColor`}
										label="Cor do texto"
									/>
									<NumberUnitField
										path={`${itemPath}.radius`}
										label="Arredondamento"
										units={["px"]}
										max={40}
									/>
								</>
							)}
						/>
					</Group>
					<Group title="Comportamento">
						<SwitchField path="fixedOnScroll" label="Fixo no topo ao rolar" />
						{fixed.value ? (
							<SwitchField path="scrolledShadow" label="Sombra ao rolar" />
						) : null}
						<SegmentedField
							path="collapseOn"
							label="Menu hambúrguer em"
							options={[
								{ value: "mobile", label: "Celular" },
								{ value: "tablet", label: "Tablet e celular" },
							]}
						/>
					</Group>
				</>
			}
			style={
				<>
					<Group title="Layout">
						<SwitchField path="fullWidth" label="Conteúdo em largura total" />
						<SegmentedField
							path="navAlign"
							label="Alinhamento do menu"
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
							]}
						/>
						<NumberUnitField
							path="logoWidth"
							label="Largura do logo"
							units={["px"]}
							max={400}
						/>
						<NumberUnitField
							path="gap"
							label="Espaço entre blocos"
							units={["px", "rem"]}
							max={120}
						/>
						<NumberUnitField
							path="navGap"
							label="Espaço entre links"
							units={["px", "rem"]}
							max={80}
						/>
						<NumberUnitField
							path="minHeight"
							label="Altura mínima"
							units={["px"]}
							max={200}
						/>
						<SidesField
							path="padding"
							label="Espaço interno"
							units={["px", "%", "rem"]}
						/>
					</Group>
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
					<Group title="Logo em texto" defaultOpen={false}>
						<TypographyFields base="logoTypography" withAlign={false} />
					</Group>
					<Group title="Links do menu">
						<TypographyFields base="navTypography" withAlign={false} />
						<ColorField
							path="navHoverColor"
							label="Cor ao passar o mouse"
							allowEmpty
						/>
					</Group>
					<Group title="Botões" defaultOpen={false}>
						<NumberUnitField
							path="buttonFontSize"
							label="Tamanho da fonte"
							units={["px", "rem"]}
							max={32}
						/>
						<SelectField
							path="buttonFontWeight"
							label="Peso da fonte"
							options={[
								{ value: "400", label: "Normal (400)" },
								{ value: "500", label: "Médio (500)" },
								{ value: "600", label: "Semi-negrito (600)" },
								{ value: "700", label: "Negrito (700)" },
								{ value: "800", label: "Extra-negrito (800)" },
							]}
						/>
						<SidesField
							path="buttonPadding"
							label="Espaço interno"
							units={["px", "em"]}
						/>
					</Group>
					<Group title="Menu no celular" defaultOpen={false}>
						<ColorField path="menuBackground" label="Fundo do menu" />
						<ColorField path="menuTextColor" label="Cor dos links" allowEmpty />
						<ColorField path="toggleColor" label="Cor do ícone" />
					</Group>
				</>
			}
			advanced={<BoxFields withSize={false} />}
		/>
	);
}

/* ------------------------------------------------------------------ */
/* CSS                                                                 */
/* ------------------------------------------------------------------ */

/** Dispositivos em que o menu fica recolhido no hambúrguer. */
const collapsedDevices = (on: HeaderProps["collapseOn"]): Device[] =>
	on === "tablet" ? ["tablet", "mobile"] : ["mobile"];

function headerCss(id: string, p: HeaderProps): string {
	const S = nodeSelector(id);
	const sheet = createSheet(id);
	const root = sheet.root();
	root
		.set("display", "block")
		.set("position", p.fixedOnScroll ? "sticky" : "relative")
		.set("top", p.fixedOnScroll ? "0" : undefined)
		.set("z-index", p.fixedOnScroll ? "50" : "40")
		.set("width", "100%")
		.set("padding", p.padding, sidesToCss)
		.set(
			"border-bottom",
			p.borderBottom ? `1px solid ${p.borderColor}` : undefined,
		)
		.set("box-shadow", shadowToCss(p.shadow))
		.set("transition", "box-shadow .25s ease");
	applyBackground(root, p.background);
	applyBox(
		sheet,
		{ ...p.box, padding: undefined, width: undefined, maxWidth: undefined },
		"block",
	);

	if (p.fixedOnScroll && p.scrolledShadow) {
		sheet
			.rule(".pb-scrolled")
			.set("box-shadow", "0 8px 24px -12px rgba(0,0,0,.25)");
	}

	sheet
		.rule(" .pb-header-inner")
		.set("display", "flex")
		.set("align-items", "center")
		.set("gap", p.gap)
		.set("width", "100%")
		.set("max-width", p.fullWidth ? "none" : "var(--pb-content-width)")
		.set("min-height", p.minHeight, (v) => (v === "0px" ? undefined : v))
		.set("margin", "0 auto");

	// logo
	const logo = sheet.rule(" .pb-logo");
	logo
		.set("display", "inline-flex")
		.set("align-items", "center")
		.set("flex-shrink", "0");
	applyTypography(logo, p.logoTypography);
	sheet
		.rule(" .pb-logo img")
		.set("width", p.logoWidth)
		.set("max-width", "100%")
		.set("height", "auto");

	// menu
	sheet
		.rule(" .pb-header-panel")
		.set("display", "flex")
		.set("align-items", "center")
		.set("flex", "1")
		.set("min-width", "0")
		.set("gap", p.gap);
	sheet
		.rule(" .pb-header-nav")
		.set("display", "flex")
		.set("flex", "1")
		.set("flex-wrap", "wrap")
		.set("align-items", "center")
		.set("justify-content", p.navAlign)
		.set("gap", p.navGap);
	const link = sheet.rule(" .pb-header-link");
	link.set("transition", "color .2s ease");
	applyTypography(link, p.navTypography);
	sheet.rule(" .pb-header-link:hover").set("color", p.navHoverColor);

	// botões
	sheet
		.rule(" .pb-header-actions")
		.set("display", "flex")
		.set("align-items", "center")
		.set("gap", "12px")
		.set("flex-shrink", "0")
		.set("margin-left", "auto");
	sheet
		.rule(" .pb-header-btn")
		.set("display", "inline-flex")
		.set("align-items", "center")
		.set("justify-content", "center")
		.set("white-space", "nowrap")
		.set("border", "2px solid transparent")
		.set("font-family", p.navTypography.fontFamily, (v) =>
			v ? fontStack(v) : undefined,
		)
		.set("font-size", p.buttonFontSize)
		.set("font-weight", p.buttonFontWeight)
		.set("line-height", "1.2")
		.set("padding", p.buttonPadding, sidesToCss)
		.set(
			"transition",
			"background-color .2s ease,color .2s ease,filter .2s ease,transform .2s ease",
		);
	sheet.rule(" .pb-header-btn:hover").set("transform", "translateY(-1px)");
	p.buttons.forEach((b, i) => {
		const rule = sheet.rule(` .pb-header-btn-${i}`);
		rule.set("border-radius", b.radius).set("border-color", b.background);
		if (b.variant === "solid") {
			rule.set("background-color", b.background).set("color", b.textColor);
			sheet.rule(` .pb-header-btn-${i}:hover`).set("filter", "brightness(.92)");
		} else {
			rule.set("background-color", "transparent").set("color", b.background);
			sheet
				.rule(` .pb-header-btn-${i}:hover`)
				.set("background-color", b.background)
				.set("color", b.textColor);
		}
	});

	// hambúrguer
	sheet
		.rule(" .pb-header-toggle")
		.set("align-items", "center")
		.set("justify-content", "center")
		.set("flex-direction", "column")
		.set("gap", "5px")
		.set("width", "40px")
		.set("height", "40px")
		.set("margin-left", "auto")
		.set("padding", "0")
		.set("border", "0")
		.set("background", "transparent")
		.set("cursor", "pointer")
		.set("color", p.toggleColor)
		.set("flex-shrink", "0");
	sheet
		.rule(" .pb-header-toggle span")
		.set("display", "block")
		.set("width", "22px")
		.set("height", "2px")
		.set("border-radius", "2px")
		.set("background", "currentColor")
		.set("transition", "transform .25s ease,opacity .2s ease");

	// padding lateral do menu recolhido acompanha o do cabeçalho
	const panel = sheet.rule(" .pb-header-panel");
	for (const device of collapsedDevices(p.collapseOn)) {
		const pad = resolve(p.padding, device);
		panel.setOn(device, "padding", `8px ${pad.right} 24px ${pad.left}`);
	}

	// menu recolhido: hambúrguer visível e navegação num painel abaixo do cabeçalho
	const media = DEVICE_MEDIA[p.collapseOn];
	const menuColor = p.menuTextColor ? `color:${p.menuTextColor};` : "";
	const collapsed = [
		`${S} .pb-header-toggle{display:inline-flex}`,
		`${S} .pb-header-panel{position:absolute;top:100%;left:0;right:0;flex-direction:column;align-items:stretch;gap:16px;background:${p.menuBackground};box-shadow:0 18px 32px -16px rgba(0,0,0,.25);border-top:1px solid rgba(127,127,127,.15);max-height:80vh;overflow-y:auto;visibility:hidden;opacity:0;transform:translateY(-8px);pointer-events:none;transition:opacity .2s ease,transform .2s ease,visibility 0s linear .2s}`,
		`${S}.pb-menu-open .pb-header-panel{visibility:visible;opacity:1;transform:none;pointer-events:auto;transition:opacity .2s ease,transform .2s ease}`,
		`${S} .pb-header-nav{flex-direction:column;align-items:stretch;gap:0}`,
		`${S} .pb-header-link{display:block;padding:14px 0;border-bottom:1px solid rgba(127,127,127,.15);${menuColor}}`,
		`${S} .pb-header-actions{flex-direction:column;align-items:stretch;margin-left:0}`,
		`${S} .pb-header-btn{width:100%;padding-top:14px;padding-bottom:14px}`,
		`${S}.pb-menu-open .pb-header-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg)}`,
		`${S}.pb-menu-open .pb-header-toggle span:nth-child(2){opacity:0}`,
		`${S}.pb-menu-open .pb-header-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}`,
	].join("");

	return `${S} .pb-header-toggle{display:none}${sheet.toString()}@media ${media}{${collapsed}}`;
}

export const Header: ComponentDefinition<HeaderProps> = {
	type: "Header",
	displayName: "Cabeçalho",
	category: "structure",
	icon: PanelTop,
	notDuplicable: true,
	defaults: {
		logoSrc: "",
		logoAlt: "",
		logoText: "Sua marca",
		logoWidth: responsive("140px", undefined, "120px"),
		logoAction: NO_ACTION,
		logoTypography: defaultTypography({
			fontSize: responsive("22px", undefined, "20px"),
			fontWeight: "800",
			lineHeight: responsive("1.2"),
			letterSpacing: responsive("-0.5px"),
			color: "#18181b",
		}),

		navItems: [
			{
				id: "nav-inicio",
				text: "Início",
				action: { type: "section", sectionId: "" },
			},
			{
				id: "nav-beneficios",
				text: "Benefícios",
				action: { type: "section", sectionId: "" },
			},
			{
				id: "nav-contato",
				text: "Contato",
				action: { type: "section", sectionId: "" },
			},
		],
		navAlign: responsive("center"),
		navGap: responsive("32px", "24px"),
		navTypography: defaultTypography({
			fontSize: responsive("15px"),
			fontWeight: "500",
			lineHeight: responsive("1.4"),
			color: "#3f3f46",
		}),
		navHoverColor: "#2563eb",

		buttons: [
			{
				id: "btn-comprar",
				text: "Comprar agora",
				action: { type: "url", url: "", newTab: false },
				variant: "solid",
				background: "#2563eb",
				textColor: "#ffffff",
				radius: "10px",
			},
		],
		buttonFontSize: responsive("15px"),
		buttonFontWeight: "600",
		buttonPadding: responsive(sides("10px", "20px")),

		fullWidth: false,
		padding: responsive(
			sides("14px", "24px"),
			undefined,
			sides("10px", "16px"),
		),
		gap: responsive("32px", "24px"),
		minHeight: responsive("0px"),
		background: defaultBackground({ type: "color", color: "#ffffff" }),
		borderBottom: true,
		borderColor: "#f0f0f2",
		shadow: defaultShadow(),

		fixedOnScroll: true,
		scrolledShadow: true,

		collapseOn: "mobile",
		menuBackground: "#ffffff",
		menuTextColor: "",
		toggleColor: "#18181b",

		box: defaultBox({
			width: responsive("100%"),
			maxWidth: responsive("none"),
		}),
	},
	rules: {
		canDrop: (target) => target.data.name === "Page",
	},
	View: HeaderView,
	css: headerCss,
	Settings: HeaderSettings,
	runtime: ["header"],
	fonts: (p) => [p.logoTypography.fontFamily, p.navTypography.fontFamily],
};
