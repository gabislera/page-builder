import { CodeXml } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CodeField } from "../controls/code.tsx";
import { Group } from "../controls/field.tsx";
import { BoxFields } from "../controls/groups.tsx";
import { SettingsTabs } from "../controls/settings-layout.tsx";
import { defaultBox } from "../core/defaults.ts";
import { nodeClassName } from "../core/node-helpers.ts";
import { useIsEditor } from "../core/render-context.tsx";
import { responsive } from "../core/responsive.ts";
import { applyBox, createSheet } from "../core/style-engine.ts";
import type { Box } from "../core/style-types.ts";
import type { ComponentDefinition, NodeViewProps } from "../core/types.ts";

export type HtmlProps = {
  /** Freeform HTML, CSS, and JS. Written as-is to the published page. */
  code: string;
  box: Box;
};

/**
 * Script injected in the editor preview: reports content height to the parent
 * document. Without `allow-same-origin` the parent cannot measure it itself.
 */
const MEASURE = `<script>(function(){var last=0;function send(){var h=Math.ceil(document.documentElement.scrollHeight);if(h!==last){last=h;parent.postMessage({pbHtmlHeight:h},"*");}}
addEventListener("load",send);if(window.ResizeObserver){new ResizeObserver(send).observe(document.documentElement);}setInterval(send,1000);send();})();</script>`;

const PREVIEW_BASE = "<style>html,body{margin:0}body{overflow:hidden;font-family:system-ui,sans-serif}</style>";

/** Isolated editor preview: user scripts cannot touch the editor. */
function EditorPreview({ code }: { code: string }) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(40);

  useEffect(() => {
    const frame = ref.current;
    // the iframe lives inside the canvas (another document): listen on its window
    const win = frame?.ownerDocument.defaultView;
    if (!frame || !win) return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.contentWindow) return;
      const h = (e.data as { pbHtmlHeight?: unknown } | null)?.pbHtmlHeight;
      if (typeof h === "number" && h >= 0) setHeight(Math.min(h, 20000));
    };
    win.addEventListener("message", onMessage);
    return () => win.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={ref}
      className="pb-html-preview"
      title="Pré-visualização do HTML"
      sandbox="allow-scripts"
      srcDoc={PREVIEW_BASE + code + MEASURE}
      style={{ height }}
    />
  );
}

function HtmlView({ id, props, rootRef }: NodeViewProps<HtmlProps>) {
  const isEditor = useIsEditor();
  const className = nodeClassName(id, "pb-html", props.box);
  const empty = !props.code.trim();

  if (!isEditor) {
    if (empty) return null;
    return (
      <div
        className={className}
        data-pb-node={id}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: freeform HTML written by the page owner
        dangerouslySetInnerHTML={{ __html: props.code }}
      />
    );
  }

  return (
    <div ref={rootRef as React.Ref<HTMLDivElement>} className={className} data-pb-node={id}>
      {empty ? (
        <div className="pb-placeholder">Bloco HTML vazio. Escreva o código no painel ao lado.</div>
      ) : (
        <>
          <EditorPreview code={props.code} />
          {/* transparent overlay: click selects the node instead of hitting the iframe */}
          <div className="pb-html-shield" />
        </>
      )}
    </div>
  );
}

function HtmlSettings() {
  return (
    <SettingsTabs
      content={
        <Group title="Código">
          <CodeField
            path="code"
            label="HTML, CSS e JavaScript"
            hint="O código vai para a página publicada exatamente como está. No editor ele roda isolado."
          />
        </Group>
      }
      advanced={<BoxFields />}
    />
  );
}

export const Html: ComponentDefinition<HtmlProps> = {
  type: "Html",
  displayName: "HTML",
  category: "advanced",
  icon: CodeXml,
  inToolbox: true,
  defaults: {
    code: "",
    box: defaultBox({ width: responsive("100%") }),
  },
  View: HtmlView,
  css: (id, p) => {
    const sheet = createSheet(id);
    sheet.root().set("position", "relative");
    sheet.rule(" .pb-html-preview").set("display", "block").set("width", "100%").set("border", "0");
    sheet.rule(" .pb-html-shield").set("position", "absolute").set("inset", "0").set("z-index", "1");
    applyBox(sheet, p.box);
    return sheet.toString();
  },
  Settings: HtmlSettings,
};
