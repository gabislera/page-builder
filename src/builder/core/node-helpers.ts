import { nodeClass } from "./style-engine.ts";
import type { Box } from "./style-types.ts";

/** Root element classes of a node: base + id + animation + custom class. */
export function nodeClassName(id: string, base: string, box?: Partial<Box>) {
  return [
    base,
    nodeClass(id),
    box?.animation && box.animation !== "none" ? `pb-anim-${box.animation}` : null,
    box?.scrollEffect?.type === "parallax" ? "pb-parallax" : null,
    box?.cssClass || null,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Announcement bar: direct child of the page and always before the header. */
export const TOP_BAR_TYPE = "AnnouncementBar";

/** Types that can only be direct children of the page. */
export const TOP_LEVEL_TYPES = new Set(["Section", "Header", "Footer", TOP_BAR_TYPE]);
