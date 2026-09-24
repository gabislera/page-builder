import type { AnchorHTMLAttributes } from "react";
import type { RenderContextValue } from "./render-context.tsx";
import type { Action } from "./style-types.ts";

type LinkAttrs = Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel"> & {
  "data-pb-modal"?: string;
};

export const sectionAnchor = (sectionId: string) => `s-${sectionId}`;

/** Converts an action into link attributes. `null` when there is no action. */
export function actionLink(action: Action | undefined, ctx: RenderContextValue): LinkAttrs | null {
  if (!action) return null;
  const blank = { target: "_blank", rel: "noopener noreferrer" };
  switch (action.type) {
    case "url":
      if (!action.url) return null;
      return {
        href: normalizeUrl(action.url),
        ...(action.newTab ? blank : {}),
      };
    case "section":
      return action.sectionId ? { href: `#${sectionAnchor(action.sectionId)}` } : null;
    case "page":
      if (!action.pageId) return null;
      return {
        href: ctx.pageUrl(action.pageId),
        ...(action.newTab ? blank : {}),
      };
    case "modal":
      return action.modalId ? { href: `#modal-${action.modalId}`, "data-pb-modal": action.modalId } : null;
    case "whatsapp": {
      const phone = action.phone.replace(/\D/g, "");
      if (!phone) return null;
      const text = action.message ? `?text=${encodeURIComponent(action.message)}` : "";
      return { href: `https://wa.me/${phone}${text}`, ...blank };
    }
    default:
      return null;
  }
}

export function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
