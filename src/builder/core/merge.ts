import { isResponsive } from "./responsive.ts";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Deep merge: objects merge, everything else replaces. Responsive values
 * ({ desktop, tablet?, mobile? }) are replaced as a whole, otherwise a
 * template that only sets desktop would inherit mobile from the default.
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

/** Saved props filled in with the component's current defaults. */
export function withDefaults<P>(defaults: P, props: unknown): P {
  return deepMerge(structuredClone(defaults), props);
}
