import { useEditor } from "@craftjs/core";
import { Monitor, Smartphone, Tablet, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "#/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { DEVICE_WIDTH, type Device } from "../core/responsive.ts";
import { renderPageHtml } from "../renderer/render-page.tsx";
import { useEditorContext } from "./context.tsx";
import { useSiteStore } from "./site-store.ts";

/** Preview of the current state (including unsaved), with the published HTML. */
export function PreviewDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { query } = useEditor();
  const { pageId } = useEditorContext();
  const [device, setDevice] = useState<Device>("desktop");

  const html = useMemo(() => {
    if (!open) return "";
    return renderPageHtml({
      pageId,
      nodes: query.getSerializedNodes(),
      pageUrl: () => "#",
      seo: { title: "Prévia" },
      site: useSiteStore.getState().settings,
      homeUrl: "#",
      tracking: {},
      formEndpoint: "#",
      viewEndpoint: "data:,",
    });
  }, [open, query, pageId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[96vh] max-w-[98vw] flex-col gap-0 bg-editor-bg p-0 sm:max-w-[98vw]"
      >
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <DialogTitle className="text-sm">Prévia</DialogTitle>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={device}
            onValueChange={(v) => v && setDevice(v as Device)}
          >
            <ToggleGroupItem value="desktop" aria-label="Desktop">
              <Monitor className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="tablet" aria-label="Tablet">
              <Tablet className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="mobile" aria-label="Celular">
              <Smartphone className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded p-1.5 hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-1 justify-center overflow-hidden bg-editor-canvas p-4">
          <iframe
            title="Prévia"
            srcDoc={html}
            sandbox="allow-scripts allow-same-origin allow-popups"
            className="h-full border-0 bg-white shadow-2xl transition-[width]"
            style={{
              width: device === "desktop" ? "100%" : DEVICE_WIDTH[device],
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
