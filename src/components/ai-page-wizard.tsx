import { AlertCircle, ArrowLeft, Check, Loader2, RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type Brief, BriefSpec, PAGE_TYPES, type PagePlan, VOICES } from "#/builder/ai/page";
import type { SectionSpec } from "#/builder/ai/spec";
import type { ThemeOption } from "#/builder/ai/theme";
import { ColorInput } from "#/builder/controls/color";
import { SelectInput } from "#/builder/controls/inputs";
import { fontStack, GOOGLE_FONTS, googleFontsHref } from "#/builder/core/style-engine";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { cn } from "#/lib/utils";
import { createAiPage, generatePageSection, generateThemes, planPage } from "#/server/ai";

type Result = { status: "loading" } | { status: "done"; spec: SectionSpec } | { status: "error"; message: string };

const CTA_TYPES: { value: Brief["cta"]["type"]; label: string; placeholder: string }[] = [
  { value: "link", label: "Link de compra", placeholder: "https://pay.hotmart.com/..." },
  { value: "whatsapp", label: "WhatsApp", placeholder: "(11) 99999-9999" },
  { value: "form", label: "Formulário", placeholder: "" },
];

const EMPTY_BRIEF: Brief = {
  pageType: "sales",
  business: "",
  audience: "",
  offer: "",
  cta: { type: "link", value: "" },
  voice: VOICES[0],
};

/** A theme option, or the site's current theme (kept as is). */
type ThemeChoice = Pick<ThemeOption, "name" | "mood" | "colors" | "fonts"> & { current?: boolean };
/** "ai-0".."ai-2", "custom" or "current". */
type ThemeKey = string;
type Phase = "brief" | "theme" | "generating";

/**
 * "Create with AI". The user describes the page, picks one of 3 visual
 * directions while the outline is planned (both run in parallel), then
 * watches the sections being written. The editor opens at the end.
 */
