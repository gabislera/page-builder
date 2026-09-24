/**
 * Responsive values with a desktop → tablet → mobile cascade.
 *
 * A responsive value stores only what was set on each device. When
 * resolving for a device, it uses the nearest value above it: mobile
 * inherits from tablet, which inherits from desktop.
 */

export const DEVICES = ["desktop", "tablet", "mobile"] as const;
export type Device = (typeof DEVICES)[number];

export type Responsive<T> = { desktop: T; tablet?: T; mobile?: T };

/** Editor canvas width for each device. */
export const DEVICE_WIDTH: Record<Device, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

/** Media query applied to each device on the published page and the canvas. */
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

/** Effective value on a device, applying the cascade. */
export function resolve<T>(value: T | Responsive<T>, device: Device): T {
  if (!isResponsive<T>(value)) return value;
  if (device === "mobile") {
    return value.mobile ?? value.tablet ?? value.desktop;
  }
  if (device === "tablet") return value.tablet ?? value.desktop;
  return value.desktop;
}

/** Returns a new responsive value with `device` changed. */
export function assign<T>(value: T | Responsive<T>, device: Device, next: T): Responsive<T> {
  const base: Responsive<T> = isResponsive<T>(value) ? { ...value } : { desktop: value };
  base[device] = next;
  return base;
}

/** Removes a device-specific value (falls back to inherited). */
export function unassign<T>(value: Responsive<T>, device: Exclude<Device, "desktop">): Responsive<T> {
  const next = { ...value };
  delete next[device];
  return next;
}

/** Does the device have its own value (not inherited)? */
export function hasOwn(value: unknown, device: Device): boolean {
  if (!isResponsive(value)) return device === "desktop";
  return value[device] !== undefined;
}
