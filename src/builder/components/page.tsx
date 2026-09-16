import { File } from "lucide-react";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import { BackgroundFields } from "../controls/groups.tsx";
import { NumberUnitField, SelectField } from "../controls/inputs.tsx";
import { defaultBackground } from "../core/defaults.ts";
import { TOP_LEVEL_TYPES } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { type Responsive, responsive } from "../core/responsive.ts";
import {
	applyBackground,
	createSheet,
	fontStack,
	nodeClass,
} from "../core/style-engine.ts";
import type { Background, Length } from "../core/style-types.ts";
import { C, FONT_BODY, FONT_HEADING, fontChoices } from "../core/theme.ts";
import type { ComponentDefinition } from "../core/types.ts";
import { SitePartSlot } from "../editor/site-part-slot.tsx";

export type PageProps = {
	contentWidth: Length;
	fontFamily: string;
	headingFontFamily: string;
	textColor: string;
	baseFontSize: Responsive<Length>;
	background: Background;
};

function PageView({
	id,
	children,
	rootRef,
}: Parameters<ComponentDefinition<PageProps>["View"]>[0]) {
	const isEditor = useIsEditor();
	const empty = !children || (Array.isArray(children) && children.length === 0);
	return (
		<div
			ref={rootRef as React.Ref<HTMLDivElement>}
			className={`pb-page ${nodeClass(id)}`}
			data-pb-node={id}
		>
			{isEditor ? <SitePartSlot part="header" /> : null}
			{children}
			{isEditor && empty ? (
				<div
					className="pb-placeholder"
					style={{ margin: 24, width: "auto", minHeight: 200 }}
				>
					Página vazia. Adicione uma seção pelo painel "Adicionar".
				</div>
			) : null}
			{isEditor ? <SitePartSlot part="footer" /> : null}
		</div>
	);
}

function PageSettings() {
	return (
		<>
			<Group title="Layout">
				<NumberUnitField
					path="contentWidth"
					label="Largura do conteúdo"
					units={["px"]}
					min={600}
					max={1600}
					hint="Largura máxima do conteúdo das seções."
				/>
			</Group>
			<Group title="Tipografia">
				<SelectField
					path="fontFamily"
					label="Fonte do texto"
					options={fontChoices()}
					hint="O padrão segue as fontes globais do site."
				/>
				<SelectField
					path="headingFontFamily"
					label="Fonte dos títulos"
					options={fontChoices()}
				/>
				<NumberUnitField
					path="baseFontSize"
					label="Tamanho base"
					units={["px"]}
					min={12}
					max={24}
				/>
				<ColorField path="textColor" label="Cor do texto" />
			</Group>
			<Group title="Fundo da página">
				<BackgroundFields base="background" />
			</Group>
		</>
	);
}

export const Page: ComponentDefinition<PageProps> = {
	type: "Page",
	displayName: "Página",
	category: "structure",
	icon: File,
	isCanvas: true,
	notDeletable: true,
	defaults: {
		contentWidth: "1200px",
		fontFamily: FONT_BODY,
		headingFontFamily: FONT_HEADING,
		textColor: C.text,
		baseFontSize: responsive("16px"),
		background: defaultBackground({ type: "color", color: C.background }),
	},
	rules: {
		canDrag: () => false,
		canMoveIn: (incoming, current, helpers) => {
			if (!incoming.every((n) => TOP_LEVEL_TYPES.has(n.data.name)))
				return false;
			// no máximo um cabeçalho e um rodapé por página
			const children = (current.data.nodes ?? []).map((id) =>
				helpers(id).get(),
			);
			for (const kind of ["Header", "Footer"]) {
				const adding = incoming.filter((n) => n.data.name === kind);
				if (!adding.length) continue;
				const existing = children.filter(
					(c) => c.data.name === kind && !adding.some((a) => a.id === c.id),
				);
				if (existing.length + adding.length > 1) return false;
			}
			return true;
		},
	},
	View: PageView,
	css: (id, p) => {
		const sheet = createSheet(id);
		const root = sheet.root();
		root
			.set("--pb-content-width", p.contentWidth)
			.set(
				"--pb-heading-font",
				fontStack(
					p.headingFontFamily === "inherit"
						? p.fontFamily
						: p.headingFontFamily,
				),
			)
			.set("font-family", fontStack(p.fontFamily))
			.set("font-size", p.baseFontSize)
			.set("color", p.textColor)
			.set("line-height", "1.5");
		applyBackground(root, p.background);
		return sheet.toString();
	},
	Settings: PageSettings,
	fonts: (p) => [p.fontFamily, p.headingFontFamily],
};
