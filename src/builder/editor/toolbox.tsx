import { Element, useEditor } from "@craftjs/core";
import { CircleHelp, ListOrdered } from "lucide-react";
import type { ComponentType, ReactElement } from "react";
import { toast } from "sonner";
import { accordionSpec, faqSpec } from "../components/accordion.tsx";
import { carouselSpec } from "../components/carousel.tsx";
import { containerPresets } from "../components/container.tsx";
import { multiStepFormProps } from "../components/form.tsx";
import { tabsSpec } from "../components/tabs.tsx";
import { deepMerge, type NodeSpec } from "../core/build.ts";
import { TOP_BAR_TYPE } from "../core/node-helpers.ts";
import { responsive } from "../core/responsive.ts";
import { ROOT_ID } from "../core/tree.ts";
import { COMPONENTS } from "../registry.ts";
import { resolver } from "../resolver.ts";

type ToolboxIcon = ComponentType<{ className?: string }>;

type EditorApi = ReturnType<typeof useEditor>;

type ToolboxItem = {
	key: string;
	label: string;
	icon: ToolboxIcon;
	create: () => ReactElement;
	/** Clique no item (além de arrastar), para elementos de lugar fixo. */
	onClick?: (editor: EditorApi) => void;
	hint?: string;
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

/** Barra de aviso: só existe um lugar (topo), então um clique já adiciona. */
const topBarItem = (): ToolboxItem => ({
	...simple(TOP_BAR_TYPE),
	hint: "Clique para adicionar no topo da página",
	onClick: ({ actions, query }) => {
		const existing = query
			.node(ROOT_ID)
			.get()
			.data.nodes.find((id) => query.node(id).get().data.name === TOP_BAR_TYPE);
		if (existing) {
			actions.selectNode(existing);
			toast("A página já tem uma barra de aviso", {
				description: "Ela está selecionada para você editar.",
			});
			return;
		}
		const tree = query
			.parseReactElement(simple(TOP_BAR_TYPE).create())
			.toNodeTree();
		actions.addNodeTree(tree, ROOT_ID, 0);
		actions.selectNode(tree.rootNodeId);
	},
});

const columns = (
	n: number,
	label: string,
	icon: ToolboxIcon,
	template = "",
): ToolboxItem => ({
	key: `columns-${n}-${template || "iguais"}`,
	label,
	icon,
	create: () => (
		<Element
			is={C.Container}
			canvas
			{...containerPresets.grid(n, template)}
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

/** Miniatura das colunas na proporção real (mais clara que "1/3 + 2/3"). */
function columnsGlyph(ratios: number[]): ToolboxIcon {
	const total = ratios.reduce((a, b) => a + b, 0);
	const gap = 1.5;
	const width = 20 - gap * (ratios.length - 1);
	function ColumnsGlyph({ className }: { className?: string }) {
		let x = 2;
		return (
			<svg viewBox="0 0 24 24" className={className} aria-hidden="true">
				{ratios.map((r, i) => {
					const w = (width * r) / total;
					const rect = (
						<rect
							// biome-ignore lint/suspicious/noArrayIndexKey: colunas fixas
							key={i}
							x={x}
							y={5}
							width={w}
							height={14}
							rx={1.5}
							fill="none"
							stroke="currentColor"
							strokeWidth={1.6}
						/>
					);
					x += w + gap;
					return rect;
				})}
			</svg>
		);
	}
	return ColumnsGlyph;
}

/** Converte um NodeSpec (usado nos modelos) em elementos do Craft. */
function specToElement(spec: NodeSpec, key?: string): ReactElement {
	const def = COMPONENTS[spec.type];
	const props = deepMerge(
		structuredClone(def.defaults),
		spec.props ?? {},
	) as Record<string, unknown>;
	const children = (spec.children ?? []).map((child, i) =>
		specToElement(child, `c${i}`),
	);
	return (
		<Element
			key={key}
			is={C[spec.type]}
			canvas={def.isCanvas}
			{...props}
			custom={spec.name ? { displayName: spec.name } : undefined}
		>
			{children.length ? children : undefined}
		</Element>
	);
}

/** Componente composto que já nasce com itens (Acordeão, Abas, Carrossel). */
const composite = (type: string, spec: () => NodeSpec): ToolboxItem => {
	const def = COMPONENTS[type];
	return {
		key: type,
		label: def.displayName,
		icon: def.icon,
		create: () => specToElement(spec()),
	};
};

export const TOOLBOX_GROUPS: { title: string; items: ToolboxItem[] }[] = [
	{
		title: "Layout",
		items: [
			simple("Container"),
			columns(2, "2 colunas", columnsGlyph([1, 1])),
			columns(3, "3 colunas", columnsGlyph([1, 1, 1])),
			columns(2, "Estreita + larga", columnsGlyph([1, 2]), "1fr 2fr"),
			columns(2, "Larga + estreita", columnsGlyph([2, 1]), "2fr 1fr"),
			simple("Spacer"),
			composite("Accordion", accordionSpec),
			composite("Tabs", tabsSpec),
		],
	},
	{
		title: "Site",
		items: ["Logo", "Menu", "SocialIcons"].map(simple),
	},
	{
		title: "Básico",
		items: [
			"Heading",
			"Text",
			"Button",
			"Icon",
			"IconList",
			"IconBox",
			"StatCounter",
			"ShareButtons",
			"Card",
			"Divider",
		].map(simple),
	},
	{
		title: "Mídia",
		items: [
			simple("Image"),
			simple("Video"),
			simple("Gallery"),
			simple("BeforeAfter"),
			simple("Map"),
			composite("Carousel", carouselSpec),
		],
	},
	{
		title: "Conversão",
		items: [
			simple("Form"),
			{
				key: "form-steps",
				label: "Formulário em etapas",
				icon: ListOrdered,
				create: () =>
					specToElement({ type: "Form", props: multiStepFormProps() }),
			},
			{
				key: "faq",
				label: "Perguntas frequentes",
				icon: CircleHelp,
				create: () => specToElement(faqSpec()),
			},
			topBarItem(),
			...["Countdown", "ProgressBar", "Testimonial", "PricingTable"].map(
				simple,
			),
		],
	},
	{
		title: "Avançado",
		items: [modalItem(), simple("FloatingButtons"), simple("Html")],
	},
];

export function Toolbox() {
	const editor = useEditor();
	const { connectors } = editor;
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
									title={item.hint}
									onClick={
										item.onClick ? () => item.onClick?.(editor) : undefined
									}
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
