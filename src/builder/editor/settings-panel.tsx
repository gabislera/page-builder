import { type Node, NodeProvider, useEditor } from "@craftjs/core";
import { ArrowUpToLine, ChevronRight, Globe, MousePointer2, Unlink } from "lucide-react";
import { createElement } from "react";
import { Button } from "#/components/ui/button";
import { Switch } from "#/components/ui/switch";
import { FEATURES } from "#/lib/features";
import { DebouncedInput } from "../controls/inputs.tsx";
import { ROOT_ID } from "../core/tree.ts";
import { COMPONENTS } from "../registry.ts";
import { unlinkGlobal } from "./node-actions.ts";
import { canSaveAsTemplate, SaveAsTemplateButton } from "./save-template.tsx";
import { SitePartCard } from "./site-parts.tsx";

/** Componentes compostos: o filho selecionado ganha atalho para o pai. */
const COMPOUND_PARENTS = new Set(["Tabs", "Accordion", "Carousel"]);

/** Ids da seção (filho da Página) até o nó, em ordem. */
function ancestors(nodes: Record<string, Node>, id: string): string[] {
  const out: string[] = [];
  let current: string | null | undefined = id;
  while (current && current !== ROOT_ID && nodes[current]) {
    out.unshift(current);
    current = nodes[current].data.parent;
  }
  return out;
}

/** Painel direito: configurações do nó selecionado. */
export function SettingsPanel() {
  const editor = useEditor((state) => {
    const [id] = state.events.selected;
    if (!id || !state.nodes[id]) return { selected: null };
    const node = state.nodes[id];
    return {
      selected: {
        id,
        type: node.data.name,
        displayName: node.data.displayName,
        customName: (node.data.custom?.displayName as string) ?? "",
        isTopLevel: node.data.parent === ROOT_ID,
        isGlobal: Boolean(node.data.custom?.isGlobal),
        sitePart: node.data.custom?.sitePart as string | undefined,
        isSiteBlock: node.data.name === "Header" || node.data.name === "Footer",
        settings: node.related?.settings,
        // caminho da página até o nó (sem a Página): Seção › Abas › Aba
        path: ancestors(state.nodes, id).map((ancestorId) => {
          const n = state.nodes[ancestorId];
          return {
            id: ancestorId,
            name: (n.data.custom?.displayName as string) || n.data.displayName,
            type: n.data.name,
          };
        }),
      },
    };
  });
  const { selected, actions } = editor;

  if (!selected) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
        <MousePointer2 className="size-6" />
        <p className="text-xs">Selecione um elemento no canvas para editar.</p>
      </div>
    );
  }

  const def = COMPONENTS[selected.type];
  const Icon = def?.icon;

  const parent = selected.path.at(-2);
  const compound = parent && COMPOUND_PARENTS.has(parent.type) ? parent : null;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 border-b border-border p-4">
        {selected.path.length > 1 ? (
          <nav aria-label="Caminho do elemento" className="flex flex-wrap items-center gap-0.5 text-[11px]">
            {selected.path.map((item, i) => {
              const last = i === selected.path.length - 1;
              return (
                <span key={item.id} className="flex items-center gap-0.5">
                  <button
                    type="button"
                    disabled={last}
                    onClick={() => actions.selectNode(item.id)}
                    className={
                      last
                        ? "rounded px-1 py-0.5 font-medium text-foreground"
                        : "rounded px-1 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    }
                  >
                    {item.name}
                  </button>
                  {last ? null : <ChevronRight className="size-3 text-muted-foreground/60" />}
                </span>
              );
            })}
          </nav>
        ) : null}
        {compound ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8 justify-start text-xs"
            onClick={() => actions.selectNode(compound.id)}
          >
            <ArrowUpToLine className="size-3.5" />
            Editar {compound.name} (elemento principal)
          </Button>
        ) : null}
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="size-4 text-primary" /> : null}
          <span className="text-xs font-semibold">{selected.displayName}</span>
        </div>
        {selected.id !== ROOT_ID ? (
          <DebouncedInput
            value={selected.customName}
            placeholder={`Nome (ex.: ${selected.displayName} principal)`}
            onChange={(v) =>
              actions.setCustom(selected.id, (custom: Record<string, unknown>) => {
                custom.displayName = v || undefined;
              })
            }
          />
        ) : null}
        {selected.isSiteBlock ? (
          <SitePartCard part={selected.type === "Header" ? "header" : "footer"} />
        ) : selected.isTopLevel && FEATURES.globalSections ? (
          <GlobalToggle
            isGlobal={selected.isGlobal}
            onChange={(v) =>
              actions.setCustom(selected.id, (custom: Record<string, unknown>) => {
                custom.isGlobal = v;
              })
            }
            onUnlink={() => unlinkGlobal(editor, selected.id)}
          />
        ) : null}
        {selected.isTopLevel && canSaveAsTemplate(selected.type) ? (
          <SaveAsTemplateButton
            nodeId={selected.id}
            type={selected.type}
            defaultName={selected.customName || selected.displayName}
          />
        ) : null}
      </div>
      {selected.settings ? (
        <NodeProvider key={selected.id} id={selected.id}>
          {createElement(selected.settings)}
        </NodeProvider>
      ) : null}
    </div>
  );
}

function GlobalToggle({
  isGlobal,
  onChange,
  onUnlink,
}: {
  isGlobal: boolean;
  onChange: (v: boolean) => void;
  onUnlink: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-3">
      <label className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <Globe className="size-3.5 text-sky-400" /> Seção global
        </span>
        <Switch checked={isGlobal} onCheckedChange={onChange} />
      </label>
      <p className="text-[11px] text-muted-foreground">
        {isGlobal
          ? "Alterações aparecem em todas as páginas que usam esta seção."
          : "Reutilize esta seção em outras páginas do projeto."}
      </p>
      {isGlobal ? (
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onUnlink}>
          <Unlink className="size-3" /> Desvincular (virar cópia local)
        </Button>
      ) : null}
    </div>
  );
}

/** Configurações da página (nó ROOT) no painel esquerdo. */
export function PageStylesPanel() {
  const { settings } = useEditor((state) => ({
    settings: state.nodes[ROOT_ID]?.related?.settings,
  }));
  if (!settings) return null;
  return <NodeProvider id={ROOT_ID}>{createElement(settings)}</NodeProvider>;
}
