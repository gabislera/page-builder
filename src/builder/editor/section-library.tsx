import type { SerializedNodes } from "@craftjs/core";
import { useEditor } from "@craftjs/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Files, FileText, Globe, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { confirm } from "#/components/confirm-dialog";
import { Button } from "#/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "#/components/ui/dialog";
import { FEATURES } from "#/lib/features";
import { cn } from "#/lib/utils";
import { buildTree } from "../core/build.ts";
import { cloneTree, ROOT_ID, type SitePart } from "../core/tree.ts";
import { CONTENT_TEMPLATES } from "../templates/content.ts";
import { HEADER_FOOTER_TEMPLATES } from "../templates/headers-footers.ts";
import { INTERACTIVE_CATEGORIES, INTERACTIVE_TEMPLATES } from "../templates/interactive.ts";
import { SECTION_CATEGORIES, SECTION_TEMPLATES, type SectionTemplate } from "../templates/sections.ts";
import { AiSectionPanel } from "./ai-section-panel.tsx";
import { type SavedSection, useEditorContext } from "./context.tsx";
import { insertTree } from "./node-actions.ts";
import { SectionCard } from "./section-card.tsx";
import { useSectionPicker } from "./section-picker-store.ts";
import { PART_CATEGORY, type PartScope, useSitePart } from "./site-parts.tsx";

const GLOBAL_TAB = "Seções globais";
const SAVED_TAB = "Meus modelos";
const AI_TAB = "Gerar com IA";

const ALL_TEMPLATES: SectionTemplate[] = [
  ...HEADER_FOOTER_TEMPLATES,
  ...SECTION_TEMPLATES,
  ...CONTENT_TEMPLATES,
  ...INTERACTIVE_TEMPLATES,
];
const CATEGORIES = [
  "Cabeçalho",
  ...new Set([...SECTION_CATEGORIES, "Cards", "Preços", "Números", ...INTERACTIVE_CATEGORIES, "Galeria"]),
  "Rodapé",
];

