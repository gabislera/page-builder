/**
 * Valores responsivos com cascata desktop → tablet → mobile.
 *
 * Um valor responsivo guarda só o que foi definido em cada dispositivo. Ao
 * resolver para um dispositivo, usa o valor mais próximo acima dele: mobile
 * herda do tablet, que herda do desktop.
 */

export const DEVICES = ["desktop", "tablet", "mobile"] as const;
export type Device = (typeof DEVICES)[number];

export type Responsive<T> = { desktop: T; tablet?: T; mobile?: T };

/** Largura do canvas no editor para cada dispositivo. */
export const DEVICE_WIDTH: Record<Device, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

/** Media query aplicada a cada dispositivo na página publicada e no canvas. */
export const DEVICE_MEDIA: Record<Device, string | null> = {
  desktop: null,
  tablet: "(max-width: 1024px)",
  mobile: "(max-width: 600px)",
};

export function isResponsive<T>(value: unknown): value is Responsive<T> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "desktop" in value;
}

export function responsive<T>(desktop: T, tablet?: T, mobile?: T): Responsive<T> {
  const value: Responsive<T> = { desktop };
  if (tablet !== undefined) value.tablet = tablet;
  if (mobile !== undefined) value.mobile = mobile;
  return value;
}

/** Valor efetivo em um dispositivo, aplicando a cascata. */
export function resolve<T>(value: T | Responsive<T>, device: Device): T {
  if (!isResponsive<T>(value)) return value;
  if (device === "mobile") {
    return value.mobile ?? value.tablet ?? value.desktop;
  }
  if (device === "tablet") return value.tablet ?? value.desktop;
  return value.desktop;
}

/** Retorna um novo valor responsivo com `device` alterado. */
export function assign<T>(value: T | Responsive<T>, device: Device, next: T): Responsive<T> {
  const base: Responsive<T> = isResponsive<T>(value) ? { ...value } : { desktop: value };
  base[device] = next;
  return base;
}

/** Remove o valor específico de um dispositivo (volta a herdar). */
export function unassign<T>(value: Responsive<T>, device: Exclude<Device, "desktop">): Responsive<T> {
  const next = { ...value };
  delete next[device];
  return next;
}

/** O dispositivo tem valor próprio (não herdado)? */
export function hasOwn(value: unknown, device: Device): boolean {
  if (!isResponsive(value)) return device === "desktop";
  return value[device] !== undefined;
}
