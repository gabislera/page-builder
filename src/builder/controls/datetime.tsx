import { Field } from "./field.tsx";
import { DebouncedInput } from "./inputs.tsx";
import { useField } from "./use-field.ts";

/** Local date and time ("2026-12-31T23:59") without timezone. */
export function DateTimeField({ path, label, hint }: { path: string; label: string; hint?: string }) {
  const f = useField<string>(path);
  return (
    <Field label={label} hint={hint}>
      <DebouncedInput
        type="datetime-local"
        value={f.value ?? ""}
        onChange={(v) => f.set(v)}
        className="[color-scheme:dark]"
      />
    </Field>
  );
}

/** Time of day ("23:59"). */
export function TimeField({ path, label, hint }: { path: string; label: string; hint?: string }) {
  const f = useField<string>(path);
  return (
    <Field label={label} hint={hint} inline>
      <DebouncedInput
        type="time"
        value={f.value ?? ""}
        onChange={(v) => f.set(v)}
        className="w-[118px] [color-scheme:dark]"
      />
    </Field>
  );
}

const TZ_NAMES: Record<string, string> = {
  "-05:00": "Acre",
  "-04:00": "Manaus, Cuiabá",
  "-03:00": "Brasília",
  "-02:00": "Fernando de Noronha",
  "+00:00": "UTC, Lisboa (inverno)",
  "+01:00": "Lisboa (verão)",
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Timezones as UTC offsets (-12:00 to +14:00). Brasília comes first. */
export const TIMEZONE_OPTIONS = (() => {
  const list: { value: string; label: string }[] = [];
  for (let h = -12; h <= 14; h++) {
    const value = `${h < 0 ? "-" : "+"}${pad(Math.abs(h))}:00`;
    const name = TZ_NAMES[value];
    list.push({ value, label: name ? `UTC${value} (${name})` : `UTC${value}` });
  }
  const br = list.findIndex((o) => o.value === "-03:00");
  list.unshift(...list.splice(br, 1));
  return list;
})();
