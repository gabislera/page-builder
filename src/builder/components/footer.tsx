import { PanelBottom } from "lucide-react";
import { ActionField } from "../controls/action.tsx";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
	BackgroundFields,
	BoxFields,
	MediaPathField,
	SidesField,
	TypographyFields,
} from "../controls/groups.tsx";
import {
	NumberUnitField,
	SegmentedField,
	SelectField,
	SwitchField,
	TextAreaField,
	TextField,
} from "../controls/inputs.tsx";
import { ListField, newItemId } from "../controls/list.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useField } from "../controls/use-field.ts";
import { actionLink, normalizeUrl } from "../core/actions.ts";
import {
	defaultBackground,
	defaultBox,
	defaultTypography,
	sides,
} from "../core/defaults.ts";
import { ICONS, IconView } from "../core/icons.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useRender } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
	applyBackground,
	applyBox,
	applyTypography,
	createSheet,
	sidesToCss,
} from "../core/style-engine.ts";
import type {
	Action,
	Background,
	Box,
	Length,
	Sides,
	Typography,
} from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import { InlineText, LogoView } from "./header-footer-shared.tsx";

export type FooterLink = { id: string; text: string; action: Action };
export type FooterGroup = { id: string; title: string; links: FooterLink[] };
export type FooterSocial = { id: string; icon: string; url: string };

export type FooterProps = {
	logoSrc: string;
	logoAlt: string;
	logoText: string;
	logoWidth: Responsive<Length>;
	logoTypography: Typography;
	description: string;
	showCopyright: boolean;
	copyright: string;

	groups: FooterGroup[];
	socials: FooterSocial[];

	fullWidth: boolean;
	padding: Responsive<Sides>;
	/** Espaço entre as colunas. */
	gap: Responsive<Length>;
	/** Largura da coluna da marca em relação às colunas de links (fr). */
	brandColumnSize: "1" | "1.5" | "2";
	background: Background;

	/** Cor base do texto (descrição e copyright). */
	textTypography: Typography;
	titleTypography: Typography;
	linkTypography: Typography;
	linkHoverColor: string;

	iconSize: Length;
	iconColor: string;
	iconHoverColor: string;
	/** Fundo circular dos ícones. Vazio = sem fundo. */
	iconBackground: string;
	dividerColor: string;

	box: Box;
};

