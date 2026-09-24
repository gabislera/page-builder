import type { Node, NodeHelpersType } from "@craftjs/core";
import type { LucideIcon } from "lucide-react";
import type { ComponentType, ReactNode, Ref } from "react";

export type ComponentCategory = "structure" | "layout" | "basic" | "media" | "conversion" | "advanced";

export type NodeViewProps<P> = {
  id: string;
  props: P;
  children?: ReactNode;
  /** Root element ref. In the editor, connects the node to Craft (selection and drag). */
  rootRef?: Ref<HTMLElement>;
  /** Editor only: changes a node prop (inline edit). */
  onPropChange?: (path: string, value: unknown) => void;
};

/** Published-page JS features a component needs. */
export type RuntimeFeature =
  | "animations"
  | "modal"
  | "countdown"
  | "form"
  | "header"
  | "floating"
  | "video"
  | "progress"
  | "menu"
  | "motion"
  | "gallery"
  | "tabs"
  | "carousel"
  | "accordion"
  | "counter"
  | "announcement"
  | "share";

type CraftRules = {
  canDrag?: (node: Node, helpers: NodeHelpersType) => boolean;
  canDrop?: (target: Node, current: Node, helpers: NodeHelpersType) => boolean;
  canMoveIn?: (incoming: Node[], current: Node, helpers: NodeHelpersType) => boolean;
  canMoveOut?: (outgoing: Node[], current: Node, helpers: NodeHelpersType) => boolean;
};

export type ComponentDefinition<P extends object = Record<string, unknown>> = {
  /** Name registered in the Craft resolver (goes into the saved JSON). */
  type: string;
  displayName: string;
  category: ComponentCategory;
  icon: LucideIcon;
  defaults: P;
  isCanvas?: boolean;
  /** Shown in the Toolbox for dragging. */
  inToolbox?: boolean;
  /** Cannot be duplicated from the node bar (Header, Footer). */
  notDuplicable?: boolean;
  /** Cannot be deleted (Page). */
  notDeletable?: boolean;
  View: (props: NodeViewProps<P>) => ReactNode;
  css: (id: string, props: P) => string;
  Settings: ComponentType;
  rules?: CraftRules;
  runtime?: RuntimeFeature[];
  /** Fonts used by the props, to load from Google Fonts. */
  fonts?: (props: P) => string[];
};

// biome-ignore lint/suspicious/noExplicitAny: heterogeneous component registry
export type AnyComponentDefinition = ComponentDefinition<any>;
