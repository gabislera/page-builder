import type { SerializedNodes } from "@craftjs/core";
import { useEditor } from "@craftjs/core";
import { AlertCircle, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useRef } from "react";
import { create } from "zustand";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { cn } from "#/lib/utils";
import { compileSection } from "../ai/compile.ts";
import { pageOutline } from "../ai/outline.ts";
import { VARIATIONS } from "../ai/prompt.ts";
import type { SectionSpec } from "../ai/spec.ts";
import { buildTree } from "../core/build.ts";
import { ROOT_ID } from "../core/tree.ts";
import { useEditorContext } from "./context.tsx";
import { SectionCard } from "./section-card.tsx";

type Tree = { rootNodeId: string; nodes: SerializedNodes };

type Option =
  | { status: "loading" }
  | { status: "done"; spec: SectionSpec; tree: Tree }
  | { status: "error"; message: string };

const VARIATION_LABELS = ["Clássica", "Layout alternativo", "Ousada"] as const;

const SUGGESTIONS: { label: string; prompt: string }[] = [
  { label: "Hero", prompt: "Hero de abertura com promessa forte, subtítulo, botão principal e prova rápida." },
  { label: "Benefícios", prompt: "Benefícios do produto em cards com ícones, 3 ou 6 itens." },
  { label: "Como funciona", prompt: "Passo a passo de como funciona, em 3 ou 4 etapas." },
  { label: "Depoimentos", prompt: "Depoimentos de clientes satisfeitos com resultado concreto." },
  { label: "Preços", prompt: "Tabela de preços com 3 planos e o do meio em destaque." },
  { label: "Números", prompt: "Resultados em números (clientes, satisfação, anos de mercado)." },
  { label: "FAQ", prompt: "Perguntas frequentes que quebram as principais objeções de compra." },
  { label: "Captura", prompt: "Captura de leads com formulário (nome, e-mail, WhatsApp) e isca irresistível." },
  { label: "Oferta", prompt: "Oferta com tudo o que está incluso, preço com desconto, garantia e botão de compra." },
  { label: "CTA final", prompt: "Chamada final para ação, escura, com urgência e um botão grande." },
];

/** Survives closing the dialog: the user can come back and insert another option. */
const useAiSections = create<{
  prompt: string;
  options: Option[];
  /** Increases on each generation: ignores late responses from the previous one. */
  run: number;
  setPrompt: (prompt: string) => void;
  start: () => number;
  setOption: (run: number, index: number, option: Option) => void;
}>((set, get) => ({
  prompt: "",
  options: [],
  run: 0,
  setPrompt: (prompt) => set({ prompt }),
  start: () => {
    const run = get().run + 1;
    set({ run, options: VARIATIONS.map(() => ({ status: "loading" })) });
    return run;
  },
  setOption: (run, index, option) =>
    set((s) => (s.run === run ? { options: s.options.map((o, i) => (i === index ? option : o)) } : s)),
}));

/** Generates section options with AI and inserts the chosen one. */
export function AiSectionPanel({ onInsert }: { onInsert: (tree: Tree) => void }) {
  const { services } = useEditorContext();
  const { query } = useEditor();
  const { prompt, options, setPrompt, start, setOption } = useAiSections();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = options.some((o) => o.status === "loading");

  const generateOne = async (run: number, index: number, text: string, outline: string[]) => {
    setOption(run, index, { status: "loading" });
    try {
      const { spec } = await services.generateSection({ prompt: text, pageOutline: outline, variation: index });
      const tree = buildTree(compileSection(spec), ROOT_ID);
      setOption(run, index, { status: "done", spec, tree });
    } catch (e) {
      setOption(run, index, { status: "error", message: e instanceof Error ? e.message : "Falha ao gerar" });
    }
  };

  const generate = () => {
    const text = prompt.trim();
    if (text.length < 3 || busy) return;
    const outline = pageOutline(query.getSerializedNodes());
    const run = start();
    for (let i = 0; i < VARIATIONS.length; i++) generateOne(run, i, text, outline);
  };

  const retry = (index: number) => {
    const { run } = useAiSections.getState();
    generateOne(run, index, prompt.trim(), pageOutline(query.getSerializedNodes()));
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Descreva a seção que você quer</h3>
        </div>
        <Textarea
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              generate();
            }
          }}
          placeholder="Ex.: depoimentos de alunas do curso de confeitaria, com resultado em faturamento e foto de cada uma"
          className="max-h-40 min-h-20 resize-none"
          maxLength={2000}
        />
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                setPrompt(s.prompt);
                inputRef.current?.focus();
              }}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            A IA usa as cores e fontes do seu tema e o conteúdo das outras seções da página.
          </p>
          <Button onClick={generate} disabled={busy || prompt.trim().length < 3} className="shrink-0">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {options.length ? "Gerar novamente" : "Gerar 3 opções"}
          </Button>
        </div>
      </div>

      {options.length ? (
        <div className="grid grid-cols-2 gap-4">
          {options.map((o, i) => (
            <OptionCard
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed slots, one per variation
              key={i}
              label={VARIATION_LABELS[i]}
              option={o}
              onInsert={onInsert}
              onRetry={() => retry(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function OptionCard({
  label,
  option,
  onInsert,
  onRetry,
}: {
  label: string;
  option: Option;
  onInsert: (tree: Tree) => void;
  onRetry: () => void;
}) {
  if (option.status === "done") {
    return (
      <div className="group/ai relative flex flex-col">
        <SectionCard title={option.spec.name} badge={label} tree={option.tree} onClick={() => onInsert(option.tree)} />
        <button
          type="button"
          title="Gerar esta opção de novo"
          onClick={onRetry}
          className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md bg-background/90 text-muted-foreground opacity-0 shadow transition-opacity group-hover/ai:opacity-100 hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div
        className={cn(
          "flex aspect-[16/7] w-full flex-col items-center justify-center gap-2 text-center",
          option.status === "loading" && "animate-pulse bg-muted/60",
        )}
      >
        {option.status === "loading" ? (
          <>
            <Sparkles className="size-5 text-primary" />
            <span className="text-xs text-muted-foreground">Criando a opção…</span>
          </>
        ) : (
          <>
            <AlertCircle className="size-5 text-destructive" />
            <span className="max-w-[80%] text-xs text-muted-foreground">{option.message}</span>
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RotateCcw className="size-3.5" /> Tentar de novo
            </Button>
          </>
        )}
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
