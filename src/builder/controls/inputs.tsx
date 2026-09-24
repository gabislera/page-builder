import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Slider } from "#/components/ui/slider";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { cn } from "#/lib/utils";
import { Field } from "./field.tsx";
import { useField } from "./use-field.ts";

type BaseProps = { path: string; label: string; hint?: string };

/* ------------------------------------------------------------------ */
/* Texto                                                               */
/* ------------------------------------------------------------------ */

export function TextField({ path, label, hint, placeholder }: BaseProps & { placeholder?: string }) {
  const f = useField<string>(path);
  return (
    <Field label={label} hint={hint} responsive={f.responsive} overridden={f.overridden} onReset={f.reset}>
      <DebouncedInput value={f.value ?? ""} onChange={(v) => f.set(v)} placeholder={placeholder} />
    </Field>
  );
}

export function TextAreaField({ path, label, hint, rows = 3 }: BaseProps & { rows?: number }) {
  const f = useField<string>(path);
  return (
    <Field label={label} hint={hint}>
      <Textarea
        className="min-h-0 text-xs"
        rows={rows}
        value={f.value ?? ""}
        onChange={(e) => f.set(e.target.value, { throttle: true })}
      />
    </Field>
  );
}

/** Input que só propaga depois de parar de digitar (evita 1 passo de undo por tecla). */
export function DebouncedInput({
  value,
  onChange,
  delay = 250,
  className,
  ...rest
}: {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  useEffect(() => {
    if (local === value) return;
    const t = setTimeout(() => onChange(local), delay);
    return () => clearTimeout(t);
  }, [local, value, delay, onChange]);
  return (
    <Input
      {...rest}
      className={cn("h-8 text-xs", className)}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Número com unidade                                                  */
/* ------------------------------------------------------------------ */

export type Unit = "px" | "%" | "em" | "rem" | "vw" | "vh";

const UNIT_RANGE: Record<Unit, { min: number; max: number; step: number }> = {
  px: { min: 0, max: 200, step: 1 },
  "%": { min: 0, max: 100, step: 1 },
  em: { min: 0, max: 10, step: 0.1 },
  rem: { min: 0, max: 10, step: 0.1 },
  vw: { min: 0, max: 100, step: 1 },
  vh: { min: 0, max: 100, step: 1 },
};

export function parseLength(value: string | undefined): {
  num: number | null;
  unit: Unit | "";
  keyword?: string;
} {
  if (!value) return { num: null, unit: "px" };
  const m = /^(-?[\d.]+)\s*(px|%|em|rem|vw|vh)?$/.exec(value.trim());
  if (!m) return { num: null, unit: "", keyword: value };
  return { num: Number(m[1]), unit: (m[2] as Unit) ?? "" };
}

type NumberUnitProps = BaseProps & {
  units?: Unit[];
  /** Palavras-chave aceitas além de números ("auto", "none"...). */
  keywords?: string[];
  max?: number;
  min?: number;
  step?: number;
  /** Sem unidade (line-height, opacidade, z-index). */
  unitless?: boolean;
};

export function NumberUnitField({
  path,
  label,
  hint,
  units = ["px", "%", "rem"],
  keywords = [],
  max,
  min,
  step,
  unitless,
}: NumberUnitProps) {
  const f = useField<string>(path);
  return (
    <Field label={label} hint={hint} responsive={f.responsive} overridden={f.overridden} onReset={f.reset}>
      <NumberUnitInput
        value={f.value}
        onChange={(v, throttle) => f.set(v, { throttle })}
        units={units}
        keywords={keywords}
        max={max}
        min={min}
        step={step}
        unitless={unitless}
      />
    </Field>
  );
}

export function NumberUnitInput({
  value,
  onChange,
  units = ["px", "%", "rem"],
  keywords = [],
  max,
  min,
  step,
  unitless,
  slider = true,
}: {
  value: string | undefined;
  onChange: (value: string, throttle?: boolean) => void;
  units?: Unit[];
  keywords?: string[];
  max?: number;
  min?: number;
  step?: number;
  unitless?: boolean;
  slider?: boolean;
}) {
  const parsed = parseLength(value);
  const unit: Unit | "" = unitless ? "" : ((parsed.unit || units[0]) as Unit);
  const range = unitless
    ? { min: min ?? 0, max: max ?? 10, step: step ?? 0.1 }
    : {
        min: min ?? UNIT_RANGE[unit as Unit].min,
        max: max ?? UNIT_RANGE[unit as Unit].max,
        step: step ?? UNIT_RANGE[unit as Unit].step,
      };
  const [text, setText] = useState(parsed.keyword ?? String(parsed.num ?? ""));
  useEffect(() => {
    setText(parsed.keyword ?? String(parsed.num ?? ""));
  }, [parsed.keyword, parsed.num]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (keywords.includes(trimmed)) return onChange(trimmed);
    const n = Number(trimmed.replace(",", "."));
    if (trimmed === "" || Number.isNaN(n)) return;
    onChange(`${n}${unit}`);
  };

  return (
    <div className="flex items-center gap-2">
      {slider ? (
        <Slider
          className="flex-1"
          min={range.min}
          max={Math.max(range.max, parsed.num ?? 0)}
          step={range.step}
          value={[parsed.num ?? range.min]}
          onValueChange={([n]) => onChange(`${n}${unit}`, true)}
        />
      ) : null}
      <div className="flex h-8 items-center rounded-md border border-input bg-transparent focus-within:ring-1 focus-within:ring-ring">
        <input
          className="h-full w-12 bg-transparent px-2 text-xs outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              const delta = (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 10 : range.step);
              const n = Math.round(((parsed.num ?? 0) + delta) * 100) / 100;
              onChange(`${n}${unit}`);
            }
          }}
        />
        {!unitless && units.length > 0 ? (
          <select
            className="h-full cursor-pointer rounded-r-md border-l border-input bg-transparent px-1 text-[11px] text-muted-foreground outline-none"
            value={parsed.keyword ? "" : unit}
            onChange={(e) => {
              const next = e.target.value;
              if (keywords.includes(next)) onChange(next);
              else onChange(`${parsed.num ?? 0}${next}`);
            }}
          >
            {parsed.keyword ? <option value="">—</option> : null}
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
            {keywords.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Select, segmentado e switch                                         */
/* ------------------------------------------------------------------ */

export type Option<T extends string = string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

export function SelectField<T extends string>({ path, label, hint, options }: BaseProps & { options: Option<T>[] }) {
  const f = useField<T>(path);
  return (
    <Field label={label} hint={hint} responsive={f.responsive} overridden={f.overridden} onReset={f.reset}>
      <SelectInput value={f.value} onChange={(v) => f.set(v)} options={options} />
    </Field>
  );
}

export function SelectInput<T extends string>({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: T | undefined;
  onChange: (value: T) => void;
  options: Option<T>[];
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger size="sm" className="h-8 w-full text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SegmentedField<T extends string>({ path, label, hint, options }: BaseProps & { options: Option<T>[] }) {
  const f = useField<T>(path);
  return (
    <Field label={label} hint={hint} responsive={f.responsive} overridden={f.overridden} onReset={f.reset}>
      <SegmentedInput value={f.value} onChange={(v) => f.set(v)} options={options} />
    </Field>
  );
}

export function SegmentedInput<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | undefined;
  onChange: (value: T) => void;
  options: Option<T>[];
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      className="w-full"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
    >
      {options.map((o) => {
        const Icon = o.icon;
        // title em vez de Tooltip: o Tooltip sobrescreveria o data-state do item
        return (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            title={o.label}
            className="h-8 flex-1 text-[11px] data-[state=on]:bg-primary/20 data-[state=on]:text-foreground"
            aria-label={o.label}
          >
            {Icon ? <Icon className="size-3.5" /> : o.label}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

export function SwitchField({ path, label, hint }: BaseProps) {
  const f = useField<boolean>(path);
  return (
    <Field label={label} hint={hint} inline responsive={f.responsive} overridden={f.overridden} onReset={f.reset}>
      <Switch checked={Boolean(f.value)} onCheckedChange={(v) => f.set(v)} />
    </Field>
  );
}
