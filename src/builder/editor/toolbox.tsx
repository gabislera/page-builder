import { Element, useEditor } from "@craftjs/core";
import { Columns2, Columns3, type LucideIcon, Rows3 } from "lucide-react";
import type { ReactElement } from "react";
import { containerPresets } from "../components/container.tsx";
import { deepMerge } from "../core/build.ts";
import { responsive } from "../core/responsive.ts";
import { COMPONENTS } from "../registry.ts";
import { resolver } from "../resolver.ts";

type ToolboxItem = {
	key: string;
	label: string;
	icon: LucideIcon;
	create: () => ReactElement;
};

const C = resolver as Record<
	string,
	React.ComponentType<Record<string, unknown>>
>;

const simple = (type: string): ToolboxItem => {
	const def = COMPONENTS[type];
	return {
		key: type,
		label: def.displayName,
		icon: def.icon,
		create: () =>
			def.isCanvas ? (
				<Element is={C[type]} canvas {...def.defaults} />
			) : (
				<Element is={C[type]} {...def.defaults} />
			),
	};
};

const columns = (n: number, label: string, icon: LucideIcon): ToolboxItem => ({
	key: `columns-${n}`,
	label,
	icon,
	create: () => (
		<Element
			is={C.Container}
			canvas
			{...containerPresets.grid(n)}
			custom={{ displayName: "Colunas" }}
		>
			{Array.from({ length: n }, (_, i) => `col-${i}`).map((key) => (
				<Element
					key={key}
					is={C.Container}
					canvas
					{...containerPresets.stack}
					custom={{ displayName: "Coluna" }}
				/>
			))}
		</Element>
	),
});

/** Modal já nasce com um título, um texto e um formulário dentro. */
function modalItem(): ToolboxItem {
	const def = COMPONENTS.Modal;
	const props = (type: string, patch: Record<string, unknown> = {}) =>
		deepMerge(structuredClone(COMPONENTS[type].defaults), patch) as Record<
			string,
			unknown
		>;
	const center = { typography: { textAlign: responsive("center") } };
	return {
		key: "Modal",
		label: def.displayName,
		icon: def.icon,
		create: () => (
			<Element
				is={C.Modal}
				canvas
				{...def.defaults}
				custom={{ displayName: "Pop-up" }}
			>
				<Element
					is={C.Heading}
					{...props("Heading", {
						text: "Não perca essa oportunidade!",
						tag: "h3",
						...center,
						typography: {
							textAlign: responsive("center"),
							fontSize: responsive("28px", undefined, "24px"),
						},
					})}
				/>
				<Element
					is={C.Text}
					{...props("Text", {
						html: "<p>Deixe seu contato e receba as novidades em primeira mão.</p>",
						...center,
					})}
				/>
				<Element is={C.Form} {...props("Form")} />
			</Element>
		),
	};
}

export const TOOLBOX_GROUPS: { title: string; items: ToolboxItem[] }[] = [
	{
		title: "Layout",
		items: [
			simple("Container"),
			{
				key: "row",
				label: "Linha",
				icon: Rows3,
				create: () => (
					<Element
						is={C.Container}
						canvas
						{...containerPresets.row}
						custom={{ displayName: "Linha" }}
					/>
				),
			},
			columns(2, "2 colunas", Columns2),
			columns(3, "3 colunas", Columns3),
			simple("Spacer"),
		],
	},
	{
		title: "Site",
		items: ["Logo", "Menu", "SocialIcons"].map(simple),
	},
	{
		title: "Básico",
		items: ["Heading", "Text", "Button", "Divider"].map(simple),
	},
	{ title: "Mídia", items: ["Image", "Video"].map(simple) },
	{
		title: "Conversão",
		items: ["Form", "Faq", "Countdown", "ProgressBar"].map(simple),
	},
	{
		title: "Avançado",
		items: [modalItem(), simple("FloatingButtons"), simple("Html")],
	},
];

export function Toolbox() {
	const { connectors } = useEditor();
	return (
		<div className="flex flex-col gap-5 p-4">
			<p className="text-[11px] text-muted-foreground">
				Arraste um elemento para dentro de uma seção no canvas.
			</p>
			{TOOLBOX_GROUPS.map((group) => (
				<div key={group.title} className="flex flex-col gap-2">
					<h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
						{group.title}
					</h3>
					<div className="grid grid-cols-3 gap-2">
						{group.items.map((item) => {
							const Icon = item.icon;
							return (
								<div
									key={item.key}
									ref={(el) => {
										if (el) connectors.create(el, item.create());
									}}
									className="flex aspect-square cursor-grab flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-center transition-colors select-none hover:border-primary hover:bg-primary/10 active:cursor-grabbing"
								>
									<Icon className="size-5 text-muted-foreground" />
									<span className="px-1 text-[10px] leading-tight">
										{item.label}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
}
