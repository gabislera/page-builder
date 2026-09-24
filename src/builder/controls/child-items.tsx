/**
 * Manages child items of a composite component (Accordion, Tabs,
 * Carousel...). Each item is a real node on the canvas, with free content
 * (any element can be dragged into it).
 */
import { useEditor, useNode } from "@craftjs/core";
import { ArrowDown, ArrowUp, Copy, MousePointer2, Plus, Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import { buildTree, type NodeSpec } from "../core/build.ts";
import { duplicateNode, insertTree } from "../editor/node-actions.ts";
import { Field } from "./field.tsx";

type ChildItemsFieldProps = {
  label: string;
  /** Child type (e.g. "AccordionItem"). Other types are ignored. */
  childType: string;
  /** Text that identifies the item in the list (e.g. the panel title). */
  itemLabel: (props: Record<string, unknown>, index: number) => string;
  /** New item to add (with initial content). */
  create: (index: number) => NodeSpec;
  addLabel?: string;
  /** Minimum items (does not allow removing below this). */
  min?: number;
};

export function ChildItemsField({
  label,
  childType,
  itemLabel,
  create,
  addLabel = "Adicionar item",
  min = 1,
}: ChildItemsFieldProps) {
  const { id } = useNode();
  const editor = useEditor();
  const { items } = useEditor((state) => ({
    items: (state.nodes[id]?.data.nodes ?? [])
      .map((childId) => state.nodes[childId])
      .filter((n) => n?.data.name === childType)
      .map((n) => ({
        id: n.id,
        props: n.data.props as Record<string, unknown>,
      })),
  }));

  const add = () => {
    const tree = buildTree(create(items.length), id);
    insertTree(editor, tree, id, undefined, false);
  };

  const move = (childId: string, delta: -1 | 1) => {
    const siblings = editor.query.node(id).get().data.nodes;
    const index = siblings.indexOf(childId);
    const target = index + delta;
    if (target < 0 || target >= siblings.length) return;
    // Craft counts the index before removing the node from its current position
    editor.actions.move(childId, id, delta > 0 ? target + 1 : target);
  };

  return (
    <Field label={label}>
      <div className="flex flex-col gap-1.5">
        {items.map((item, index) => (
          <div key={item.id} className="flex h-8 items-center gap-1 rounded-md border border-border bg-card px-2">
            <button
              type="button"
              title="Selecionar no canvas"
              onClick={() => editor.actions.selectNode(item.id)}
              className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-xs hover:text-primary"
            >
              <MousePointer2 className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{itemLabel(item.props, index) || `Item ${index + 1}`}</span>
            </button>
            <IconAction title="Subir" disabled={index === 0} onClick={() => move(item.id, -1)}>
              <ArrowUp className="size-3" />
            </IconAction>
            <IconAction title="Descer" disabled={index === items.length - 1} onClick={() => move(item.id, 1)}>
              <ArrowDown className="size-3" />
            </IconAction>
            <IconAction title="Duplicar" onClick={() => duplicateNode(editor, item.id)}>
              <Copy className="size-3" />
            </IconAction>
            <IconAction
              title="Remover"
              disabled={items.length <= min}
              danger
              onClick={() => editor.actions.delete(item.id)}
            >
              <Trash2 className="size-3" />
            </IconAction>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={add}>
          <Plus className="size-3.5" /> {addLabel}
        </Button>
      </div>
    </Field>
  );
}

function IconAction({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={
        danger
          ? "rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-30"
          : "rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
      }
    >
      {children}
    </button>
  );
}
