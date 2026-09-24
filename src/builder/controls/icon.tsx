import { Ban, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { cn } from "#/lib/utils";
import { ALL_ICON_NAMES, ICONS, IconView, iconLabel } from "../core/icons.tsx";
import { Field } from "./field.tsx";
import { useField } from "./use-field.ts";

export function IconField({ path, label, allowNone }: { path: string; label: string; allowNone?: boolean }) {
  const f = useField<string>(path);
  return (
    <Field label={label} inline>
      <IconInput value={f.value} onChange={(v) => f.set(v)} allowNone={allowNone} />
    </Field>
  );
}

/** Max icons rendered at once (the library has ~1700). */
const MAX_RESULTS = 120;
const COLS = 7;

const POPULAR = Object.keys(ICONS);

/**
 * Portuguese terms → lucide terms, to search the full library
 * (lucide names are in English).
 */
const PT_TERMS: Record<string, string[]> = {
  seta: ["arrow", "chevron"],
  casa: ["house", "home"],
  inicio: ["house", "home"],
  pessoa: ["user", "person"],
  usuario: ["user"],
  grupo: ["users"],
  dinheiro: ["dollar", "banknote", "wallet", "coins"],
  moeda: ["coins", "dollar", "euro"],
  carteira: ["wallet"],
  carrinho: ["cart"],
  compra: ["cart", "bag", "shopping"],
  sacola: ["bag"],
  loja: ["store"],
  presente: ["gift"],
  cartao: ["card"],
  desconto: ["percent", "tag"],
  etiqueta: ["tag"],
  preco: ["tag", "dollar"],
  seguro: ["shield", "lock"],
  garantia: ["shield", "badge"],
  escudo: ["shield"],
  cadeado: ["lock"],
  chave: ["key"],
  estrela: ["star"],
  coracao: ["heart"],
  curtir: ["thumbs-up", "heart"],
  raio: ["zap"],
  fogo: ["flame"],
  foguete: ["rocket"],
  trofeu: ["trophy"],
  premio: ["award", "trophy", "medal"],
  medalha: ["medal"],
  selo: ["badge"],
  certificado: ["award", "badge"],
  livro: ["book"],
  curso: ["graduation", "book"],
  aula: ["presentation", "graduation", "book"],
  formatura: ["graduation"],
  video: ["video", "play", "film"],
  musica: ["music"],
  camera: ["camera"],
  foto: ["image", "camera"],
  imagem: ["image"],
  arquivo: ["file"],
  documento: ["file"],
  pasta: ["folder"],
  baixar: ["download"],
  enviar: ["send", "upload"],
  email: ["mail"],
  mensagem: ["message"],
  chat: ["message"],
  conversa: ["message"],
  telefone: ["phone"],
  celular: ["smartphone"],
  computador: ["monitor", "laptop"],
  relogio: ["clock", "watch"],
  tempo: ["clock", "timer", "hourglass"],
  calendario: ["calendar"],
  data: ["calendar"],
  local: ["map", "pin"],
  mapa: ["map"],
  mundo: ["globe", "earth"],
  busca: ["search"],
  pesquisa: ["search"],
  configuracao: ["settings", "cog"],
  ajuda: ["help", "life-buoy"],
  suporte: ["headset", "life-buoy", "headphones"],
  grafico: ["chart"],
  crescimento: ["trending-up", "chart"],
  check: ["check"],
  certo: ["check"],
  erro: ["x", "alert"],
  fechar: ["x"],
  alerta: ["alert", "triangle-alert", "bell"],
  sino: ["bell"],
  notificacao: ["bell"],
  info: ["info"],
  mais: ["plus"],
  menos: ["minus"],
  brilho: ["sparkle"],
  sol: ["sun"],
  lua: ["moon"],
  nuvem: ["cloud"],
  olho: ["eye"],
  link: ["link"],
  lampada: ["lightbulb"],
  ideia: ["lightbulb"],
  alvo: ["target", "crosshair"],
  meta: ["target", "goal"],
  caminhao: ["truck"],
  entrega: ["truck", "package"],
  pacote: ["package"],
  caixa: ["box", "package"],
  saude: ["heart-pulse", "activity"],
  comida: ["utensils", "pizza", "coffee"],
  cafe: ["coffee"],
  aviao: ["plane"],
  carro: ["car"],
  trabalho: ["briefcase"],
  maleta: ["briefcase"],
  predio: ["building"],
  empresa: ["building", "briefcase"],
  escola: ["school"],
  lixo: ["trash"],
  editar: ["pencil", "pen"],
  lapis: ["pencil"],
  cerebro: ["brain"],
  coroa: ["crown"],
  diamante: ["gem", "diamond"],
  joia: ["gem"],
  bandeira: ["flag"],
  microfone: ["mic"],
  fone: ["headphones"],
  jogo: ["gamepad"],
  idioma: ["languages"],
  robo: ["bot"],
  ia: ["bot", "brain", "sparkles"],
};

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Search by lucide name, Portuguese label, and translated terms. */
function searchIcons(query: string): { names: string[]; total: number } {
  const q = normalize(query);
  if (!q) return { names: POPULAR, total: POPULAR.length };
  const words = q.split(/\s+/);
  const kebabQuery = words.join("-");

  // English terms equivalent to the words typed in Portuguese
  const translated = new Set<string>();
  for (const w of words) {
    for (const [pt, terms] of Object.entries(PT_TERMS)) {
      if (w.length >= 3 ? pt.startsWith(w) : pt === w) for (const t of terms) translated.add(t);
    }
  }

  const scored: { name: string; score: number }[] = [];
  const seen = new Set<string>();
  const consider = (name: string, label: string) => {
    if (seen.has(name)) return;
    let score = -1;
    if (name === kebabQuery) score = 0;
    else if (name.startsWith(kebabQuery)) score = 1;
    else if (label.startsWith(q)) score = 1;
    else if (words.every((w) => name.includes(w) || label.includes(w))) score = 2;
    else if ([...translated].some((t) => name.includes(t))) score = 3;
    if (score < 0) return;
    seen.add(name);
    scored.push({ name, score });
  };
  for (const name of POPULAR) consider(name, normalize(ICONS[name].label));
  for (const name of ALL_ICON_NAMES) consider(name, "");

  scored.sort((a, b) => a.score - b.score || a.name.length - b.name.length || a.name.localeCompare(b.name));
  return {
    names: scored.slice(0, MAX_RESULTS).map((s) => s.name),
    total: scored.length,
  };
}

export function IconInput({
  value,
  onChange,
  allowNone = true,
}: {
  value: string;
  onChange: (value: string) => void;
  allowNone?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-[118px] items-center gap-2 rounded-md border border-input px-2 text-left text-[11px] hover:bg-accent/50"
        >
          {value ? <IconView name={value} size={14} /> : <Ban className="size-3.5 text-muted-foreground" />}
          <span className="truncate text-muted-foreground">{value ? iconLabel(value) : "Nenhum"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {open ? (
          <IconPicker
            value={value}
            allowNone={allowNone}
            onPick={(name) => {
              onChange(name);
              setOpen(false);
            }}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function IconPicker({
  value,
  allowNone,
  onPick,
}: {
  value: string;
  allowNone: boolean;
  onPick: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const gridRef = useRef<HTMLDivElement>(null);
  const { names, total } = useMemo(() => searchIcons(query), [query]);
  const searching = query.trim() !== "";
  // "" = "Nenhum" option
  const options = useMemo(() => (allowNone && !searching ? ["", ...names] : names), [allowNone, searching, names]);

  useEffect(() => {
    if (active < 0) return;
    gridRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const move: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: COLS,
      ArrowUp: -COLS,
    };
    if (e.key in move) {
      e.preventDefault();
      if (options.length === 0) return;
      const next = active < 0 ? 0 : active + move[e.key];
      setActive(Math.min(Math.max(next, 0), options.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = options[active < 0 ? 0 : active];
      if (pick !== undefined) onPick(pick);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          // biome-ignore lint/a11y/noAutofocus: focus the search when the picker opens
          autoFocus
          className="h-9 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          placeholder="Buscar ícone (ex.: seta, check, gift)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="max-h-72 overflow-y-auto p-2" ref={gridRef}>
        <p className="px-1 pb-1.5 text-[10px] font-medium text-muted-foreground uppercase">
          {searching
            ? total > 0
              ? `${total} ${total === 1 ? "resultado" : "resultados"}`
              : "Nenhum ícone encontrado"
            : "Populares"}
        </p>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }} role="listbox">
          {options.map((name, index) => (
            <button
              key={name || "__none"}
              type="button"
              role="option"
              aria-selected={value === name}
              data-index={index}
              title={name ? iconLabel(name) : "Nenhum"}
              onClick={() => onPick(name)}
              onMouseEnter={() => setActive(index)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md hover:bg-accent",
                value === name && "bg-primary/20",
                active === index && "ring-1 ring-ring",
              )}
            >
              {name ? <IconView name={name} size={16} /> : <Ban className="size-4 text-muted-foreground" />}
            </button>
          ))}
        </div>
        {total > MAX_RESULTS && searching ? (
          <p className="px-1 pt-2 text-[10px] text-muted-foreground">
            Mostrando {MAX_RESULTS} de {total}. Refine a busca para ver outros.
          </p>
        ) : null}
        {!searching ? (
          <p className="px-1 pt-2 text-[10px] text-muted-foreground">
            Busque para ver os {ALL_ICON_NAMES.length} ícones da biblioteca.
          </p>
        ) : null}
      </div>
    </div>
  );
}
