import { Minus } from "lucide-react";
import { ColorField } from "../controls/color.tsx";
import { Group } from "../controls/field.tsx";
import { BoxFields } from "../controls/groups.tsx";
import {
	NumberUnitField,
	SegmentedField,
	SelectField,
} from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { defaultBox, sides } from "../core/defaults.ts";
import { nodeClassName } from "../core/node-helpers.ts";
import { type Responsive, responsive } from "../core/responsive.ts";
import { applyBox, createSheet } from "../core/style-engine.ts";
import type { Box, Length } from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type DividerProps = {
	style: "solid" | "dashed" | "dotted" | "double";
	thickness: Responsive<Length>;
	color: string;
	length: Responsive<Length>;
	align: Responsive<"flex-start" | "center" | "flex-end">;
	box: Box;
};

function DividerView({ id, props, rootRef }: NodeViewProps<DividerProps>) {
	return (
		<div
			ref={rootRef as React.Ref<HTMLDivElement>}
			className={nodeClassName(id, "pb-divider", props.box)}
			data-pb-node={id}
		>
			<span />
		</div>
	);
}

function DividerSettings() {
	return (
		<SettingsTabs
			style={
				<Group title="Linha">
					<SelectField
						path="style"
						label="Estilo"
						options={[
							{ value: "solid", label: "Sólida" },
							{ value: "dashed", label: "Tracejada" },
							{ value: "dotted", label: "Pontilhada" },
							{ value: "double", label: "Dupla" },
						]}
					/>
					<NumberUnitField
						path="thickness"
						label="Espessura"
						units={["px"]}
						max={20}
					/>
					<NumberUnitField
						path="length"
						label="Comprimento"
						units={["%", "px"]}
						max={100}
					/>
					<SegmentedField
						path="align"
						label="Alinhamento"
						options={[
							{ value: "flex-start", label: "Início" },
							{ value: "center", label: "Centro" },
							{ value: "flex-end", label: "Fim" },
						]}
					/>
					<ColorField path="color" label="Cor" />
				</Group>
			}
			advanced={<BoxFields withSize={false} />}
		/>
	);
}

export const Divider: ComponentDefinition<DividerProps> = {
	type: "Divider",
	displayName: "Divisor",
	category: "basic",
	icon: Minus,
	inToolbox: true,
	defaults: {
		style: "solid",
		thickness: responsive("1px"),
		color: "#e4e4e7",
		length: responsive("100%"),
		align: responsive("center"),
		box: defaultBox({
			width: responsive("100%"),
			padding: responsive(sides("12px", "0px")),
		}),
	},
	View: DividerView,
	css: (id, p) => {
		const sheet = createSheet(id);
		sheet.root().set("display", "flex").set("justify-content", p.align);
		sheet
			.rule(" > span")
			.set("display", "block")
			.set("width", p.length)
			.set("border-top-style", p.style)
			.set("border-top-width", p.thickness, (t) =>
				p.style === "double" ? `calc(${t} * 3)` : t,
			)
			.set("border-top-color", p.color);
		applyBox(sheet, p.box, "flex");
		return sheet.toString();
	},
	Settings: DividerSettings,
};
