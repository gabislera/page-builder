import type { SerializedNodes } from "@craftjs/core";
import { useEditor } from "@craftjs/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Files, FileText, Globe, Loader2, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { confirm } from "#/components/confirm-dialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "#/components/ui/dialog";
import { FEATURES } from "#/lib/features";
import { cn } from "#/lib/utils";
import { BASE_CSS } from "../core/base-css.ts";
import { buildRoot, buildTree } from "../core/build.ts";
import { googleFontsHref } from "../core/style-engine.ts";
import { cloneTree, ROOT_ID, type SitePart } from "../core/tree.ts";
import { renderBody } from "../renderer/render-page.tsx";
import { CONTENT_TEMPLATES } from "../templates/content.ts";
import { HEADER_FOOTER_TEMPLATES } from "../templates/headers-footers.ts";
import { INTERACTIVE_CATEGORIES, INTERACTIVE_TEMPLATES } from "../templates/interactive.ts";
import { SECTION_CATEGORIES, SECTION_TEMPLATES, type SectionTemplate } from "../templates/sections.ts";
import { type SavedSection, useEditorContext } from "./context.tsx";
import { insertTree } from "./node-actions.ts";
import { useSectionPicker } from "./section-picker-store.ts";
import { PART_CATEGORY, type PartScope, useSitePart } from "./site-parts.tsx";
import { useSiteStore } from "./site-store.ts";

const GLOBAL_TAB = "Seções globais";
const SAVED_TAB = "Meus modelos";

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

/** Diálogo com modelos de seção e seções globais do projeto. */
export function SectionLibraryDialog() {
  const { isOpen, index, close, category: requested } = useSectionPicker();
  const [category, setCategory] = useState<string>(SECTION_CATEGORIES[0]);
  // ao abrir pedindo uma categoria (ex.: "Cabeçalho" no painel Site), vai direto nela
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
   * Posição de inserção. Cabeçalho vai sempre no topo e rodapé no fim;
   * seções nunca entram acima do cabeçalho nem abaixo do rodapé.
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

  /** Só existe um cabeçalho e um rodapé: o novo substitui o atual. */
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

  /** Cabeçalho/rodapé esperando a escolha "todas as páginas / só esta". */
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
      // sem cabeçalho/rodapé no site ainda: este vira o do site sem perguntar
      if (!partOf(template.kind).stored) applyPart(p, "site");
      else setPending(p);
      return;
    }
    insertTree(editor, buildTree(template.build(), ROOT_ID), ROOT_ID, insertAt());
    close();
  };

  /** Modelo salvo: entra como cópia nova (ids novos, sem vínculos). */
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
            {[...CATEGORIES, SAVED_TAB, ...(FEATURES.globalSections ? [GLOBAL_TAB] : [])].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm hover:bg-accent",
                  category === c && "bg-accent font-medium",
                )}
              >
                {c === GLOBAL_TAB ? <Globe className="size-3.5 text-sky-400" /> : null}
                {c === SAVED_TAB ? <Bookmark className="size-3.5 text-primary" /> : null}
                {c}
              </button>
            ))}
          </nav>
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

/** Primeiro cartão das categorias Cabeçalho/Rodapé: o que o site usa hoje. */
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

/** Pergunta onde aplicar o novo cabeçalho/rodapé. */
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

/** Prévia real da seção: renderizada pelo mesmo renderizador da publicação. */
function SectionCard({
  title,
  badge,
  tree,
  onClick,
}: {
  title: string;
  badge?: string;
  tree: { rootNodeId: string; nodes: SerializedNodes };
  onClick: () => void;
}) {
  const site = useSiteStore((s) => s.settings);
  const srcDoc = useMemo(() => {
    const root = { ...buildRoot(), nodes: [tree.rootNodeId] };
    const nodes: SerializedNodes = { ...tree.nodes, [ROOT_ID]: root };
    nodes[tree.rootNodeId] = { ...nodes[tree.rootNodeId], parent: ROOT_ID };
    const { html, css, fonts } = renderBody({
      pageId: "preview",
      nodes,
      pageUrl: () => "#",
      site,
      homeUrl: "#",
    });
    const href = googleFontsHref(fonts);
    return `<!doctype html><html><head>${href ? `<link rel="stylesheet" href="${href}">` : ""}<style>${BASE_CSS}${css}.pb-page{min-height:0}</style></head><body>${html}</body></html>`;
  }, [tree, site]);

  // a prévia é renderizada a 1280px e reduzida para a largura do cartão
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition hover:border-primary hover:ring-2 hover:ring-primary/30"
    >
      <div ref={boxRef} className="relative aspect-[16/7] w-full overflow-hidden bg-white">
        <iframe
          title={title}
          srcDoc={srcDoc}
          tabIndex={-1}
          className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
          style={{
            width: 1280,
            height: 560,
            transform: `scale(${width / 1280})`,
          }}
        />
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-medium">{title}</span>
        {badge ? <Badge variant="secondary">{badge}</Badge> : null}
      </div>
    </button>
  );
}