export function AiPageWizard({
  projectId,
  onBack,
  onCreated,
}: {
  projectId: string;
  onBack: () => void;
  onCreated: (pageId: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("brief");
  const [brief, setBrief] = useState<Brief>(EMPTY_BRIEF);
  /** AI options (null while loading), the one the user edited, and the site's current theme. */
  const [aiThemes, setAiThemes] = useState<ThemeChoice[] | null>(null);
  const [customTheme, setCustomTheme] = useState<ThemeChoice | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeChoice | null>(null);
  const [chosen, setChosen] = useState<ThemeKey | null>(null);
  /** Theme being customized (draft), or null. */
  const [editing, setEditing] = useState<ThemeChoice | null>(null);
  /** Every AI option shown so far, so "Outras opções" brings new ones. */
  const seen = useRef<string[]>([]);
  const [plan, setPlan] = useState<PagePlan | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [creating, setCreating] = useState(false);
  /** Increases on every generation: late answers from a cancelled one are ignored. */
  const run = useRef(0);
  /** The outline starts with the theme options; sections wait for both. */
  const planRef = useRef<Promise<PagePlan | null>>(Promise.resolve(null));

  const themeOf = (key: ThemeKey | null): ThemeChoice | null => {
    if (key === "custom") return customTheme;
    if (key === "current") return currentTheme;
    if (key?.startsWith("ai-")) return aiThemes?.[Number(key.slice(3))] ?? null;
    return null;
  };
  const theme = themeOf(chosen);

  const loadThemes = (id: number, input: Brief) => {
    setAiThemes(null);
    if (chosen?.startsWith("ai-")) setChosen(null);
    generateThemes({ data: { projectId, brief: input, avoid: seen.current.slice(-12) } }).then(
      ({ options, current }) => {
        if (run.current !== id) return;
        seen.current.push(...options.map((o) => `${o.name} (${o.colors.primary}, ${o.fonts.heading})`));
        setAiThemes(options);
        setCurrentTheme({ ...CURRENT_THEME, ...current, current: true });
        setChosen((key) => (key === null || key.startsWith("ai-") ? "ai-0" : key));
      },
      () => {
        if (run.current !== id) return;
        toast.error("Não deu para criar as opções de tema. Personalize ou mantenha o tema atual.");
        setAiThemes([]);
      },
    );
  };

  const setResult = (id: number, index: number, result: Result) =>
    setResults((prev) => (run.current === id ? prev.map((r, i) => (i === index ? result : r)) : prev));

  const generateOne = async (id: number, current: PagePlan, index: number) => {
    setResult(id, index, { status: "loading" });
    try {
      const style = theme && !theme.current ? `${theme.name}: ${theme.mood}` : undefined;
      const { spec } = await generatePageSection({ data: { projectId, brief, plan: current, index, style } });
      setResult(id, index, { status: "done", spec });
    } catch (e) {
      setResult(id, index, { status: "error", message: e instanceof Error ? e.message : "Falha ao gerar" });
    }
  };

  const start = () => {
    const parsed = BriefSpec.safeParse(brief);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Confira o briefing");
      return;
    }
    const id = ++run.current;
    setPlan(null);
    setResults([]);
    setCustomTheme(null);
    setEditing(null);
    setChosen(null);
    seen.current = [];
    setPhase("theme");
    planRef.current = planPage({ data: { projectId, brief: parsed.data } }).then(
      ({ plan: next }) => {
        if (run.current === id) setPlan(next);
        return next;
      },
      (e) => {
        if (run.current !== id) return null;
        toast.error(e instanceof Error ? e.message : "Falha ao montar a página");
        run.current++;
        setPhase("brief");
        return null;
      },
    );
    loadThemes(id, parsed.data);
  };

  /** Theme picked: writes the sections as soon as the outline is ready. */
  const confirmTheme = async () => {
    const id = run.current;
    setPhase("generating");
    const ready = await planRef.current;
    if (!ready || run.current !== id) return;
    setResults(ready.sections.map(() => ({ status: "loading" })));
    ready.sections.forEach((_, i) => {
      generateOne(id, ready, i);
    });
  };

  const cancel = () => {
    run.current++;
    setPhase("brief");
  };

  const retryFailed = () => {
    if (!plan) return;
    results.forEach((r, i) => {
      if (r.status === "error") generateOne(run.current, plan, i);
    });
  };

  const create = async (specs: SectionSpec[]) => {
    if (creating || !plan) return;
    setCreating(true);
    try {
      const page = await createAiPage({
        data: {
          projectId,
          name: plan.pageName.trim() || "Nova página",
          pageType: brief.pageType,
          sections: specs,
          theme: theme && !theme.current ? { colors: theme.colors, fonts: theme.fonts } : null,
        },
      });
      onCreated(page.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao criar a página");
      setCreating(false);
    }
  };

  const done = results.filter((r): r is Extract<Result, { status: "done" }> => r.status === "done");
  const pending = results.some((r) => r.status === "loading");
  const failed = results.filter((r) => r.status === "error").length;
  const allDone = phase === "generating" && results.length > 0 && done.length === results.length;
  // every section done: create the page right away
  // biome-ignore lint/correctness/useExhaustiveDependencies: fires once, when the last section arrives
  useEffect(() => {
    if (allDone) create(done.map((r) => r.spec));
  }, [allDone]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 py-1">
        {phase === "brief" ? <BriefForm brief={brief} onChange={setBrief} /> : null}
        {phase === "theme" ? (
          editing ? (
            <ThemeCustomizer
              draft={editing}
              onChange={setEditing}
              onCancel={() => setEditing(null)}
              onSave={() => {
                setCustomTheme({ ...editing, name: "Personalizado", mood: "Cores e fontes escolhidas por você." });
                setChosen("custom");
                setEditing(null);
              }}
            />
          ) : (
            <ThemePicker
              aiThemes={aiThemes}
              customTheme={customTheme}
              currentTheme={currentTheme}
              chosen={chosen}
              onChoose={setChosen}
              onRegenerate={() => loadThemes(run.current, brief)}
              onCustomize={() => setEditing({ ...(theme ?? currentTheme ?? BLANK_THEME), current: false })}
              planReady={Boolean(plan)}
            />
          )
        ) : null}
        {phase === "generating" ? (
          <Progress
            plan={plan}
            results={results}
            creating={creating}
            onRetry={(i) => plan && generateOne(run.current, plan, i)}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        {phase === "brief" ? (
          <>
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="size-4" /> Modelos prontos
            </Button>
            <Button onClick={start} disabled={brief.business.trim().length < 20}>
              <Sparkles className="size-4" /> Criar página
            </Button>
          </>
        ) : null}
        {phase === "theme" ? (
          <>
            <Button variant="ghost" onClick={cancel}>
              <ArrowLeft className="size-4" /> Voltar ao briefing
            </Button>
            <Button onClick={confirmTheme} disabled={Boolean(editing) || !theme}>
              <Sparkles className="size-4" /> {theme?.current ? "Manter o tema e criar" : "Usar este tema e criar"}
            </Button>
          </>
        ) : null}
        {phase === "generating" ? (
          <>
            <Button variant="ghost" disabled={creating} onClick={cancel}>
              <ArrowLeft className="size-4" /> Voltar ao briefing
            </Button>
            {plan && !pending && failed && !creating ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={retryFailed}>
                  <RotateCcw className="size-4" /> Tentar de novo as que falharam
                </Button>
                <Button onClick={() => create(done.map((r) => r.spec))} disabled={!done.length}>
                  Criar sem elas
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

const CURRENT_THEME = {
  name: "Tema atual do site",
  mood: "Mantém as cores e fontes que o site já usa.",
};

/** "Recomeçar do zero": a neutral base to build a palette from. */
const BLANK_THEME: ThemeChoice = {
  name: "Personalizado",
  mood: "",
  colors: {
    primary: "#3f3f46",
    secondary: "#18181b",
    accent: "#a1a1aa",
    text: "#18181b",
    textMuted: "#52525b",
    background: "#ffffff",
    surface: "#f4f4f5",
    border: "#e4e4e7",
  },
  fonts: { heading: "Inter", body: "Inter" },
};

/* ------------------------------------------------------------------ */
/* Theme picker                                                        */
/* ------------------------------------------------------------------ */

/** Loads the Google Fonts used by the previews (once per font). */
function useFonts(families: string[]) {
  const key = [...new Set(families)].sort().join("|");
  useEffect(() => {
    const href = googleFontsHref(key.split("|").filter(Boolean));
    if (!href || document.head.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [key]);
}

function ThemePicker({
  aiThemes,
  customTheme,
  currentTheme,
  chosen,
  onChoose,
  onRegenerate,
  onCustomize,
  planReady,
}: {
  aiThemes: ThemeChoice[] | null;
  customTheme: ThemeChoice | null;
  currentTheme: ThemeChoice | null;
  chosen: ThemeKey | null;
  onChoose: (key: ThemeKey) => void;
  onRegenerate: () => void;
  onCustomize: () => void;
  planReady: boolean;
}) {
  const cards: [ThemeKey, ThemeChoice][] = [
    ...(customTheme ? [["custom", customTheme] as [ThemeKey, ThemeChoice]] : []),
    ...(aiThemes ?? []).map((t, i) => [`ai-${i}`, t] as [ThemeKey, ThemeChoice]),
    ...(currentTheme ? [["current", currentTheme] as [ThemeKey, ThemeChoice]] : []),
  ];
  useFonts(cards.flatMap(([, t]) => [t.fonts.heading, t.fonts.body]));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">Escolha as cores e fontes do site</h3>
          <p className="text-xs text-muted-foreground">
            A página é escrita em seguida com o tema escolhido. Ele vale para o site todo e pode ser ajustado depois na
            aba Site do projeto.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {planReady ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Loader2 className="size-3.5 animate-spin" />
            )}
            {planReady ? "Estrutura da página pronta" : "Montando a estrutura da página…"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRegenerate} disabled={aiThemes === null}>
              <RotateCcw className="size-3.5" /> Outras opções
            </Button>
            <Button variant="outline" size="sm" onClick={onCustomize}>
              <SlidersHorizontal className="size-3.5" /> Personalizar
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        {customTheme ? (
          <ThemeCard theme={customTheme} selected={chosen === "custom"} onSelect={() => onChoose("custom")} />
        ) : null}
        {aiThemes === null
          ? [0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl bg-muted/60 animate-pulse"
              >
                <Sparkles className="size-5 text-primary" />
                <span className="text-xs text-muted-foreground">Criando a opção {i + 1}…</span>
              </div>
            ))
          : aiThemes.map((t, i) => (
              <ThemeCard
                key={`${t.name}-${t.colors.primary}`}
                theme={t}
                selected={chosen === `ai-${i}`}
                onSelect={() => onChoose(`ai-${i}`)}
              />
            ))}
        {currentTheme ? (
          <ThemeCard theme={currentTheme} selected={chosen === "current"} onSelect={() => onChoose("current")} />
        ) : null}
      </div>
    </div>
  );
}

const COLOR_FIELDS: { key: keyof ThemeChoice["colors"]; label: string; hint: string }[] = [
  { key: "primary", label: "Primária", hint: "Botões e destaques" },
  { key: "secondary", label: "Secundária", hint: "Fundo das seções escuras" },
  { key: "accent", label: "Destaque", hint: "Selos, ícones e detalhes" },
  { key: "background", label: "Fundo", hint: "Fundo da página" },
  { key: "surface", label: "Superfície", hint: "Seções e cards alternados" },
  { key: "text", label: "Texto", hint: "Títulos e texto principal" },
  { key: "textMuted", label: "Texto suave", hint: "Subtítulos e descrições" },
  { key: "border", label: "Borda", hint: "Linhas e contornos" },
];

const FONT_SELECT = Object.keys(GOOGLE_FONTS).map((f) => ({ value: f, label: f }));

/** Edits a theme (from an option or from scratch) with a live style tile. */
function ThemeCustomizer({
  draft,
  onChange,
  onCancel,
  onSave,
}: {
  draft: ThemeChoice;
  onChange: (t: ThemeChoice) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  useFonts([draft.fonts.heading, draft.fonts.body]);
  const setColor = (key: keyof ThemeChoice["colors"], value: string) =>
    onChange({ ...draft, colors: { ...draft.colors, [key]: value } });
  const setFont = (key: keyof ThemeChoice["fonts"], value: string) =>
    onChange({ ...draft, fonts: { ...draft.fonts, [key]: value } });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">Personalizar cores e fontes</h3>
        <p className="text-xs text-muted-foreground">
          Se uma cor ficar clara demais para texto branco, ela é escurecida só o necessário para continuar legível.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          {COLOR_FIELDS.map((f) => (
            <div key={f.key} className="flex items-center gap-3">
              <ColorInput
                className="w-[104px] shrink-0"
                allowGlobal={false}
                value={draft.colors[f.key]}
                onChange={(v) => setColor(f.key, v)}
              />
              <span className="flex min-w-0 flex-col">
                <span className="text-xs font-medium">{f.label}</span>
                <span className="truncate text-[11px] text-muted-foreground">{f.hint}</span>
              </span>
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium">Fonte dos títulos</span>
            <SelectInput value={draft.fonts.heading} options={FONT_SELECT} onChange={(v) => setFont("heading", v)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium">Fonte do texto</span>
            <SelectInput value={draft.fonts.body} options={FONT_SELECT} onChange={(v) => setFont("body", v)} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <ThemeCard theme={{ ...draft, name: "Prévia", mood: "" }} selected={false} onSelect={() => {}} />
        </div>
      </div>
      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => onChange({ ...BLANK_THEME })}>
          Recomeçar do zero
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button size="sm" onClick={onSave}>
            <Check className="size-3.5" /> Usar estas cores e fontes
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Style tile for a theme: color blocks, type specimen, and a sample button.
 * Deliberately not a page layout, so nobody reads it as the generated hero.
 */
function ThemeCard({ theme, selected, onSelect }: { theme: ThemeChoice; selected: boolean; onSelect: () => void }) {
  const c = theme.colors;
  const heading = fontStack(theme.fonts.heading);
  const body = fontStack(theme.fonts.body);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-all",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground/40",
      )}
    >
      <div className="relative grid aspect-[4/3] grid-cols-[1.4fr_1fr] grid-rows-3">
        <div className="row-span-2 flex items-end p-3" style={{ background: c.primary }}>
          <span className="text-5xl leading-none font-bold text-white" style={{ fontFamily: heading }}>
            Aa
          </span>
        </div>
        <div style={{ background: c.secondary }} />
        <div style={{ background: c.accent }} />
        <div
          className="col-span-2 flex items-center gap-2 border-t px-3"
          style={{ background: c.background, borderColor: c.border }}
        >
          <span
            className="rounded-md px-2.5 py-1 text-[10px] font-semibold text-white"
            style={{ background: c.primary, fontFamily: body }}
          >
            Botão
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: c.surface, color: c.text, fontFamily: body }}
          >
            Selo
          </span>
          <span className="ml-auto text-[10px]" style={{ color: c.textMuted, fontFamily: body }}>
            Texto
          </span>
        </div>
        {selected ? (
          <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="size-3.5" />
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <span className="text-sm font-medium">{theme.name}</span>
        <span className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">{theme.mood}</span>
        <span className="mt-1 flex flex-col gap-0.5 border-t border-border pt-2">
          <span className="truncate text-base leading-tight" style={{ fontFamily: heading }}>
            {theme.fonts.heading}
          </span>
          {theme.fonts.body !== theme.fonts.heading ? (
            <span className="truncate text-xs text-muted-foreground" style={{ fontFamily: body }}>
              {theme.fonts.body} no texto
            </span>
          ) : null}
        </span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Brief                                                             */
/* ------------------------------------------------------------------ */

function Label({ children, hint, htmlFor }: { children: React.ReactNode; hint?: string; htmlFor?: string }) {
  const Tag = htmlFor ? "label" : "span";
  return (
    <Tag htmlFor={htmlFor} className="flex items-baseline gap-2 text-xs font-medium">
      {children}
      {hint ? <span className="font-normal text-muted-foreground">{hint}</span> : null}
    </Tag>
  );
}

function BriefForm({ brief, onChange }: { brief: Brief; onChange: (b: Brief) => void }) {
  const set = <K extends keyof Brief>(key: K, value: Brief[K]) => onChange({ ...brief, [key]: value });
  const cta = CTA_TYPES.find((c) => c.value === brief.cta.type) ?? CTA_TYPES[0];
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Tipo de página</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PAGE_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => set("pageType", t.id)}
              className={cn(
                "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                brief.pageType === t.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border hover:border-muted-foreground/40",
              )}
            >
              <span className="text-sm font-medium">{t.label}</span>
              <span className="text-[11px] leading-snug text-muted-foreground">{t.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ai-business" hint="quanto mais detalhe, melhor">
          Sobre o negócio e a oferta
        </Label>
        <Textarea
          id="ai-business"
          value={brief.business}
          onChange={(e) => set("business", e.target.value)}
          placeholder="Ex.: Curso online de confeitaria para quem faz doces em casa e quer vender. 40 aulas gravadas, comunidade no WhatsApp e mentorias mensais com a Ana Paula, confeiteira há 12 anos."
          className="min-h-28 resize-none"
          maxLength={3000}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ai-audience" hint="opcional">
          Público
        </Label>
        <Textarea
          id="ai-audience"
          value={brief.audience}
          onChange={(e) => set("audience", e.target.value)}
          placeholder="Ex.: mulheres de 25 a 50 anos que fazem doces em casa e querem uma renda extra sem sair de casa"
          className="min-h-20 resize-none"
          maxLength={500}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ai-offer" hint="opcional">
          Preço, bônus e garantia
        </Label>
        <Textarea
          id="ai-offer"
          value={brief.offer}
          onChange={(e) => set("offer", e.target.value)}
          placeholder="Ex.: de R$ 697 por R$ 497 ou 12x de R$ 49,70. Bônus: planilha de precificação. Garantia de 7 dias."
          className="min-h-20 resize-none"
          maxLength={1000}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex flex-col gap-2">
          <Label>Ação principal da página</Label>
          <div className="flex flex-wrap gap-2">
            {CTA_TYPES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => set("cta", { type: c.value, value: c.value === brief.cta.type ? brief.cta.value : "" })}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  brief.cta.type === c.value
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          {cta.value !== "form" ? (
            <Input
              value={brief.cta.value}
              onChange={(e) => set("cta", { ...brief.cta, value: e.target.value })}
              placeholder={cta.placeholder}
              maxLength={500}
            />
          ) : (
            <p className="text-xs text-muted-foreground">A página terá um formulário, e os leads caem em Leads.</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Tom de voz</Label>
          <Select value={brief.voice} onValueChange={(v) => set("voice", v as Brief["voice"])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICES.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

function StatusIcon({ status }: { status: Result["status"] }) {
  if (status === "done") return <Check className="size-4 text-emerald-500" />;
  if (status === "error") return <AlertCircle className="size-4 text-destructive" />;
  return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
}

function Progress({
  plan,
  results,
  creating,
  onRetry,
}: {
  plan: PagePlan | null;
  results: Result[];
  creating: boolean;
  onRetry: (index: number) => void;
}) {
  const done = results.filter((r) => r.status === "done").length;
  // the structure counts as one step, so the bar moves while it is planned
  const pct = plan ? Math.round(((1 + done) / (1 + results.length)) * 100) : 6;
  const title = creating
    ? "Montando a página…"
    : plan
      ? `Escrevendo as seções (${done} de ${results.length})`
      : "Planejando a estrutura da página…";
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 py-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{title}</span>
          <span className="text-muted-foreground">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ol className="flex flex-col divide-y divide-border rounded-lg border border-border">
        <li className="flex items-center gap-3 px-4 py-2.5 text-sm">
          <StatusIcon status={plan ? "done" : "loading"} />
          <span className={cn("flex-1", !plan && "text-muted-foreground")}>
            {plan ? `Estrutura com ${plan.sections.length} seções` : "Estrutura da página"}
          </span>
        </li>
        {plan?.sections.map((s, i) => {
          const r = results[i];
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: same order as the outline
            <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <StatusIcon status={r?.status ?? "loading"} />
              <span className={cn("flex-1", r?.status === "loading" && "text-muted-foreground")}>{s.name}</span>
              {r?.status === "error" ? (
                <Button size="sm" variant="ghost" onClick={() => onRetry(i)}>
                  <RotateCcw className="size-3.5" /> Tentar de novo
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
