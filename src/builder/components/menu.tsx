import {
	AlignHorizontalJustifyCenter,
	AlignHorizontalJustifyEnd,
	AlignHorizontalJustifyStart,
	AlignHorizontalSpaceBetween,
	Menu as MenuIcon,
} from "lucide-react";
import { useState } from "react";
import { ActionField } from "../controls/action.tsx";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
	BoxFields,
	ShadowFields,
	SidesField,
	TypographyFields,
} from "../controls/groups.tsx";
import {
	NumberUnitField,
	SegmentedField,
	SelectField,
	TextField,
} from "../controls/inputs.tsx";
import { ListField, newItemId } from "../controls/list.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { actionLink } from "../core/actions.ts";
import {
	defaultBox,
	defaultShadow,
	defaultTypography,
	sides,
} from "../core/defaults.ts";
import { IconView } from "../core/icons.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useIsEditor, useRender } from "../core/render-context.tsx";
import {
	DEVICE_MEDIA,
	type Responsive,
	responsive,
} from "../core/responsive.ts";
import {
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
	Box,
	Length,
	Shadow,
	Sides,
	Typography,
} from "../core/style-types.ts";
import { C, FONT_BODY } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import { InlineText } from "./shared/inline-text.tsx";

export type MenuLink = { id: string; text: string; action: Action };
export type MenuItem = MenuLink & { children: MenuLink[] };

type MenuAlign = "flex-start" | "center" | "flex-end" | "space-between";

export type MenuProps = {
	items: MenuItem[];
	/** Vertical: lista empilhada (rodapés), nunca recolhe. */
	orientation: "horizontal" | "vertical";
	align: Responsive<MenuAlign>;
	gap: Responsive<Length>;
	itemPadding: Responsive<Sides>;
	typography: Typography;
	hoverColor: string;
	/** Link da página atual (marcado pelo runtime). */
	activeColor: string;
	indicator: "none" | "underline" | "background" | "overline";
	indicatorColor: string;
	itemRadius: Length;

	dropdownBackground: string;
	dropdownTextColor: string;
	dropdownHoverColor: string;
	dropdownHoverBackground: string;
	dropdownWidth: Length;
	dropdownRadius: Length;
	dropdownShadow: Shadow;

	/** A partir de qual dispositivo os links viram o botão hambúrguer. */
	collapseOn: "tablet" | "mobile" | "never";
	toggleColor: string;
	toggleSize: Length;
	panelLayout: "drawer" | "fullscreen";
	panelWidth: Length;
	panelBackground: string;
	panelTextColor: string;
	panelFontSize: Length;

	box: Box;
};

const NO_LINK = { href: "#" };

/* ------------------------------------------------------------------ */
/* View                                                                */
/* ------------------------------------------------------------------ */