function FooterView({
	id,
	props,
	rootRef,
	onPropChange,
}: NodeViewProps<FooterProps>) {
	const ctx = useRender();
	const commit = (path: string) =>
		onPropChange && ((v: string) => onPropChange(path, v));
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
				<div className="pb-footer-top">
					<div className="pb-footer-brand">
						<LogoView
							src={props.logoSrc}
							alt={props.logoAlt}
							text={props.logoText}
							onTextChange={commit("logoText")}
						/>
						{props.description ? (
							<p className="pb-footer-desc">
								<InlineText
									value={props.description}
									onCommit={commit("description")}
									multiline
								/>
							</p>
						) : null}
						{props.socials.length > 0 ? (
							<div className="pb-footer-socials">
								{props.socials.map((s) => (
									<a
										key={s.id}
										className="pb-footer-social"
										href={s.url ? normalizeUrl(s.url) : "#"}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={ICONS[s.icon]?.label ?? s.icon}
									>
										<IconView name={s.icon} />
									</a>
								))}
							</div>
						) : null}
					</div>
					{props.groups.map((group, gi) => (
						<div key={group.id} className="pb-footer-col">
							<p className="pb-footer-title">
								<InlineText
									value={group.title}
									onCommit={commit(`groups.${gi}.title`)}
								/>
							</p>
							<ul className="pb-footer-links">
								{group.links.map((link, li) => (
									<li key={link.id}>
										<a
											className="pb-footer-link"
											{...(actionLink(link.action, ctx) ?? { href: "#" })}
										>
											<InlineText
												value={link.text}
												onCommit={commit(`groups.${gi}.links.${li}.text`)}
											/>
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
				{props.showCopyright ? (
					<div className="pb-footer-bottom">
						<p className="pb-footer-copy">
							<InlineText
								value={props.copyright}
								onCommit={commit("copyright")}
							/>
						</p>
					</div>
				) : null}
			</div>
		</footer>
	);
}

/* ------------------------------------------------------------------ */
/* Configurações                                                       */
/* ------------------------------------------------------------------ */

const SOCIAL_ICONS = [
	"instagram",
	"facebook",
	"youtube",
	"linkedin",
	"twitter",
	"whatsapp",
	"mail",
	"phone",
	"map-pin",
];

const newLink = (): FooterLink => ({
	id: newItemId(),
	text: "Novo link",
	action: { type: "url", url: "", newTab: false },
});

function FooterSettings() {
	const copyright = useField<boolean>("showCopyright");
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Marca">
						<MediaPathField
							path="logoSrc"
							label="Logo"
							accept="image"
							hint="Sem imagem, o texto da marca é exibido."
						/>
						<TextField path="logoAlt" label="Texto alternativo (SEO)" />
						<TextField path="logoText" label="Texto da marca" />
						<TextAreaField path="description" label="Descrição" />
					</Group>
					<Group title="Colunas de links">
						<ListField<FooterGroup>
							path="groups"
							label="Colunas"
							addLabel="Adicionar coluna"
							max={4}
							create={() => ({
								id: newItemId(),
								title: "Nova coluna",
								links: [newLink()],
							})}
							itemLabel={(item) => item.title}
							renderItem={(itemPath) => (
								<>
									<TextField path={`${itemPath}.title`} label="Título" />
									<ListField<FooterLink>
										path={`${itemPath}.links`}
										label="Links"
										addLabel="Adicionar link"
										max={12}
										create={newLink}
										itemLabel={(link) => link.text}
										renderItem={(linkPath) => (
											<>
												<TextField path={`${linkPath}.text`} label="Texto" />
												<ActionField path={`${linkPath}.action`} />
											</>
										)}
									/>
								</>
							)}
						/>
					</Group>
					<Group title="Redes sociais">
						<ListField<FooterSocial>
							path="socials"
							label="Perfis"
							addLabel="Adicionar rede"
							max={9}
							create={() => ({ id: newItemId(), icon: "instagram", url: "" })}
							itemLabel={(item) => ICONS[item.icon]?.label ?? item.icon}
							renderItem={(itemPath) => (
								<>
									<SelectField
										path={`${itemPath}.icon`}
										label="Rede"
										options={SOCIAL_ICONS.map((name) => ({
											value: name,
											label: ICONS[name].label,
										}))}
									/>
									<TextField
										path={`${itemPath}.url`}
										label="Link do perfil"
										placeholder="https://"
									/>
								</>
							)}
						/>
					</Group>
					<Group title="Direitos autorais">
						<SwitchField
							path="showCopyright"
							label="Mostrar linha de copyright"
						/>
						{copyright.value ? (
							<TextField path="copyright" label="Texto" />
						) : null}
					</Group>
				</>
			}
			style={
				<>
					<Group title="Layout">
						<SwitchField path="fullWidth" label="Conteúdo em largura total" />
						<SegmentedField
							path="brandColumnSize"
							label="Largura da coluna da marca"
							options={[
								{ value: "1", label: "Igual" },
								{ value: "1.5", label: "Maior" },
								{ value: "2", label: "Dobro" },
							]}
						/>
						<NumberUnitField
							path="gap"
							label="Espaço entre colunas"
							units={["px", "rem"]}
							max={160}
						/>
						<SidesField
							path="padding"
							label="Espaço interno"
							units={["px", "%", "rem"]}
						/>
						<NumberUnitField
							path="logoWidth"
							label="Largura do logo"
							units={["px"]}
							max={400}
						/>
					</Group>
					<Group title="Fundo">
						<BackgroundFields base="background" />
						<ColorField path="dividerColor" label="Cor da linha divisória" />
					</Group>
					<Group title="Logo em texto" defaultOpen={false}>
						<TypographyFields base="logoTypography" withAlign={false} />
					</Group>
					<Group title="Descrição e copyright" defaultOpen={false}>
						<TypographyFields base="textTypography" withAlign={false} />
					</Group>
					<Group title="Títulos das colunas" defaultOpen={false}>
						<TypographyFields base="titleTypography" withAlign={false} />
					</Group>
					<Group title="Links">
						<TypographyFields base="linkTypography" withAlign={false} />
						<ColorField
							path="linkHoverColor"
							label="Cor ao passar o mouse"
							allowEmpty
						/>
					</Group>
					<Group title="Ícones sociais">
						<NumberUnitField
							path="iconSize"
							label="Tamanho"
							units={["px"]}
							max={48}
						/>
						<ColorField path="iconColor" label="Cor" />
						<ColorField
							path="iconHoverColor"
							label="Cor ao passar o mouse"
							allowEmpty
						/>
						<ColorField path="iconBackground" label="Fundo" allowEmpty />
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

function footerCss(id: string, p: FooterProps): string {
	const sheet = createSheet(id);
	const root = sheet.root();
	root
		.set("display", "block")
		.set("position", "relative")
		.set("width", "100%")
		.set("padding", p.padding, sidesToCss);
	applyTypography(root, p.textTypography);
	applyBackground(root, p.background);
	applyBox(
		sheet,
		{ ...p.box, padding: undefined, width: undefined, maxWidth: undefined },
		"block",
	);

	sheet
		.rule(" .pb-footer-inner")
		.set("display", "flex")
		.set("flex-direction", "column")
		.set("gap", "40px")
		.set("width", "100%")
		.set("max-width", p.fullWidth ? "none" : "var(--pb-content-width)")
		.set("margin", "0 auto");

	// colunas: marca + grupos no desktop; marca em linha própria no tablet; tudo empilhado no celular
	const n = p.groups.length;
	const brand = Number(p.brandColumnSize) || 1;
	const top = sheet.rule(" .pb-footer-top");
	top
		.set("display", "grid")
		.set("gap", p.gap)
		.set("align-items", "start")
		.set(
			"grid-template-columns",
			n > 0
				? `minmax(0,${brand}fr) repeat(${n},minmax(0,1fr))`
				: "minmax(0,1fr)",
		)
		.setOn(
			"tablet",
			"grid-template-columns",
			`repeat(${Math.max(1, Math.min(n, 3))},minmax(0,1fr))`,
		)
		.setOn("mobile", "grid-template-columns", "minmax(0,1fr)");
	sheet
		.rule(" .pb-footer-brand")
		.set("display", "flex")
		.set("flex-direction", "column")
		.set("align-items", "flex-start")
		.set("gap", "16px")
		.set("max-width", "420px")
		.setOn("tablet", "grid-column", "1 / -1");

	const logo = sheet.rule(" .pb-logo");
	logo.set("display", "inline-flex").set("align-items", "center");
	applyTypography(logo, p.logoTypography);
	sheet
		.rule(" .pb-logo img")
		.set("width", p.logoWidth)
		.set("max-width", "100%")
		.set("height", "auto");

	sheet
		.rule(" .pb-footer-col")
		.set("display", "flex")
		.set("flex-direction", "column")
		.set("gap", "16px");
	applyTypography(sheet.rule(" .pb-footer-title"), p.titleTypography);
	sheet
		.rule(" .pb-footer-links")
		.set("list-style", "none")
		.set("margin", "0")
		.set("padding", "0")
		.set("display", "flex")
		.set("flex-direction", "column")
		.set("gap", "10px");
	const link = sheet.rule(" .pb-footer-link");
	link.set("transition", "color .2s ease");
	applyTypography(link, p.linkTypography);
	sheet.rule(" .pb-footer-link:hover").set("color", p.linkHoverColor);

	// redes sociais
	sheet
		.rule(" .pb-footer-socials")
		.set("display", "flex")
		.set("flex-wrap", "wrap")
		.set("gap", "10px")
		.set("margin-top", "4px");
	const box = p.iconBackground ? `calc(${p.iconSize} + 20px)` : undefined;
	sheet
		.rule(" .pb-footer-social")
		.set("display", "inline-flex")
		.set("align-items", "center")
		.set("justify-content", "center")
		.set("width", box)
		.set("height", box)
		.set("border-radius", "999px")
		.set("background", p.iconBackground)
		.set("color", p.iconColor)
		.set("font-size", p.iconSize)
		.set(
			"transition",
			"color .2s ease,background-color .2s ease,transform .2s ease",
		);
	sheet
		.rule(" .pb-footer-social:hover")
		.set("color", p.iconHoverColor)
		.set("transform", "translateY(-2px)");

	// linha de copyright
	sheet
		.rule(" .pb-footer-bottom")
		.set("padding-top", "24px")
		.set("border-top", `1px solid ${p.dividerColor}`)
		.set("font-size", "14px");

	return sheet.toString();
}

export const Footer: ComponentDefinition<FooterProps> = {
	type: "Footer",
	displayName: "Rodapé",
	category: "structure",
	icon: PanelBottom,
	notDuplicable: true,
	defaults: {
		logoSrc: "",
		logoAlt: "",
		logoText: "Sua marca",
		logoWidth: responsive("140px"),
		logoTypography: defaultTypography({
			fontSize: responsive("22px"),
			fontWeight: "800",
			lineHeight: responsive("1.2"),
			letterSpacing: responsive("-0.5px"),
			color: "#fafafa",
		}),
		description:
			"Ajudamos pessoas a alcançar resultados reais com soluções simples, seguras e feitas para durar.",
		showCopyright: true,
		copyright: "© 2026 Sua marca. Todos os direitos reservados.",

		groups: [
			{
				id: "grp-empresa",
				title: "Empresa",
				links: [
					{
						id: "lnk-sobre",
						text: "Sobre nós",
						action: { type: "url", url: "", newTab: false },
					},
					{
						id: "lnk-contato",
						text: "Contato",
						action: { type: "url", url: "", newTab: false },
					},
					{
						id: "lnk-blog",
						text: "Blog",
						action: { type: "url", url: "", newTab: false },
					},
				],
			},
			{
				id: "grp-legal",
				title: "Legal",
				links: [
					{
						id: "lnk-termos",
						text: "Termos de uso",
						action: { type: "url", url: "", newTab: false },
					},
					{
						id: "lnk-privacidade",
						text: "Política de privacidade",
						action: { type: "url", url: "", newTab: false },
					},
				],
			},
		],
		socials: [
			{ id: "soc-instagram", icon: "instagram", url: "" },
			{ id: "soc-youtube", icon: "youtube", url: "" },
			{ id: "soc-whatsapp", icon: "whatsapp", url: "" },
		],

		fullWidth: false,
		padding: responsive(
			sides("64px", "24px", "32px"),
			undefined,
			sides("48px", "16px", "28px"),
		),
		gap: responsive("48px", "40px", "32px"),
		brandColumnSize: "1.5",
		background: defaultBackground({ type: "color", color: "#18181b" }),

		textTypography: defaultTypography({
			fontSize: responsive("15px"),
			lineHeight: responsive("1.6"),
			color: "#a1a1aa",
		}),
		titleTypography: defaultTypography({
			fontSize: responsive("13px"),
			fontWeight: "600",
			lineHeight: responsive("1.4"),
			letterSpacing: responsive("1px"),
			textTransform: "uppercase",
			color: "#fafafa",
		}),
		linkTypography: defaultTypography({
			fontSize: responsive("15px"),
			lineHeight: responsive("1.5"),
			color: "#a1a1aa",
		}),
		linkHoverColor: "#ffffff",

		iconSize: "18px",
		iconColor: "#d4d4d8",
		iconHoverColor: "#ffffff",
		iconBackground: "#ffffff14",
		dividerColor: "#27272a",

		box: defaultBox({
			width: responsive("100%"),
			maxWidth: responsive("none"),
		}),
	},
	rules: {
		canDrop: (target) => target.data.name === "Page",
	},
	View: FooterView,
	css: footerCss,
	Settings: FooterSettings,
	fonts: (p) => [
		p.logoTypography.fontFamily,
		p.textTypography.fontFamily,
		p.titleTypography.fontFamily,
		p.linkTypography.fontFamily,
	],
};
