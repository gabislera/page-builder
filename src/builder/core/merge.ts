import { isResponsive } from "./responsive.ts";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Merge profundo: objetos se mesclam, o resto substitui. Valores responsivos
 * ({ desktop, tablet?, mobile? }) substituem por inteiro, senão um modelo que
 * define só o desktop herdaria o mobile do padrão.
 */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(patch) || isResponsive(patch)) {
    return (patch === undefined ? base : patch) as T;
  }
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    out[k] = isPlainObject(v) && isPlainObject(out[k]) && !isResponsive(v) ? deepMerge(out[k], v) : v;
  }
  return out as T;
}

/** Props salvas completadas com os defaults atuais do componente. */
export function withDefaults<P>(defaults: P, props: unknown): P {
  return deepMerge(structuredClone(defaults), props);
}
