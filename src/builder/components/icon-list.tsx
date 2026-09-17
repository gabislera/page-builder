import { ListChecks } from "lucide-react";
import { ActionField } from "../controls/action.tsx";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import {
	BoxFields,
	NumberField,
	TypographyFields,
} from "../controls/groups.tsx";
import { IconField } from "../controls/icon.tsx";
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
import { defaultBox, defaultTypography } from "../core/defaults.ts";
import { IconView } from "../core/icons.tsx";
import { nodeClassName } from "../core/node-helpers.ts";
import { useRender } from "../core/render-context.tsx";
import { type Responsive, resolve, responsive } from "../core/responsive.ts";
import {
	applyBox,
	applyTypography,
	createSheet,
} from "../core/style-engine.ts";
import type { Action, Box, Length, Typography } from "../core/style-types.ts";
import { C, FONT_BODY } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import { ALIGN_OPTIONS, setPerDevice } from "./shared/icon-style.tsx";
import { InlineText } from "./shared/inline-text.tsx";

export type IconListItem = {
	id: string;
	icon: string;
	text: string;
	action: Action;
};

type Layout = "vertical" | "horizontal";
type Align = "flex-start" | "center" | "flex-end";

export type IconListProps = {
	items: IconListItem[];
	layout: Responsive<Layout>;
	/** Espaço entre os itens. */
	gap: Responsive<Length>;
	align: Responsive<Align>;
	iconSize: Responsive<Length>;
	iconColor: string;
	iconStrokeWidth: number;
	/** Alinhamento vertical do ícone em textos de várias linhas. */
	iconAlign: "top" | "center";
	/** Espaço entre o ícone e o texto. */
	iconGap: Responsive<Length>;
	typography: Typography;
	/** Cor do texto de itens com link no hover. */
	hoverColor: string;
	divider: boolean;
	dividerStyle: "solid" | "dashed" | "dotted";
	dividerWidth: Length;
	dividerColor: string;
	box: Box;
};

function IconListView({
	id,
	props,
	rootRef,
	onPropChange,
}: NodeViewProps<IconListProps>) {
	const ctx = useRender();
	return (
		<ul
			ref={rootRef as React.Ref<HTMLUListElement>}
			className={nodeClassName(id, "pb-iconlist", props.box)}
			data-pb-node={id}
		>
			{props.items.map((item, i) => {
				const link = actionLink(item.action, ctx);
				const content = (
					<>
						{item.icon ? (
							<span className="pb-iconlist-icon">
								<IconView
									name={item.icon}
									strokeWidth={props.iconStrokeWidth}
								/>
							</span>
						) : null}
						<InlineText
							className="pb-iconlist-text"
							value={item.text}
							onCommit={
								onPropChange && ((v) => onPropChange(`items.${i}.text`, v))
							}
						/>
					</>
				);
				return (
					<li key={item.id} className="pb-iconlist-item">
						{link ? (
							<a className="pb-iconlist-row pb-iconlist-link" {...link}>
								{content}
							</a>
						) : (
							<span className="pb-iconlist-row">{content}</span>
						)}
					</li>
				);
			})}
		</ul>
	);
}

function IconListSettings() {
	const divider = useField<boolean>("divider");
	return (
		<SettingsTabs
			content={
				<>
					<Group title="Itens">
						<ListField<IconListItem>
							path="items"
							label="Itens da lista"
							addLabel="Adicionar item"
							create={() => ({
								id: newItemId(),
								icon: "check-circle",
								text: "Novo item",
								action: { type: "none" },
							})}
							itemLabel={(item) => item.text}
							renderItem={(itemPath) => (
								<>
									<TextField path={`${itemPath}.text`} label="Texto" />
									<IconField path={`${itemPath}.icon`} label="Ícone" />
									<ActionField path={`${itemPath}.action`} label="Link" />
								</>
							)}
						/>
					</Group>
					<Group title="Layout">
						<SegmentedField
							path="layout"
							label="Disposição"
							options={[
								{ value: "vertical", label: "Vertical" },
								{ value: "horizontal", label: "Horizontal" },
							]}
						/>
						<SegmentedField
							path="align"
							label="Alinhamento"
							options={ALIGN_OPTIONS}
						/>
						<NumberUnitField
							path="gap"
							label="Espaço entre itens"
							units={["px", "em"]}
							max={80}
						/>
					</Group>
				</>
			}
			style={
				<>
					<Group title="Ícone">
						<NumberUnitField
							path="iconSize"
							label="Tamanho"
							units={["px", "em"]}
							max={80}
						/>
						<ColorField path="iconColor" label="Cor" />
						<NumberField
							path="iconStrokeWidth"
							label="Espessura do traço"
							min={0.5}
							max={4}
							step={0.25}
						/>
						<NumberUnitField
							path="iconGap"
							label="Espaço até o texto"
							units={["px", "em"]}
							max={48}
						/>
						<SegmentedField
							path="iconAlign"
							label="Posição vertical"
							options={[
								{ value: "top", label: "Topo" },
								{ value: "center", label: "Centro" },
							]}
						/>
					</Group>
					<Group title="Texto">
						<TypographyFields base="typography" withAlign={false} />
						<ColorField
							path="hoverColor"
							label="Cor no hover (links)"
							allowEmpty
						/>
					</Group>
					<Group title="Divisor" defaultOpen={false}>
						<SwitchField path="divider" label="Linha entre itens" />
						{divider.value ? (
							<>
								<SelectField
									path="dividerStyle"
									label="Estilo"
									options={[
										{ value: "solid", label: "Sólida" },
										{ value: "dashed", label: "Tracejada" },
										{ value: "dotted", label: "Pontilhada" },
									]}
								/>
								<NumberUnitField
									path="dividerWidth"
									label="Espessura"
									units={["px"]}
									max={10}
								/>
								<ColorField path="dividerColor" label="Cor" />
							</>
						) : null}
					</Group>
				</>
			}
			advanced={<BoxFields withSize={false} />}
		/>
	);
}

