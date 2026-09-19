/**
 * Abas compostas: cada aba (TabItem) é um nó de verdade e o painel dela é um
 * canvas onde qualquer elemento pode ser arrastado.
 *
 * A barra de abas é montada pelo pai a partir dos rótulos dos itens (no
 * editor lendo o estado do Craft; na publicação, as props dos filhos). Assim
 * a barra tem um container próprio: estilo segmentado, sublinhado ou pílulas,
 * rolagem horizontal no celular e ARIA completo (tablist/tab/tabpanel).
 * Na página publicada, o runtime "tabs" troca a aba ativa; no editor, o
 * estado fica na view (React), fora do histórico de desfazer.
 */
import { useEditor } from "@craftjs/core";
import { Folders, PanelTop } from "lucide-react";
import {
	createContext,
	isValidElement,
	type ReactNode,
	useContext,
	useState,
} from "react";
import { cn } from "#/lib/utils";
import { ChildItemsField } from "../controls/child-items.tsx";
import { ColorField } from "../controls/color.tsx";
import { Field, Group } from "../controls/field.tsx";
import {
	BackgroundFields,
	BorderFields,
	BoxFields,
	SidesField,
	TypographyFields,
} from "../controls/groups.tsx";
import { IconField } from "../controls/icon.tsx";
import {
	NumberUnitField,
	SegmentedField,
	TextField,
} from "../controls/inputs.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { useNodeProps } from "../controls/use-field.ts";
import { h, type NodeSpec } from "../core/build.ts";
import { flattenChildren } from "../core/children.ts";
import {
	corners,
	defaultBackground,
	defaultBorder,
	defaultBox,
	defaultTypography,
	sides,
} from "../core/defaults.ts";
import { IconView } from "../core/icons.tsx";
import { useInlineEdit } from "../core/inline-edit.tsx";
import { nodeClassName, TOP_LEVEL_TYPES } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import {
	DEVICE_MEDIA,
	type Responsive,
	responsive,
} from "../core/responsive.ts";
import {
	applyBackground,
	applyBorder,
	applyBox,
	applyTypography,
	createSheet,
	nodeSelector,
	sidesToCss,
} from "../core/style-engine.ts";
import type {
	Background,
	Border,
	Box,
	Length,
	Sides,
	Typography,
} from "../core/style-types.ts";
import { C, FONT_BODY } from "../core/theme.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";
import { RevealOnSelect } from "./shared/editor-reveal.tsx";

/* ------------------------------------------------------------------ */
/* Abas (pai)                                                          */
/* ------------------------------------------------------------------ */

export type TabsVariant = "segmented" | "underline" | "pills";

export type TabsProps = {
	variant: TabsVariant;
	/** Abas em cima (horizontal) ou na lateral (vertical; vira horizontal no celular). */
	orientation: "horizontal" | "vertical";
	justify: "flex-start" | "center" | "flex-end" | "stretch";
	/** Largura da coluna de abas quando vertical. */
	navWidth: Responsive<Length>;
	/** Espaço entre a barra de abas e o conteúdo. */
	navGap: Responsive<Length>;
	tabTypography: Typography;
	tabPadding: Responsive<Sides>;
	activeColor: string;
	activeBackground: string;
	/** Cor do sublinhado (estilo sublinhado). */
	indicatorColor: string;
	listBackground: string;
	panelPadding: Responsive<Sides>;
	panelGap: Responsive<Length>;
	panelBackground: Background;
	panelBorder: Border;
	box: Box;
};

const VARIANTS: Record<TabsVariant, Partial<TabsProps>> = {
	segmented: {
		listBackground: C.surface,
		activeColor: C.text,
		activeBackground: C.background,
		tabPadding: responsive(
			sides("10px", "18px"),
			undefined,
			sides("8px", "14px"),
		),
	},
	underline: {
		listBackground: "",
		activeColor: C.text,
		activeBackground: "",
		tabPadding: responsive(
			sides("14px", "4px"),
			undefined,
			sides("12px", "2px"),
		),
	},
	pills: {
		listBackground: "",
		activeColor: "#ffffff",
		activeBackground: C.primary,
		tabPadding: responsive(
			sides("10px", "20px"),
			undefined,
			sides("8px", "16px"),
		),
	},
};

