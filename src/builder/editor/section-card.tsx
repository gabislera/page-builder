import type { SerializedNodes } from "@craftjs/core";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Badge } from "#/components/ui/badge";
import { BASE_CSS } from "../core/base-css.ts";
import { buildRoot } from "../core/build.ts";
import { googleFontsHref } from "../core/style-engine.ts";
import { ROOT_ID } from "../core/tree.ts";
import { renderBody } from "../renderer/render-page.tsx";
import { useSiteStore } from "./site-store.ts";

/** Live section preview: rendered by the same renderer as publish. */
export function SectionCard({
  title,
  badge,
  tree,
  onClick,
}: {
  title: string;
  badge?: string;
  tree: { rootNodeId: string; nodes: SerializedNodes };
  onClick: () => void;
}) {
  const site = useSiteStore((s) => s.settings);
  const srcDoc = useMemo(() => {
    const root = { ...buildRoot(), nodes: [tree.rootNodeId] };
    const nodes: SerializedNodes = { ...tree.nodes, [ROOT_ID]: root };
    nodes[tree.rootNodeId] = { ...nodes[tree.rootNodeId], parent: ROOT_ID };
    const { html, css, fonts } = renderBody({
      pageId: "preview",
      nodes,
      pageUrl: () => "#",
      site,
      homeUrl: "#",
    });
    const href = googleFontsHref(fonts);
    return `<!doctype html><html><head>${href ? `<link rel="stylesheet" href="${href}">` : ""}<style>${BASE_CSS}${css}.pb-page{min-height:0}</style></head><body>${html}</body></html>`;
  }, [tree, site]);

  // preview is rendered at 1280px and scaled down to the card width
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition hover:border-primary hover:ring-2 hover:ring-primary/30"
    >
      <div ref={boxRef} className="relative aspect-[16/7] w-full overflow-hidden bg-white">
        <iframe
          title={title}
          srcDoc={srcDoc}
          tabIndex={-1}
          className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
          style={{
            width: 1280,
            height: 560,
            transform: `scale(${width / 1280})`,
          }}
        />
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-medium">{title}</span>
        {badge ? <Badge variant="secondary">{badge}</Badge> : null}
      </div>
    </button>
  );
}