const item = (id: string, text: string): IconListItem => ({
	id,
	icon: "check-circle",
	text,
	action: { type: "none" },
});

export const IconList: ComponentDefinition<IconListProps> = {
	type: "IconList",
	displayName: "Lista de ícones",
	category: "basic",
	icon: ListChecks,
	inToolbox: true,
	defaults: {
		items: [
			item("iconlist-1", "Acesso vitalício"),
			item("iconlist-2", "Suporte por e-mail"),
			item("iconlist-3", "Certificado de conclusão"),
		],
		layout: responsive("vertical"),
		gap: responsive("12px"),
		align: responsive("flex-start"),
		iconSize: responsive("20px"),
		iconColor: C.primary,
		iconStrokeWidth: 2,
		iconAlign: "center",
		iconGap: responsive("10px"),
		typography: defaultTypography({
			fontFamily: FONT_BODY,
			fontSize: responsive("17px", undefined, "16px"),
			lineHeight: responsive("1.5"),
			color: C.text,
		}),
		hoverColor: C.primary,
		divider: false,
		dividerStyle: "solid",
		dividerWidth: "1px",
		dividerColor: C.border,
		box: defaultBox(),
	},
	View: IconListView,
	css: (id, p) => {
		const sheet = createSheet(id);
		const root = sheet.root();
		root
			.set("display", "flex")
			.set("list-style", "none")
			.set("margin", "0")
			.set("padding", "0");
		// direção, quebra e alinhamento dependem de layout + alinhamento
		setPerDevice(root, (d) => {
			const horizontal = resolve(p.layout, d) === "horizontal";
			const align = resolve(p.align, d);
			return {
				"flex-direction": horizontal ? "row" : "column",
				"flex-wrap": horizontal ? "wrap" : "nowrap",
				"align-items": horizontal ? "center" : align,
				"justify-content": horizontal ? align : "flex-start",
			};
		});
		root.set("gap", p.gap);

		const border = `${p.dividerWidth} ${p.dividerStyle} ${p.dividerColor}`;
		if (p.divider) {
			// a linha fica no meio do espaço: gap + padding do mesmo tamanho
			const next = sheet.rule(" .pb-iconlist-item + .pb-iconlist-item");
			setPerDevice(next, (d) => {
				const horizontal = resolve(p.layout, d) === "horizontal";
				const gap = resolve(p.gap, d);
				return {
					"border-top": horizontal ? "0" : border,
					"border-left": horizontal ? border : "0",
					"padding-top": horizontal ? "0" : gap,
					"padding-left": horizontal ? gap : "0",
				};
			});
		}

		const row = sheet.rule(" .pb-iconlist-row");
		row
			.set("display", "flex")
			.set("align-items", p.iconAlign === "top" ? "flex-start" : "center")
			.set("gap", p.iconGap);
		applyTypography(row, { ...p.typography, textAlign: undefined });
		sheet.rule(" .pb-iconlist-link").set("transition", "color .2s ease");
		sheet
			.rule(" .pb-iconlist-link:hover")
			.set("color", p.hoverColor || undefined);

		const icon = sheet.rule(" .pb-iconlist-icon");
		icon
			.set("display", "inline-flex")
			.set("flex-shrink", "0")
			.set("color", p.iconColor);
		if (p.iconAlign === "top") {
			// centraliza o ícone na primeira linha do texto
			icon.set(
				"margin-top",
				p.iconSize,
				(size) => `max(0px, calc((1lh - ${size}) / 2))`,
			);
		}
		sheet
			.rule(" .pb-iconlist-icon svg")
			.set("width", p.iconSize)
			.set("height", p.iconSize);
		sheet.rule(" .pb-iconlist-text").set("min-width", "0");

		applyBox(sheet, p.box, "flex");
		return sheet.toString();
	},
	Settings: IconListSettings,
	fonts: (p) => [p.typography.fontFamily],
};