const TABS_DEFAULTS = {
	variant: "segmented",
	orientation: "horizontal",
	justify: "center",
	navWidth: responsive("240px"),
	navGap: responsive("32px", undefined, "20px"),
	tabTypography: defaultTypography({
		fontFamily: FONT_BODY,
		fontSize: responsive("15px", undefined, "14px"),
		fontWeight: "600",
		lineHeight: responsive("1.4"),
		color: C.textMuted,
	}),
	indicatorColor: C.primary,
	...VARIANTS.segmented,
	panelPadding: responsive(sides("0px")),
	panelGap: responsive("16px"),
	panelBackground: defaultBackground(),
	panelBorder: defaultBorder({ radius: responsive(corners("16px")) }),
	box: defaultBox({ width: responsive("100%") }),
} as TabsProps;

type TabInfo = { id: string; label: string; icon: string };

type TabsContextValue = {
	parentId: string;
	index: number;
	active: number;
	/** Só no editor: mostra a aba quando ela (ou algo dentro) é selecionada. */
	reveal?: (index: number) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

const tabId = (parentId: string, i: number) => `tab-${parentId}-${i}`;
const panelId = (parentId: string, i: number) => `tabpanel-${parentId}-${i}`;

function TabsView(view: NodeViewProps<TabsProps>) {
	return useIsEditor() ? <TabsEditor {...view} /> : <TabsStatic {...view} />;
}

/** Publicação: rótulos vêm das props dos filhos renderizados. */
function TabsStatic({
	id,
	props,
	children,
	rootRef,
}: NodeViewProps<TabsProps>) {
	const items = flattenChildren(children);
	const tabs: TabInfo[] = items.map((child, i) => {
		const p = isValidElement<{ props?: { label?: string; icon?: string } }>(
			child,
		)
			? child.props.props
			: undefined;
		return {
			id: String(i),
			label: p?.label ?? `Aba ${i + 1}`,
			icon: p?.icon ?? "",
		};
	});
	return (
		<TabsMarkup
			id={id}
			props={props}
			rootRef={rootRef}
			tabs={tabs}
			active={0}
			items={items}
		/>
	);
}

/** Editor: rótulos vêm do estado do Craft; a aba ativa é estado local. */
function TabsEditor({
	id,
	props,
	children,
	rootRef,
}: NodeViewProps<TabsProps>) {
	const items = flattenChildren(children);
	const { tabs, actions } = useEditor((state) => ({
		tabs: (state.nodes[id]?.data.nodes ?? []).map((childId, i) => {
			const p = (state.nodes[childId]?.data.props ?? {}) as {
				label?: string;
				icon?: string;
			};
			return {
				id: childId,
				label: p.label ?? `Aba ${i + 1}`,
				icon: p.icon ?? "",
			};
		}),
	}));
	const [picked, setActive] = useState(0);
	const active = Math.min(picked, Math.max(tabs.length - 1, 0));
	return (
		<TabsMarkup
			id={id}
			props={props}
			rootRef={rootRef}
			tabs={tabs}
			active={active}
			items={items}
			onSelect={(i) => {
				setActive(i);
				actions.selectNode(tabs[i]?.id);
			}}
			onRename={(i, label) =>
				actions.setProp(tabs[i].id, (p: { label: string }) => {
					p.label = label;
				})
			}
			reveal={setActive}
		/>
	);
}

function TabsMarkup({
	id,
	props,
	rootRef,
	tabs,
	active,
	items,
	onSelect,
	onRename,
	reveal,
}: {
	id: string;
	props: TabsProps;
	rootRef?: React.Ref<HTMLElement>;
	tabs: TabInfo[];
	active: number;
	items: ReactNode[];
	onSelect?: (index: number) => void;
	onRename?: (index: number, label: string) => void;
	reveal?: (index: number) => void;
}) {
	const empty = items.length === 0;
	return (
		<div
			ref={rootRef as React.Ref<HTMLDivElement>}
			className={nodeClassName(
				id,
				`pb-tabs pb-tabs-${props.variant}`,
				props.box,
			)}
			data-pb-node={id}
			data-pb-tabs=""
		>
			<div className="pb-tabs-nav">
				<div
					className="pb-tabs-list"
					role="tablist"
					aria-orientation={
						props.orientation === "vertical" ? "vertical" : "horizontal"
					}
				>
					{tabs.map((tab, i) => (
						<TabButton
							key={tab.id}
							parentId={id}
							index={i}
							tab={tab}
							active={i === active}
							onSelect={onSelect}
							onRename={onRename}
						/>
					))}
				</div>
			</div>
			<div className="pb-tabs-panels">
				{items.map((child, index) => (
					<TabsContext.Provider
						key={
							isValidElement(child) && child.key !== null ? child.key : index
						}
						value={{ parentId: id, index, active, reveal }}
					>
						{child}
					</TabsContext.Provider>
				))}
				{onSelect && empty ? (
					<div className="pb-placeholder">Adicione abas no painel</div>
				) : null}
			</div>
		</div>
	);
}

function TabButton({
	parentId,
	index,
	tab,
	active,
	onSelect,
	onRename,
}: {
	parentId: string;
	index: number;
	tab: TabInfo;
	active: boolean;
	onSelect?: (index: number) => void;
	onRename?: (index: number, label: string) => void;
}) {
	const edit = useInlineEdit(
		tab.label,
		onRename && ((v) => onRename(index, v)),
	);
	return (
		<button
			type="button"
			role="tab"
			id={tabId(parentId, index)}
			aria-controls={panelId(parentId, index)}
			aria-selected={active}
			tabIndex={active ? 0 : -1}
			className={cn("pb-tab-btn", active && "pb-tab-active")}
			onClick={onSelect && !edit.editing ? () => onSelect(index) : undefined}
		>
			{tab.icon ? <IconView name={tab.icon} className="pb-tab-icon" /> : null}
			<span ref={edit.ref as React.Ref<HTMLSpanElement>} {...edit.attrs}>
				{edit.editing ? null : tab.label}
			</span>
		</button>
	);
}

/** Miniaturas dos estilos prontos. */
function VariantPreview({ variant }: { variant: TabsVariant }) {
	if (variant === "segmented") {
		return (
			<span className="flex gap-0.5 rounded bg-muted-foreground/25 p-0.5">
				<span className="h-2 w-4 rounded-sm bg-foreground/70" />
				<span className="h-2 w-4" />
				<span className="h-2 w-4" />
			</span>
		);
	}
	if (variant === "underline") {
		return (
			<span className="flex gap-1.5 border-b border-muted-foreground/40">
				<span className="h-2 w-4 border-b-2 border-primary" />
				<span className="h-2 w-4" />
				<span className="h-2 w-4" />
			</span>
		);
	}
	return (
		<span className="flex gap-1">
			<span className="h-2 w-4 rounded-full bg-primary" />
			<span className="h-2 w-4 rounded-full bg-muted-foreground/25" />
			<span className="h-2 w-4 rounded-full bg-muted-foreground/25" />
		</span>
	);
}

function VariantPicker() {
	const { props, update } = useNodeProps<TabsProps>();
	const options: { value: TabsVariant; label: string }[] = [
		{ value: "segmented", label: "Segmentado" },
		{ value: "underline", label: "Sublinhado" },
		{ value: "pills", label: "Pílulas" },
	];
	return (
		<Field
			label="Estilo"
			hint="Aplica um visual pronto; depois dá para ajustar cada detalhe."
		>
			<div className="grid grid-cols-3 gap-1.5">
				{options.map((o) => (
					<button
						key={o.value}
						type="button"
						onClick={() =>
							update((draft) => {
								Object.assign(draft, structuredClone(VARIANTS[o.value]), {
									variant: o.value,
								});
							})
						}
						className={cn(
							"flex flex-col items-center gap-2 rounded-md border p-2 text-[11px]",
							props.variant === o.value
								? "border-primary bg-primary/10"
								: "border-border text-muted-foreground hover:border-muted-foreground/50",
						)}
					>
						<span className="flex h-6 items-center">
							<VariantPreview variant={o.value} />
						</span>
						{o.label}
					</button>
				))}
			</div>
		</Field>
	);
}

function TabsSettings() {
	const { props } = useNodeProps<TabsProps>();
	return (
		<SettingsTabs
			content={
				<Group title="Abas">
					<ChildItemsField
						label="Abas"
						childType="TabItem"
						itemLabel={(p) => String(p.label ?? "")}
						addLabel="Adicionar aba"
						create={(i) =>
							h("TabItem", { label: `Aba ${i + 1}` }, [
								h("Text", { html: "<p>Conteúdo da aba.</p>" }),
							])
						}
						min={1}
					/>
					<p className="text-[11px] text-muted-foreground">
						Dê dois cliques no nome de uma aba no canvas para renomear.
					</p>
				</Group>
			}
			style={
				<>
					<Group title="Estilo pronto">
						<VariantPicker />
					</Group>
					<Group title="Barra de abas">
						<SegmentedField
							path="orientation"
							label="Posição"
							options={[
								{ value: "horizontal", label: "Em cima" },
								{ value: "vertical", label: "Na lateral" },
							]}
						/>
						<SegmentedField
							path="justify"
							label="Alinhamento"
							options={[
								{ value: "flex-start", label: "Início" },
								{ value: "center", label: "Centro" },
								{ value: "flex-end", label: "Fim" },
								{ value: "stretch", label: "Esticar" },
							]}
						/>
						{props.orientation === "vertical" ? (
							<NumberUnitField
								path="navWidth"
								label="Largura da coluna"
								units={["px", "%"]}
								max={480}
							/>
						) : null}
						<NumberUnitField
							path="navGap"
							label="Espaço até o conteúdo"
							units={["px", "rem"]}
							max={120}
						/>
						<ColorField
							path="listBackground"
							label="Fundo da barra"
							allowEmpty
						/>
					</Group>
					<Group title="Aba" defaultOpen={false}>
						<TypographyFields base="tabTypography" withAlign={false} />
						<SidesField
							path="tabPadding"
							label="Espaço interno"
							units={["px", "rem"]}
						/>
						<ColorField path="activeColor" label="Texto da aba ativa" />
						<ColorField
							path="activeBackground"
							label="Fundo da aba ativa"
							allowEmpty
						/>
						{props.variant === "underline" ? (
							<ColorField path="indicatorColor" label="Cor do sublinhado" />
						) : null}
					</Group>
					<Group title="Conteúdo" defaultOpen={false}>
						<SidesField
							path="panelPadding"
							label="Espaço interno"
							units={["px", "rem"]}
						/>
						<NumberUnitField
							path="panelGap"
							label="Espaço entre elementos"
							units={["px", "rem"]}
							max={80}
						/>
						<BackgroundFields base="panelBackground" />
						<BorderFields base="panelBorder" />
					</Group>
				</>
			}
			advanced={<BoxFields />}
		/>
	);
}

export const Tabs: ComponentDefinition<TabsProps> = {
	type: "Tabs",
	displayName: "Abas",
	category: "layout",
	icon: Folders,
	isCanvas: true,
	inToolbox: true,
	defaults: TABS_DEFAULTS,
	runtime: ["tabs"],
	rules: {
		canMoveIn: (incoming) => incoming.every((n) => n.data.name === "TabItem"),
	},
	View: TabsView,
	css: (id, p) => {
		const sheet = createSheet(id);
		const S = nodeSelector(id);
		const ease = "cubic-bezier(.4,0,.2,1)";
		const vertical = p.orientation === "vertical";
		const stretch = p.justify === "stretch";

		const root = sheet.root();
		root
			.set("display", "flex")
			.set("flex-direction", vertical ? "row" : "column")
			.set("gap", p.navGap);

		// barra
		const nav = sheet.rule(" > .pb-tabs-nav");
		nav.set("display", "flex").set("min-width", "0");
		if (vertical) nav.set("flex", "0 0 auto").set("width", p.navWidth);
		else nav.set("justify-content", stretch ? "stretch" : p.justify);

		const list = sheet.rule(" > .pb-tabs-nav > .pb-tabs-list");
		list
			.set("display", "flex")
			.set("flex-direction", vertical ? "column" : "row")
			.set("max-width", "100%")
			.set("overflow-x", "auto")
			.set("scrollbar-width", "none")
			.set("background-color", p.listBackground);
		if (stretch || vertical) list.set("width", "100%");
		sheet
			.rule(" > .pb-tabs-nav > .pb-tabs-list::-webkit-scrollbar")
			.set("display", "none");

		const btn = sheet.rule(" > .pb-tabs-nav > .pb-tabs-list > .pb-tab-btn");
		btn
			.set("display", "inline-flex")
			.set("align-items", "center")
			.set("justify-content", vertical ? "flex-start" : "center")
			.set("gap", "8px")
			.set("white-space", "nowrap")
			.set("border", "0")
			.set("background", "transparent")
			.set("cursor", "pointer")
			.set("padding", p.tabPadding, sidesToCss)
			.set(
				"transition",
				`color .2s ${ease}, background-color .2s ${ease}, box-shadow .2s ${ease}`,
			);
		if (stretch) btn.set("flex", "1");
		applyTypography(btn, p.tabTypography);
		sheet
			.rule(" > .pb-tabs-nav > .pb-tabs-list > .pb-tab-btn:hover")
			.set("color", p.activeColor);
		const active = sheet.rule(
			" > .pb-tabs-nav > .pb-tabs-list > .pb-tab-btn.pb-tab-active",
		);
		active
			.set("color", p.activeColor)
			.set("background-color", p.activeBackground);
		sheet
			.rule(" > .pb-tabs-nav > .pb-tabs-list > .pb-tab-btn:focus-visible")
			.set("outline", `2px solid ${C.primary}`)
			.set("outline-offset", "2px");
		sheet
			.rule(" > .pb-tabs-nav > .pb-tabs-list > .pb-tab-btn > .pb-tab-icon")
			.set("width", "1.1em")
			.set("height", "1.1em");

		if (p.variant === "segmented") {
			list.set("gap", "4px").set("padding", "4px").set("border-radius", "14px");
			btn.set("border-radius", "10px");
			active.set(
				"box-shadow",
				"0 1px 2px rgba(0,0,0,.06), 0 2px 8px -2px rgba(0,0,0,.12)",
			);
		} else if (p.variant === "underline") {
			list
				.set("gap", vertical ? "2px" : "28px")
				.set(
					vertical ? "border-left" : "border-bottom",
					`1px solid ${C.border}`,
				);
			btn.set("border-radius", "0");
			active.set(
				"box-shadow",
				vertical
					? `inset 2px 0 0 ${p.indicatorColor}`
					: `inset 0 -2px 0 ${p.indicatorColor}`,
			);
			if (vertical) btn.set("padding-left", "16px");
		} else {
			list.set("gap", "8px").set("flex-wrap", vertical ? "nowrap" : "wrap");
			btn.set("border-radius", "999px");
		}

		// conteúdo
		const panels = sheet.rule(" > .pb-tabs-panels");
		panels.set("flex", "1").set("min-width", "0");
		const panel = sheet.rule(" > .pb-tabs-panels > .pb-tab-panel");
		panel
			.set("display", "none")
			.set("flex-direction", "column")
			.set("gap", p.panelGap)
			.set("padding", p.panelPadding, sidesToCss);
		applyBackground(panel, p.panelBackground);
		applyBorder(panel, p.panelBorder);
		sheet
			.rule(" > .pb-tabs-panels > .pb-tab-panel.pb-tab-active")
			.set("display", "flex")
			.set("animation", `pb-tab-in .35s ${ease}`);

		// celular: aba lateral vira barra horizontal com rolagem
		if (vertical && DEVICE_MEDIA.mobile) {
			root.setOn("mobile", "flex-direction", "column");
			nav.setOn("mobile", "width", "100%");
			list.setOn("mobile", "flex-direction", "row");
		}

		applyBox(sheet, p.box, "flex");
		sheet.appendRaw(
			`@keyframes pb-tab-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}` +
				`@media (prefers-reduced-motion:reduce){${S} .pb-tab-panel{animation:none !important}}`,
		);
		return sheet.toString();
	},
	Settings: TabsSettings,
	fonts: (p) => [p.tabTypography.fontFamily],
};

/* ------------------------------------------------------------------ */
/* Aba (filho)                                                         */
/* ------------------------------------------------------------------ */

export type TabItemProps = {
	label: string;
	/** Ícone do lucide antes do rótulo (opcional). */
	icon: string;
	box: Box;
};

function TabItemView({
	id,
	props: _props,
	children,
	rootRef,
}: NodeViewProps<TabItemProps>) {
	const isEditor = useIsEditor();
	const ctx = useContext(TabsContext);
	const index = ctx?.index ?? 0;
	const active = ctx ? ctx.active === index : true;
	const empty = !children || (Array.isArray(children) && children.length === 0);
	return (
		<div
			ref={rootRef as React.Ref<HTMLDivElement>}
			role="tabpanel"
			id={ctx ? panelId(ctx.parentId, index) : undefined}
			aria-labelledby={ctx ? tabId(ctx.parentId, index) : undefined}
			className={cn(
				nodeClassName(id, "pb-tab-panel", _props.box),
				active && "pb-tab-active",
			)}
			data-pb-node={id}
		>
			{children}
			{isEditor && empty ? (
				<div className="pb-placeholder">Arraste elementos para esta aba</div>
			) : null}
			{isEditor ? (
				<RevealOnSelect
					id={id}
					onReveal={(selected) => {
						if (selected && !active) ctx?.reveal?.(index);
					}}
				/>
			) : null}
		</div>
	);
}

function TabItemSettings() {
	return (
		<SettingsTabs
			content={
				<Group title="Aba">
					<TextField path="label" label="Nome da aba" />
					<IconField path="icon" label="Ícone" allowNone />
					<p className="text-[11px] text-muted-foreground">
						A aparência de todas as abas fica nas configurações das Abas.
					</p>
				</Group>
			}
			advanced={<BoxFields withSize={false} />}
		/>
	);
}

const ITEM_BLOCKED = new Set(["Page", "Tabs", "TabItem"]);

export const TabItem: ComponentDefinition<TabItemProps> = {
	type: "TabItem",
	displayName: "Aba",
	category: "layout",
	icon: PanelTop,
	isCanvas: true,
	inToolbox: false,
	defaults: { label: "Aba", icon: "", box: defaultBox() },
	rules: {
		canDrop: (target) => target.data.name === "Tabs",
		canMoveIn: (incoming) =>
			incoming.every(
				(n) =>
					!TOP_LEVEL_TYPES.has(n.data.name) && !ITEM_BLOCKED.has(n.data.name),
			),
	},
	View: TabItemView,
	css: (id, p) => {
		const sheet = createSheet(id);
		// a visibilidade por dispositivo é da aba ativa; aqui só a caixa
		applyBox(sheet, { ...p.box, visible: undefined }, "flex");
		return sheet.toString();
	},
	Settings: TabItemSettings,
};

/** Abas iniciais (Toolbox): 3 abas com texto. */
export const tabsSpec = (): NodeSpec =>
	h(
		"Tabs",
		{},
		["Visão geral", "Detalhes", "Perguntas"].map((label) =>
			h("TabItem", { label }, [
				h("Text", { html: `<p>Conteúdo da aba ${label}.</p>` }),
			]),
		),
	);