/** Dialog with section templates and the project's global sections. */
export function SectionLibraryDialog() {
  const { isOpen, index, close, category: requested } = useSectionPicker();
  const [category, setCategory] = useState<string>(SECTION_CATEGORIES[0]);
  // when opened with a category (e.g. "Cabeçalho" in the Site panel), jump to it
  useEffect(() => {
    if (isOpen && requested) setCategory(requested);
  }, [isOpen, requested]);
  const editor = useEditor();
  const { services } = useEditorContext();

  const globals = useQuery({
    queryKey: ["global-sections"],
    queryFn: services.listGlobalSections,
    enabled: isOpen && category === GLOBAL_TAB,
  });

  const queryClient = useQueryClient();
  const saved = useQuery({
    queryKey: ["saved-sections"],
    queryFn: services.listSavedSections,
    enabled: isOpen && category === SAVED_TAB,
  });
  const removeSaved = useMutation({
    mutationFn: services.deleteSavedSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-sections"] });
      toast.success("Modelo excluído");
    },
    onError: (e) => toast.error(e.message),
  });

  const typeAt = (id: string) => editor.query.node(id).get().data.name;

  /**
   * Insertion index. Header always goes to the top and footer to the end;
   * sections never go above the header or below the footer.
   */
  const insertAt = (kind: SectionTemplate["kind"] = "section") => {
    const children = editor.query.node(ROOT_ID).get().data.nodes;
    if (kind === "header") return 0;
    if (kind === "footer") return children.length;
    const first = children[0] && typeAt(children[0]) === "Header" ? 1 : 0;
    const footer = children.findIndex((id) => typeAt(id) === "Footer");
    const last = footer === -1 ? children.length : footer;
    const wanted = index ?? last;
    return Math.min(Math.max(wanted, first), last);
  };

  /** Only one header and one footer: the new one replaces the current. */
  const removeExisting = (kind: SectionTemplate["kind"]) => {
    if (kind === "section") return;
    const type = kind === "header" ? "Header" : "Footer";
    for (const id of editor.query.node(ROOT_ID).get().data.nodes) {
      if (typeAt(id) === type) editor.actions.delete(id);
    }
  };

  const headerPart = useSitePart("header");
  const footerPart = useSitePart("footer");
  const partOf = (kind: SitePart) => (kind === "header" ? headerPart : footerPart);

  /** Header/footer waiting for the "all pages / this page only" choice. */
  type Pending = {
    kind: SitePart;
    make: () => { rootNodeId: string; nodes: SerializedNodes };
  };
  const [pending, setPending] = useState<Pending | null>(null);
  useEffect(() => {
    if (!isOpen) setPending(null);
  }, [isOpen]);

  const applyPart = (p: Pending, scope: PartScope) => {
    const part = partOf(p.kind);
    part.insertTemplate(p.make(), scope);
    setPending(null);
    close();
    toast.success(
      scope === "site" ? `${part.label} aplicado em todas as páginas` : `${part.label} aplicado só nesta página`,
    );
  };

  const insertTemplate = (id: string) => {
    const template = ALL_TEMPLATES.find((t) => t.id === id);
    if (!template) return;
    if (template.kind !== "section") {
      const p: Pending = {
        kind: template.kind,
        make: () => buildTree(template.build(), ROOT_ID),
      };
      // no site header/footer yet: this becomes the site one without asking
      if (!partOf(template.kind).stored) applyPart(p, "site");
      else setPending(p);
      return;
    }
    insertTree(editor, buildTree(template.build(), ROOT_ID), ROOT_ID, insertAt());
    close();
  };

  /** Saved template: inserted as a fresh copy (new ids, no links). */
  const insertSaved = (s: SavedSection) => {
    const make = () => cloneTree(s.nodes, s.rootNodeId, ROOT_ID);
    if (s.kind !== "section") {
      const p: Pending = { kind: s.kind, make };
      if (!partOf(s.kind).stored) applyPart(p, "site");
      else setPending(p);
      return;
    }
    insertTree(editor, make(), ROOT_ID, insertAt());
    close();
  };

  /** AI option: a fresh copy each time, so the same option can be inserted twice. */
  const insertGenerated = (tree: { rootNodeId: string; nodes: SerializedNodes }) => {
    insertTree(editor, cloneTree(tree.nodes, tree.rootNodeId, ROOT_ID), ROOT_ID, insertAt());
    close();
    toast.success("Seção inserida. Tudo nela pode ser editado.");
  };

  const insertGlobal = (section: { rootNodeId: string; kind: SectionTemplate["kind"]; nodes: SerializedNodes }) => {
    if (editor.query.getNodes()[section.rootNodeId]) {
      toast.error("Essa seção global já está nesta página.");
      return;
    }
    removeExisting(section.kind);
    const nodes = structuredClone(section.nodes);
    nodes[section.rootNodeId] = {
      ...nodes[section.rootNodeId],
      parent: ROOT_ID,
      custom: { ...nodes[section.rootNodeId].custom, isGlobal: true },
    };
    insertTree(editor, { rootNodeId: section.rootNodeId, nodes }, ROOT_ID, insertAt(section.kind));
    close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="flex h-[80vh] max-w-5xl flex-col gap-0 p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Adicionar seção</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1">
          <nav className="flex w-48 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border p-3">
            {[AI_TAB, ...CATEGORIES, SAVED_TAB, ...(FEATURES.globalSections ? [GLOBAL_TAB] : [])].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm hover:bg-accent",
                  category === c && "bg-accent font-medium",
                )}
              >
                {c === AI_TAB ? <Sparkles className="size-3.5 text-primary" /> : null}
                {c === GLOBAL_TAB ? <Globe className="size-3.5 text-sky-400" /> : null}
                {c === SAVED_TAB ? <Bookmark className="size-3.5 text-primary" /> : null}
                {c}
              </button>
            ))}
          </nav>
          {category === AI_TAB ? (
            <AiSectionPanel onInsert={insertGenerated} />
          ) : (
            <div className="grid flex-1 auto-rows-min grid-cols-2 gap-4 overflow-y-auto p-6">
              {category === SAVED_TAB ? (
                <>
                  {saved.isLoading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : null}
                  {saved.data?.length === 0 ? (
                    <p className="col-span-2 text-sm text-muted-foreground">
                      Nenhum modelo salvo ainda. Selecione uma seção na página e use "Salvar como modelo" no painel de
                      configurações. Seus modelos aparecem aqui em todos os seus projetos.
                    </p>
                  ) : null}
                  {saved.data?.map((s) => (
                    <div key={s.id} className="group/saved relative flex flex-col">
                      <SectionCard
                        title={s.name}
                        badge={s.kind === "header" ? "Cabeçalho" : s.kind === "footer" ? "Rodapé" : undefined}
                        tree={{ rootNodeId: s.rootNodeId, nodes: s.nodes }}
                        onClick={() => insertSaved(s)}
                      />
                      <button
                        type="button"
                        title="Excluir modelo"
                        className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md bg-background/90 text-muted-foreground opacity-0 shadow transition-opacity group-hover/saved:opacity-100 hover:text-destructive"
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Excluir modelo?",
                            description: (
                              <>
                                O modelo <strong>{s.name}</strong> sai da sua biblioteca. As páginas que já usam essa
                                seção não mudam.
                              </>
                            ),
                            confirmText: "Excluir modelo",
                            destructive: true,
                          });
                          if (ok) removeSaved.mutate(s.id);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </>
              ) : category === GLOBAL_TAB ? (
                <>
                  {globals.isLoading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : null}
                  {globals.data?.length === 0 ? (
                    <p className="col-span-2 text-sm text-muted-foreground">
                      Nenhuma seção global ainda. Selecione uma seção na página e ative "Seção global" no painel de
                      configurações para reutilizá-la em outras páginas.
                    </p>
                  ) : null}
                  {globals.data?.map((g) => (
                    <SectionCard
                      key={g.id}
                      title={g.name}
                      badge={`${g.usage} ${g.usage === 1 ? "página" : "páginas"}`}
                      tree={{ rootNodeId: g.rootNodeId, nodes: g.nodes }}
                      onClick={() => insertGlobal(g)}
                    />
                  ))}
                </>
              ) : (
                <>
                  {sitePartOfCategory(category) ? (
                    <CurrentSitePartCard part={sitePartOfCategory(category) as SitePart} onDone={close} />
                  ) : null}
                  {ALL_TEMPLATES.filter((t) => t.category === category).map((t) => (
                    <TemplateCard key={t.id} id={t.id} title={t.name} onClick={() => insertTemplate(t.id)} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        {pending ? (
          <ScopeChoice
            label={partOf(pending.kind).label}
            onChoose={(scope) => applyPart(pending, scope)}
            onCancel={() => setPending(null)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

const sitePartOfCategory = (category: string): SitePart | null =>
  category === PART_CATEGORY.header ? "header" : category === PART_CATEGORY.footer ? "footer" : null;

/** First card in Header/Footer categories: what the site uses today. */
function CurrentSitePartCard({ part, onDone }: { part: SitePart; onDone: () => void }) {
  const { stored, current, label, applySiteVersion } = useSitePart(part);
  if (!stored) return null;
  const inUse = Boolean(current?.isSite);
  return (
    <SectionCard
      title={`${label} atual do site`}
      badge={inUse ? "Nesta página" : "Usar nesta página"}
      tree={{ rootNodeId: stored.rootNodeId, nodes: stored.nodes }}
      onClick={() => {
        if (!inUse) applySiteVersion();
        onDone();
      }}
    />
  );
}

/** Asks where to apply the new header/footer. */
function ScopeChoice({
  label,
  onChoose,
  onCancel,
}: {
  label: string;
  onChoose: (scope: PartScope) => void;
  onCancel: () => void;
}) {
  const lower = label.toLowerCase();
  const option = (scope: PartScope, Icon: typeof Files, title: string, text: string) => (
    <button
      type="button"
      onClick={() => onChoose(scope)}
      className="flex flex-1 flex-col items-start gap-2 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
    >
      <Icon className="size-5 text-primary" />
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{text}</span>
    </button>
  );
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
      <div className="flex w-[520px] flex-col gap-4 rounded-xl border border-border bg-popover p-6 shadow-2xl">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold">Onde usar este {lower}?</h3>
          <p className="text-sm text-muted-foreground">
            Seu site já tem um {lower}. Escolha se o novo substitui o de todas as páginas ou só o desta.
          </p>
        </div>
        <div className="flex gap-3">
          {option(
            "site",
            Files,
            "Em todas as páginas",
            `Substitui o ${lower} do site. Páginas que usam o padrão mudam junto.`,
          )}
          {option("page", FileText, "Só nesta página", `As outras páginas continuam com o ${lower} atual do site.`)}
        </div>
        <Button variant="ghost" size="sm" className="self-end" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function TemplateCard({ id, title, onClick }: { id: string; title: string; onClick: () => void }) {
  const tree = useMemo(() => {
    const template = ALL_TEMPLATES.find((t) => t.id === id);
    return template ? buildTree(template.build(), ROOT_ID) : null;
  }, [id]);
  if (!tree) return null;
  return <SectionCard title={title} tree={tree} onClick={onClick} />;
}
