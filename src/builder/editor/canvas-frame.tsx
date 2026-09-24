import { useEditor } from "@craftjs/core";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BASE_CSS, EDITOR_CSS } from "../core/base-css.ts";
import { DEVICE_WIDTH } from "../core/responsive.ts";
import { GOOGLE_FONTS, googleFontsHref } from "../core/style-engine.ts";
import { themeCss } from "../core/theme.ts";
import { useSiteStore } from "./site-store.ts";
import { useEditorUI } from "./store.ts";

/** The editor lists every offered font; the browser only downloads those in use. */
const EDITOR_FONTS_HREF = googleFontsHref(Object.keys(GOOGLE_FONTS));

const SRC_DOC = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>`;

/**
 * Editor canvas: an iframe at the exact device width. Node CSS media queries
 * apply as on the published page. When the device does not fit the available
 * area, the iframe is scaled down.
 */
export function CanvasFrame({
  children,
  onDocument,
}: {
  children: ReactNode;
  onDocument?: (doc: Document | null) => void;
}) {
  const device = useEditorUI((s) => s.device);
  const zoom = useEditorUI((s) => s.zoom);
  const areaRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const theme = useSiteStore((s) => s.settings.theme);

  // global theme variables, live-updated as the user edits the palette
  useEffect(() => {
    if (!doc) return;
    let el = doc.getElementById("pb-theme");
    if (!el) {
      el = doc.createElement("style");
      el.id = "pb-theme";
      doc.head.prepend(el);
    }
    el.textContent = themeCss(theme);
  }, [doc, theme]);
  const { actions } = useEditor();

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setArea({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = DEVICE_WIDTH[device];
  const padding = 32;
  const fit = Math.min(1, (area.width - padding * 2) / width);
  const scale = zoom === "fit" ? Math.max(0.25, fit) : zoom;
  const height = Math.max(200, (area.height - padding) / scale);

  const handleLoad = () => {
    const d = iframeRef.current?.contentDocument;
    if (!d) return;
    const style = d.createElement("style");
    style.textContent = BASE_CSS + EDITOR_CSS;
    d.head.appendChild(style);
    if (EDITOR_FONTS_HREF) {
      const link = d.createElement("link");
      link.rel = "stylesheet";
      link.href = EDITOR_FONTS_HREF;
      d.head.appendChild(link);
    }
    // links do not navigate inside the editor
    d.addEventListener(
      "click",
      (e) => {
        const a = (e.target as Element | null)?.closest?.("a");
        if (a) e.preventDefault();
      },
      true,
    );
    setDoc(d);
    onDocument?.(d);
  };

  // in some browsers srcDoc load fires before React attaches onLoad
  useEffect(() => {
    const d = iframeRef.current?.contentDocument;
    if (!doc && d?.readyState === "complete" && d.body && !d.head.querySelector("style")) handleLoad();
  });

  useEffect(() => {
    // click on the canvas background clears the selection
    if (!doc) return;
    const clear = (e: MouseEvent) => {
      if (e.target === doc.documentElement || e.target === doc.body) {
        actions.selectNode();
      }
    };
    doc.addEventListener("mousedown", clear);
    return () => doc.removeEventListener("mousedown", clear);
  }, [doc, actions]);

  return (
    <div ref={areaRef} className="relative flex-1 overflow-hidden bg-editor-canvas">
      <div
        className="absolute top-4 left-1/2 origin-top shadow-2xl shadow-black/40 transition-[width] duration-200"
        style={{ width, height, transform: `translateX(-50%) scale(${scale})` }}
      >
        <iframe
          ref={iframeRef}
          title="Canvas"
          srcDoc={SRC_DOC}
          onLoad={handleLoad}
          className="size-full border-0 bg-white"
        />
        {doc ? createPortal(children, doc.body) : null}
      </div>
    </div>
  );
}
