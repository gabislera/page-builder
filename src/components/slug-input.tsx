import { slugDraft, slugify } from "#/lib/slug";
import { cn } from "#/lib/utils";

/**
 * Campo do endereço da página: mostra o começo fixo da URL e deixa digitar
 * só a parte final (letras minúsculas, números e hífen).
 */
export function SlugInput({
  value,
  onChange,
  prefix,
  className,
  size = "default",
}: {
  value: string;
  onChange: (slug: string) => void;
  /** Parte fixa antes do slug, ex.: "/p/minha-loja/". */
  prefix: string;
  className?: string;
  size?: "default" | "sm";
}) {
  return (
    <label
      className={cn(
        "flex w-full min-w-0 items-center rounded-md border border-input bg-transparent font-mono shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        size === "sm" ? "h-8 text-xs" : "h-9 text-sm",
        className,
      )}
    >
      <span className="min-w-0 truncate pl-3 text-muted-foreground" title={prefix}>
        {prefix}
      </span>
      <input
        className="h-full w-0 min-w-[7rem] flex-1 bg-transparent pr-3 outline-none"
        value={value}
        spellCheck={false}
        placeholder="endereco-da-pagina"
        onChange={(e) => onChange(slugDraft(e.target.value))}
        onBlur={() => onChange(slugify(value))}
      />
    </label>
  );
}