function MenuView({
	id,
	props,
	rootRef,
	onPropChange,
}: NodeViewProps<MenuProps>) {
	const ctx = useRender();
	const isEditor = useIsEditor();
	// no editor não há runtime: painel e submenus abrem com estado local
	const [open, setOpen] = useState(false);
	const [openSubs, setOpenSubs] = useState<string[]>([]);
	const commit = (path: string) =>
		onPropChange && ((v: string) => onPropChange(path, v));
	const vertical = props.orientation === "vertical";
	const collapsible = !vertical && props.collapseOn !== "never";
	const linkOf = (action: Action) => actionLink(action, ctx) ?? NO_LINK;

	const className = [
		nodeClassName(id, "pb-menu", props.box),
		vertical ? "pb-menu-v" : "pb-menu-h",
		isEditor && open ? "pb-menu-open" : null,
	]
		.filter(Boolean)
		.join(" ");

	const toggleSub = (itemId: string) =>
		setOpenSubs((list) =>
			list.includes(itemId)
				? list.filter((x) => x !== itemId)
				: [...list, itemId],
		);

	return (
		<nav
			ref={rootRef as React.Ref<HTMLElement>}
			className={className}
			data-pb-node={id}
			data-pb-menu=""
			aria-label="Menu"
		>
			<ul className="pb-menu-list">
				{props.items.map((item, i) => {
					const hasSub = item.children?.length > 0;
					return (
						<li
							key={item.id}
							className={hasSub ? "pb-menu-item pb-has-sub" : "pb-menu-item"}
						>
							<a className="pb-menu-link" {...linkOf(item.action)}>
								<InlineText
									value={item.text}
									onCommit={commit(`items.${i}.text`)}
								/>
								{hasSub && !vertical ? (
									<IconView name="chevron-down" className="pb-menu-caret" />
								) : null}
							</a>
							{hasSub ? (
								<ul className="pb-submenu">
									{item.children.map((sub, j) => (
										<li key={sub.id}>
											<a
												className="pb-menu-link pb-submenu-link"
												{...linkOf(sub.action)}
											>
												<InlineText
													value={sub.text}
													onCommit={commit(`items.${i}.children.${j}.text`)}
												/>
											</a>
										</li>
									))}
								</ul>
							) : null}
						</li>
					);
				})}
			</ul>
			{collapsible ? (
				<>
					<button
						type="button"
						className="pb-menu-toggle"
						data-pb-menu-toggle=""
						aria-label="Abrir menu"
						aria-expanded={isEditor ? open : false}
						onClick={isEditor ? () => setOpen(true) : undefined}
					>
						<span />
						<span />
						<span />
					</button>
					<div className="pb-menu-panel">
						<div
							className="pb-menu-backdrop"
							data-pb-menu-close=""
							onClick={isEditor ? () => setOpen(false) : undefined}
							aria-hidden="true"
						/>
						<div
							className="pb-menu-drawer"
							role="dialog"
							aria-modal="true"
							aria-label="Menu"
						>
							<button
								type="button"
								className="pb-menu-close"
								data-pb-menu-close=""
								aria-label="Fechar menu"
								onClick={isEditor ? () => setOpen(false) : undefined}
							>
								<span />
								<span />
							</button>
							<ul className="pb-menu-mlist">
								{props.items.map((item) => {
									const hasSub = item.children?.length > 0;
									const subOpen = isEditor && openSubs.includes(item.id);
									return (
										<li
											key={item.id}
											className={subOpen ? "pb-sub-open" : undefined}
										>
											<div className="pb-menu-mrow">
												<a className="pb-menu-mlink" {...linkOf(item.action)}>
													{item.text}
												</a>
												{hasSub ? (
													<button
														type="button"
														className="pb-menu-subtoggle"
														data-pb-submenu-toggle=""
														aria-label="Abrir submenu"
														aria-expanded={subOpen}
														onClick={
															isEditor ? () => toggleSub(item.id) : undefined
														}
													>
														<IconView name="chevron-down" />
													</button>
												) : null}
											</div>
											{hasSub ? (
												<ul className="pb-menu-msub">
													{item.children.map((sub) => (
														<li key={sub.id}>
															<a
																className="pb-menu-mlink"
																{...linkOf(sub.action)}
															>
																{sub.text}
															</a>
														</li>
													))}
												</ul>
											) : null}
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				</>
			) : null}
		</nav>
	);
}

/* ------------------------------------------------------------------ */
/* Configurações                                                       */
/* ------------------------------------------------------------------ */

const newLink = (): MenuLink => ({
	id: newItemId(),
	text: "Novo link",
	action: { type: "section", sectionId: "" },
});

function MenuSettings() {
	const orientation = useField<MenuProps["orientation"]>("orientation");
	const collapseOn = useField<MenuProps["collapseOn"]>("collapseOn");
	const indicator = useField<MenuProps["indicator"]>("indicator");
	const horizontal = orientation.value !== "vertical";
	const collapsible = horizontal && collapseOn.value !== "never";
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Links">
						<ListField<MenuItem>
							path="items"
							label="Itens do menu"
							addLabel="Adicionar link"
							max={12}
							create={() => ({ ...newLink(), children: [] })}
							itemLabel={(item) => item.text}
							renderItem={(itemPath) => (
								<>
									<TextField path={`${itemPath}.text`} label="Texto" />
									<ActionField path={`${itemPath}.action`} />
									<ListField<MenuLink>
										path={`${itemPath}.children`}
										label="Submenu"
										addLabel="Adicionar sublink"
										max={10}
										create={newLink}
										itemLabel={(sub) => sub.text}
										renderItem={(subPath) => (
											<>
												<TextField path={`${subPath}.text`} label="Texto" />
												<ActionField path={`${subPath}.action`} />
											</>
										)}
									/>
								</>
							)}
						/>
					</Group>
					<Group title="Layout">
						<SegmentedField
							path="orientation"
							label="Orientação"
							options={[
								{ value: "horizontal", label: "Horizontal" },
								{ value: "vertical", label: "Vertical" },
							]}
						/>
						<SegmentedField
							path="align"
							label="Alinhamento"
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
					</Group>
					{horizontal ? (
						<Group title="Celular e tablet">
							<SelectField
								path="collapseOn"
								label="Menu hambúrguer em"
								options={[
									{ value: "tablet", label: "Tablet e celular" },
									{ value: "mobile", label: "Só no celular" },
									{ value: "never", label: "Nunca" },
								]}
							/>
							{collapsible ? (
								<SegmentedField
									path="panelLayout"
									label="Menu aberto"
									options={[
										{ value: "drawer", label: "Gaveta lateral" },
										{ value: "fullscreen", label: "Tela cheia" },
									]}
								/>
							) : null}
						</Group>
					) : null}
				</>
			}
			style={
				<>
					<Group title="Links">
						<TypographyFields base="typography" withAlign={false} />
						<ColorField path="hoverColor" label="Cor no hover" allowEmpty />
						<ColorField
							path="activeColor"
							label="Cor da página atual"
							allowEmpty
						/>
						<NumberUnitField
							path="gap"
							label="Espaço entre links"
							units={["px", "rem"]}
							max={80}
						/>
						<SidesField
							path="itemPadding"
							label="Espaço interno dos links"
							units={["px", "em"]}
						/>
					</Group>
					<Group title="Indicador" defaultOpen={false}>
						<SelectField
							path="indicator"
							label="Efeito no hover"
							options={[
								{ value: "none", label: "Nenhum" },
								{ value: "underline", label: "Sublinhado" },
								{ value: "overline", label: "Linha acima" },
								{ value: "background", label: "Fundo" },
							]}
						/>
						{indicator.value !== "none" ? (
							<ColorField path="indicatorColor" label="Cor do indicador" />
						) : null}
						{indicator.value === "background" ? (
							<NumberUnitField
								path="itemRadius"
								label="Arredondamento"
								units={["px"]}
								max={40}
							/>
						) : null}
					</Group>
					{horizontal ? (
						<Group title="Submenu" defaultOpen={false}>
							<ColorField path="dropdownBackground" label="Fundo" />
							<ColorField path="dropdownTextColor" label="Texto" />
							<ColorField
								path="dropdownHoverColor"
								label="Texto no hover"
								allowEmpty
							/>
							<ColorField
								path="dropdownHoverBackground"
								label="Fundo no hover"
								allowEmpty
							/>
							<NumberUnitField
								path="dropdownWidth"
								label="Largura mínima"
								units={["px"]}
								max={400}
							/>
							<NumberUnitField
								path="dropdownRadius"
								label="Arredondamento"
								units={["px"]}
								max={32}
							/>
							<ShadowFields base="dropdownShadow" />
						</Group>
					) : null}
					{collapsible ? (
						<Group title="Menu no celular" defaultOpen={false}>
							<ColorField path="toggleColor" label="Cor do ícone" />
							<NumberUnitField
								path="toggleSize"
								label="Tamanho do ícone"
								units={["px"]}
								max={64}
							/>
							<ColorField path="panelBackground" label="Fundo do painel" />
							<ColorField path="panelTextColor" label="Cor dos links" />
							<NumberUnitField
								path="panelFontSize"
								label="Tamanho dos links"
								units={["px", "rem"]}
								max={40}
							/>
							<NumberUnitField
								path="panelWidth"
								label="Largura da gaveta"
								units={["px", "vw"]}
								max={600}
							/>
						</Group>
					) : null}
				</>
			}
			advanced={<BoxFields />}
		/>
	);
}

/* ------------------------------------------------------------------ */
/* CSS                                                                 */
/* ------------------------------------------------------------------ */

const TRANSITION = ".25s ease";

function menuCss(id: string, p: MenuProps): string {
	const S = nodeSelector(id);
	const sheet = createSheet(id);
	const vertical = p.orientation === "vertical";
	const root = sheet.root();
	root
		.set("display", "flex")
		.set("align-items", "center")
		.set("position", "relative")
		.set("min-width", "0");
	applyBox(sheet, p.box, "flex");

	// lista principal
	const list = sheet.rule(" .pb-menu-list");
	list
		.set("display", "flex")
		.set("flex", "1")
		.set("flex-direction", vertical ? "column" : "row")
		.set("flex-wrap", vertical ? "nowrap" : "wrap")
		.set("gap", p.gap)
		.set("list-style", "none")
		.set("margin", "0")
		.set("padding", "0");
	if (vertical) {
		list.set("align-items", p.align, (v) =>
			v === "space-between" ? "stretch" : v,
		);
	} else {
		list.set("align-items", "center").set("justify-content", p.align);
	}
	sheet.rule(" .pb-menu-item").set("position", "relative");

	// links
	const link = sheet.rule(" .pb-menu-link");
	link
		.set("position", "relative")
		.set("display", "flex")
		.set("align-items", "center")
		.set("gap", ".35em")
		.set("padding", p.itemPadding, sidesToCss)
		.set("cursor", "pointer")
		.set(
			"transition",
			`color ${TRANSITION},background-color ${TRANSITION},opacity ${TRANSITION}`,
		);
	applyTypography(link, { ...p.typography, textAlign: undefined });
	sheet.rule(" .pb-menu-link:hover").set("color", p.hoverColor || undefined);
	sheet
		.rule(" .pb-menu-item:focus-within > .pb-menu-link")
		.set("color", p.hoverColor || undefined);
	sheet
		.rule(" .pb-menu-link.pb-active")
		.set("color", p.activeColor || undefined);
	sheet
		.rule(" .pb-menu-caret")
		.set("width", ".8em")
		.set("height", ".8em")
		.set("transition", `transform ${TRANSITION}`);
	sheet
		.rule(" .pb-menu-item:hover > .pb-menu-link .pb-menu-caret")
		.set("transform", "rotate(180deg)");

	// indicador de hover/ativo (só nos links principais)
	const top = " .pb-menu-list > .pb-menu-item > .pb-menu-link";
	if (p.indicator === "underline" || p.indicator === "overline") {
		sheet
			.rule(`${top}::after`)
			.set("content", '""')
			.set("position", "absolute")
			.set("left", p.itemPadding, (s) => s.left)
			.set("right", p.itemPadding, (s) => s.right)
			.set(p.indicator === "underline" ? "bottom" : "top", "0")
			.set("height", "2px")
			.set("border-radius", "2px")
			.set("background", p.indicatorColor)
			.set("transform", "scaleX(0)")
			.set("transition", `transform ${TRANSITION}`);
		for (const s of [":hover", ".pb-active"]) {
			sheet.rule(`${top}${s}::after`).set("transform", "scaleX(1)");
		}
	} else if (p.indicator === "background") {
		sheet.rule(top).set("border-radius", p.itemRadius);
		for (const s of [":hover", ".pb-active"]) {
			sheet.rule(`${top}${s}`).set("background-color", p.indicatorColor);
		}
	}

	if (vertical) {
		// submenu como lista aninhada
		sheet
			.rule(" .pb-submenu")
			.set("list-style", "none")
			.set("margin", "0")
			.set("padding", "0 0 0 12px");
		return sheet.toString();
	}

	// submenu suspenso
	sheet
		.rule(" .pb-submenu")
		.set("position", "absolute")
		.set("top", "100%")
		.set("left", "0")
		.set("z-index", "60")
		.set("min-width", p.dropdownWidth)
		.set("list-style", "none")
		.set("margin", "0")
		.set("padding", "6px")
		.set("background", p.dropdownBackground)
		.set("border-radius", p.dropdownRadius)
		.set("box-shadow", shadowToCss(p.dropdownShadow))
		.set("opacity", "0")
		.set("visibility", "hidden")
		.set("transform", "translateY(6px)")
		.set(
			"transition",
			`opacity .2s ease,transform .2s ease,visibility 0s linear .2s`,
		);
	for (const s of [":hover", ":focus-within"]) {
		sheet
			.rule(` .pb-menu-item${s} > .pb-submenu`)
			.set("opacity", "1")
			.set("visibility", "visible")
			.set("transform", "none")
			.set("transition", "opacity .2s ease,transform .2s ease");
	}
	sheet
		.rule(" .pb-submenu .pb-menu-link")
		.set("padding", "10px 14px")
		.set("white-space", "nowrap")
		.set("color", p.dropdownTextColor)
		.set("border-radius", `calc(${p.dropdownRadius} - 4px)`);
	sheet
		.rule(" .pb-submenu .pb-menu-link:hover")
		.set("color", p.dropdownHoverColor || undefined)
		.set("background-color", p.dropdownHoverBackground || undefined);

	if (p.collapseOn === "never") return sheet.toString();

	// hambúrguer
	sheet
		.rule(" .pb-menu-toggle")
		.set("display", "none")
		.set("flex-direction", "column")
		.set("align-items", "center")
		.set("justify-content", "center")
		.set("gap", `calc(${p.toggleSize} * .22)`)
		.set("width", `calc(${p.toggleSize} + 12px)`)
		.set("height", `calc(${p.toggleSize} + 12px)`)
		.set("margin-left", "auto")
		.set("padding", "0")
		.set("border", "0")
		.set("background", "transparent")
		.set("color", p.toggleColor)
		.set("cursor", "pointer")
		.set("flex-shrink", "0");
	sheet
		.rule(" .pb-menu-toggle span")
		.set("display", "block")
		.set("width", p.toggleSize)
		.set("height", "2px")
		.set("border-radius", "2px")
		.set("background", "currentColor");

	// painel (gaveta ou tela cheia), fixo na janela
	sheet
		.rule(" .pb-menu-panel")
		.set("display", "none")
		.set("position", "fixed")
		.set("inset", "0")
		.set("z-index", "1000")
		.set("visibility", "hidden")
		.set("pointer-events", "none")
		.set("transition", "visibility 0s linear .3s");
	sheet
		.rule(".pb-menu-open .pb-menu-panel")
		.set("visibility", "visible")
		.set("pointer-events", "auto")
		.set("transition", "none");
	sheet
		.rule(" .pb-menu-backdrop")
		.set("position", "absolute")
		.set("inset", "0")
		.set("background", "rgba(0,0,0,.45)")
		.set("opacity", "0")
		.set("transition", "opacity .3s ease");
	sheet.rule(".pb-menu-open .pb-menu-backdrop").set("opacity", "1");

	const fullscreen = p.panelLayout === "fullscreen";
	const drawer = sheet.rule(" .pb-menu-drawer");
	drawer
		.set("position", "absolute")
		.set("top", "0")
		.set("right", "0")
		.set("bottom", "0")
		.set("width", fullscreen ? "100%" : `min(${p.panelWidth}, 85vw)`)
		.set("display", "flex")
		.set("flex-direction", "column")
		.set("padding", "64px 24px 32px")
		.set("overflow-y", "auto")
		.set("background", p.panelBackground)
		.set("color", p.panelTextColor)
		.set("font-family", p.typography.fontFamily, (v) =>
			v ? fontStack(v) : undefined,
		)
		.set("box-shadow", fullscreen ? undefined : "-12px 0 32px rgba(0,0,0,.18)")
		.set("transition", fullscreen ? "opacity .3s ease" : "transform .3s ease")
		.set("opacity", fullscreen ? "0" : undefined)
		.set("transform", fullscreen ? undefined : "translateX(100%)");
	sheet
		.rule(".pb-menu-open .pb-menu-drawer")
		.set("opacity", fullscreen ? "1" : undefined)
		.set("transform", fullscreen ? undefined : "none");

	// botão fechar (X)
	sheet
		.rule(" .pb-menu-close")
		.set("position", "absolute")
		.set("top", "16px")
		.set("right", "16px")
		.set("width", "40px")
		.set("height", "40px")
		.set("padding", "0")
		.set("border", "0")
		.set("background", "transparent")
		.set("color", "inherit")
		.set("cursor", "pointer");
	sheet
		.rule(" .pb-menu-close span")
		.set("position", "absolute")
		.set("top", "19px")
		.set("left", "8px")
		.set("width", "24px")
		.set("height", "2px")
		.set("border-radius", "2px")
		.set("background", "currentColor")
		.set("transform", "rotate(45deg)");
	sheet
		.rule(" .pb-menu-close span:last-child")
		.set("transform", "rotate(-45deg)");

	// lista do painel
	sheet
		.rule(" .pb-menu-mlist, .pb-menu-msub")
		.set("list-style", "none")
		.set("margin", "0")
		.set("padding", "0");
	sheet
		.rule(" .pb-menu-mrow")
		.set("display", "flex")
		.set("align-items", "center")
		.set("border-bottom", "1px solid rgba(127,127,127,.2)");
	sheet
		.rule(" .pb-menu-mlink")
		.set("display", "block")
		.set("flex", "1")
		.set("padding", "14px 0")
		.set("font-size", p.panelFontSize)
		.set("font-weight", p.typography.fontWeight)
		.set("color", "inherit");
	sheet
		.rule(" .pb-menu-mlink.pb-active")
		.set("color", p.activeColor || undefined);
	sheet
		.rule(" .pb-menu-subtoggle")
		.set("display", "inline-flex")
		.set("align-items", "center")
		.set("justify-content", "center")
		.set("width", "40px")
		.set("height", "40px")
		.set("padding", "0")
		.set("border", "0")
		.set("background", "transparent")
		.set("color", "inherit")
		.set("cursor", "pointer");
	sheet
		.rule(" .pb-menu-subtoggle svg")
		.set("width", "18px")
		.set("height", "18px")
		.set("transition", `transform ${TRANSITION}`);
	sheet
		.rule(" .pb-sub-open .pb-menu-subtoggle svg")
		.set("transform", "rotate(180deg)");
	sheet
		.rule(" .pb-menu-msub")
		.set("display", "none")
		.set("padding-left", "16px");
	sheet.rule(" .pb-sub-open > .pb-menu-msub").set("display", "block");
	sheet
		.rule(" .pb-menu-msub .pb-menu-mlink")
		.set("padding", "10px 0")
		.set("font-size", `calc(${p.panelFontSize} * .9)`)
		.set("opacity", ".85");

	// abaixo do ponto de quebra: esconde os links e mostra o hambúrguer
	const media = DEVICE_MEDIA[p.collapseOn];
	const collapsed = [
		`${S} .pb-menu-list{display:none}`,
		`${S} .pb-menu-toggle{display:inline-flex}`,
		`${S} .pb-menu-panel{display:block}`,
	].join("");
	return `${sheet.toString()}@media ${media}{${collapsed}}`;
}

export const Menu: ComponentDefinition<MenuProps> = {
	type: "Menu",
	displayName: "Menu",
	category: "basic",
	icon: MenuIcon,
	inToolbox: true,
	defaults: {
		items: [
			{
				id: "menu-inicio",
				text: "Início",
				action: { type: "section", sectionId: "" },
				children: [],
			},
			{
				id: "menu-sobre",
				text: "Sobre",
				action: { type: "section", sectionId: "" },
				children: [],
			},
			{
				id: "menu-servicos",
				text: "Serviços",
				action: { type: "section", sectionId: "" },
				children: [],
			},
			{
				id: "menu-contato",
				text: "Contato",
				action: { type: "section", sectionId: "" },
				children: [],
			},
		],
		orientation: "horizontal",
		align: responsive("center"),
		gap: responsive("8px"),
		itemPadding: responsive(sides("8px", "12px")),
		typography: defaultTypography({
			fontFamily: FONT_BODY,
			fontSize: responsive("15px"),
			fontWeight: "500",
			lineHeight: responsive("1.4"),
			color: C.text,
		}),
		hoverColor: C.primary,
		activeColor: C.primary,
		indicator: "none",
		indicatorColor: C.primary,
		itemRadius: "8px",

		dropdownBackground: C.background,
		dropdownTextColor: C.text,
		dropdownHoverColor: C.primary,
		dropdownHoverBackground: C.surface,
		dropdownWidth: "200px",
		dropdownRadius: "10px",
		dropdownShadow: defaultShadow({
			enabled: true,
			y: 12,
			blur: 32,
			color: "#0000001f",
		}),

		collapseOn: "tablet",
		toggleColor: C.text,
		toggleSize: "24px",
		panelLayout: "drawer",
		panelWidth: "320px",
		panelBackground: C.background,
		panelTextColor: C.text,
		panelFontSize: "18px",

		box: defaultBox(),
	},
	View: MenuView,
	css: menuCss,
	Settings: MenuSettings,
	runtime: ["menu"],
	fonts: (p) => [p.typography.fontFamily],
};
