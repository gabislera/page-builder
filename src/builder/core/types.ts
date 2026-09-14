import type { Node, NodeHelpersType } from "@craftjs/core";
import type { LucideIcon } from "lucide-react";
import type { ComponentType, ReactNode, Ref } from "react";

export type ComponentCategory =
	| "structure"
	| "layout"
	| "basic"
	| "media"
	| "conversion"
	| "advanced";

export type NodeViewProps<P> = {
	id: string;
	props: P;
	children?: ReactNode;
	/** Ref do elemento raiz. No editor, conecta o nó ao Craft (seleção e drag). */
	rootRef?: Ref<HTMLElement>;
	/** Só no editor: altera uma prop do nó (edição inline). */
	onPropChange?: (path: string, value: unknown) => void;
};

/** Recursos de JS da página publicada que um componente precisa. */
export type RuntimeFeature =
	| "animations"
	| "modal"
	| "countdown"
	| "form"
	| "header"
	| "floating"
	| "video"
	| "progress";

type CraftRules = {
	canDrag?: (node: Node, helpers: NodeHelpersType) => boolean;
	canDrop?: (target: Node, current: Node, helpers: NodeHelpersType) => boolean;
	canMoveIn?: (
		incoming: Node[],
		current: Node,
		helpers: NodeHelpersType,
	) => boolean;
	canMoveOut?: (
		outgoing: Node[],
		current: Node,
		helpers: NodeHelpersType,
	) => boolean;
};

export type ComponentDefinition<P extends object = Record<string, unknown>> = {
	/** Nome registrado no resolver do Craft (vai para o JSON salvo). */
	type: string;
	displayName: string;
	category: ComponentCategory;
	icon: LucideIcon;
	defaults: P;
	isCanvas?: boolean;
	/** Aparece na Toolbox para arrastar. */
	inToolbox?: boolean;
	/** Não pode ser duplicado pela barra do nó (Header, Footer). */
	notDuplicable?: boolean;
	/** Não pode ser apagado (Page). */
	notDeletable?: boolean;
	View: (props: NodeViewProps<P>) => ReactNode;
	css: (id: string, props: P) => string;
	Settings: ComponentType;
	rules?: CraftRules;
	runtime?: RuntimeFeature[];
	/** Fontes usadas pelas props, para carregar do Google Fonts. */
	fonts?: (props: P) => string[];
};

// biome-ignore lint/suspicious/noExplicitAny: registro heterogêneo de componentes
export type AnyComponentDefinition = ComponentDefinition<any>;
