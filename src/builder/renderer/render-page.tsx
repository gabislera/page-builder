import type { SerializedNodes } from "@craftjs/core";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PageSeo, PageTracking } from "#/db/schema";
import { BASE_CSS } from "../core/base-css.ts";
import { deepMerge } from "../core/build.ts";
import { type RenderContextValue, RenderProvider } from "../core/render-context.tsx";
import { googleFontsHref } from "../core/style-engine.ts";
import { type SiteSettings, themeCss, themeFonts } from "../core/theme.ts";
import { ROOT_ID, typeOf } from "../core/tree.ts";
import type { RuntimeFeature } from "../core/types.ts";
import { getDefinition } from "../registry.ts";
import { buildRuntime } from "../runtime/index.ts";
import { COOKIE_BANNER_CSS, cookieBannerHtml, gatedTracking } from "./cookie-banner.ts";

export type RenderInput = {
  pageId: string;
  nodes: SerializedNodes;
  pageUrl: (pageId: string) => string;
  /** Site theme and identity: become CSS variables and feed the Logo. */
  site: SiteSettings;
  homeUrl: string;
};

/** Renders the node tree to HTML + CSS using the same views as the editor. */
export function renderBody({ pageId, nodes, pageUrl, site, homeUrl }: RenderInput) {
  // theme variables come before node CSS, which references them
  const css: string[] = [themeCss(site.theme)];
  const fonts = new Set<string>(themeFonts(site.theme));
  const features = new Set<RuntimeFeature>();

  const renderNode = (id: string): ReactNode => {
    const node = nodes[id];
    if (!node || node.hidden) return null;
    const def = getDefinition(typeOf(node));
    if (!def) return null; // removed component: skip instead of breaking publish
    const props = deepMerge(structuredClone(def.defaults), node.props);
    css.push(def.css(id, props));
    for (const f of def.fonts?.(props) ?? []) fonts.add(f);
    for (const f of def.runtime ?? []) features.add(f);
    // features that depend on the Advanced tab, not the component type
    if (props.box?.scrollEffect?.type === "parallax") features.add("motion");
    const children = (node.nodes ?? []).map(renderNode);
    return (
      <def.View key={id} id={id} props={props}>
        {children.length ? children : undefined}
      </def.View>
    );
  };

  const ctx: RenderContextValue = {
    mode: "publish",
    pageId,
    pageUrl,
    site: site.identity,
    homeUrl,
  };
  const html = renderToStaticMarkup(<RenderProvider value={ctx}>{renderNode(ROOT_ID)}</RenderProvider>);
  return { html, css: css.join(""), fonts, features };
}

export type RenderPageInput = RenderInput & {
  seo: PageSeo;
  tracking: PageTracking;
  formEndpoint: string;
  viewEndpoint: string;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Full HTML document of the published page. */
export function renderPageHtml(input: RenderPageInput): string {
  const { html, css, fonts, features } = renderBody(input);
  const { seo, tracking } = input;
  const cb = input.site.cookieBanner;
  const banner = cb?.enabled ? cb : null;
  // visitor choice applies to the whole site (all pages in the project)
  const siteKey = input.homeUrl;
  const trackingHtml = [trackingHead(tracking), tracking.headScripts ?? ""].filter(Boolean).join("\n");
  const bodyScripts = tracking.bodyScripts ?? "";
  const gated = banner?.mode === "block";
  const fontsHref = googleFontsHref(fonts);
  const runtime = buildRuntime(features, {
    formEndpoint: input.formEndpoint,
    viewEndpoint: input.viewEndpoint,
  });

  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(seo.title || input.site.identity.name || "")}</title>`,
    seo.description ? `<meta name="description" content="${esc(seo.description)}">` : "",
    seo.noIndex ? '<meta name="robots" content="noindex,nofollow">' : "",
    `<meta property="og:title" content="${esc(seo.title || "")}">`,
    seo.description ? `<meta property="og:description" content="${esc(seo.description)}">` : "",
    seo.ogImageUrl ? `<meta property="og:image" content="${esc(seo.ogImageUrl)}">` : "",
    seo.faviconUrl ? `<link rel="icon" href="${esc(seo.faviconUrl)}">` : "",
    fontsHref
      ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${esc(fontsHref)}">`
      : "",
    `<style>${BASE_CSS}${css}${banner ? COOKIE_BANNER_CSS : ""}</style>`,
    gated ? gatedTracking(siteKey, trackingHtml, bodyScripts) : trackingHtml,
  ]
    .filter(Boolean)
    .join("\n");

  return `<!doctype html>
<html lang="pt-BR">
<head>
${head}
</head>
<body>
${html}
<script>${runtime}</script>
${gated ? "" : bodyScripts}
${banner ? cookieBannerHtml(banner, siteKey) : ""}
</body>
</html>`;
}

function trackingHead(t: PageTracking): string {
  const out: string[] = [];
  const id = (v?: string) => (v ?? "").replace(/[^A-Za-z0-9_-]/g, "");
  const fb = id(t.facebookPixelId);
  if (fb) {
    out.push(
      `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fb}');fbq('track','PageView');</script>`,
    );
  }
  const ga = id(t.googleTagId);
  if (ga) {
    out.push(
      `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');</script>`,
    );
  }
  const tt = id(t.tiktokPixelId);
  if (tt) {
    out.push(
      `<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i;var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tt}');ttq.page();}(window,document,'ttq');</script>`,
    );
  }
  return out.join("\n");
}
