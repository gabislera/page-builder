/**
 * Published-page cookie notice (LGPD). No dependencies.
 *
 * In "block" mode, tracking pixels and scripts go into inert <template>s
 * and are activated only when the visitor accepts (or already accepted).
 * The choice is stored in localStorage; a link to "#cookies" reopens the
 * notice.
 */
import type { CookieBanner } from "../core/theme.ts";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Only http(s), relative paths, and anchors: no javascript:. */
const safeUrl = (url: string) => (/^(https?:\/\/|\/|#|\.\/)/i.test(url.trim()) ? url.trim() : "");

/** localStorage key for the choice, scoped per site. */
const storageKey = (siteKey: string) => `pb-consent:${siteKey}`;

/** Activates content stored in the templates (scripts must be recreated). */
const LOADER = `
window.pbLoadTracking=function(){
  if(window.__pbTracking)return;window.__pbTracking=1;
  function run(id,target){
    var t=document.getElementById(id);if(!t)return;
    [].forEach.call(t.content.childNodes,function(n){
      if(n.nodeName==='SCRIPT'){var s=document.createElement('script');
        [].forEach.call(n.attributes,function(a){s.setAttribute(a.name,a.value);});
        s.text=n.text;target.appendChild(s);}
      else target.appendChild(document.importNode(n,true));
    });
  }
  run('pb-consent-head',document.head);
  if(document.body)run('pb-consent-body',document.body);
  else document.addEventListener('DOMContentLoaded',function(){run('pb-consent-body',document.body);});
};`;

/**
 * <head> tracking when it depends on consent: inert templates + loader.
 * If the visitor already accepted, loads immediately.
 */
export function gatedTracking(siteKey: string, head: string, body: string): string {
  if (!head.trim() && !body.trim()) return "";
  const key = JSON.stringify(storageKey(siteKey));
  return `<template id="pb-consent-head">${head}</template>
<template id="pb-consent-body">${body}</template>
<script>${LOADER}
try{if(localStorage.getItem(${key})==='all')window.pbLoadTracking();}catch(e){}</script>`;
}

export function cookieBannerHtml(cb: CookieBanner, siteKey: string): string {
  const policy = safeUrl(cb.policyUrl);
  const link =
    policy && cb.policyText ? ` <a href="${esc(policy)}" target="_blank" rel="noopener">${esc(cb.policyText)}</a>` : "";
  const reject =
    cb.mode === "block"
      ? `<button type="button" class="pb-cookie-btn pb-cookie-reject" data-pb-consent="essential">${esc(cb.rejectText || "Recusar")}</button>`
      : "";
  const key = JSON.stringify(storageKey(siteKey));
  return `<div class="pb-cookie pb-cookie-${cb.position} pb-cookie-${cb.appearance}" role="dialog" aria-label="Aviso de cookies" data-pb-cookie hidden>
<p class="pb-cookie-text">${esc(cb.text)}${link}</p>
<div class="pb-cookie-actions">${reject}<button type="button" class="pb-cookie-btn pb-cookie-accept" data-pb-consent="all">${esc(cb.acceptText || "Aceitar")}</button></div>
</div>
<script>(function(){
  var b=document.querySelector('[data-pb-cookie]');if(!b)return;var K=${key};
  function get(){try{return localStorage.getItem(K);}catch(e){return null;}}
  function show(){b.hidden=false;requestAnimationFrame(function(){requestAnimationFrame(function(){b.classList.add('pb-in');});});}
  function hide(){b.classList.remove('pb-in');setTimeout(function(){b.hidden=true;},250);}
  if(!get())show();
  b.addEventListener('click',function(e){
    var t=e.target instanceof Element?e.target.closest('[data-pb-consent]'):null;if(!t)return;
    var v=t.getAttribute('data-pb-consent');
    try{localStorage.setItem(K,v);}catch(x){}
    hide();
    if(v==='all'&&window.pbLoadTracking)window.pbLoadTracking();
  });
  document.addEventListener('click',function(e){
    var a=e.target instanceof Element?e.target.closest('a[href="#cookies"]'):null;
    if(a){e.preventDefault();show();}
  });
})();</script>`;
}

export const COOKIE_BANNER_CSS = `
.pb-cookie{position:fixed;z-index:2147483000;bottom:16px;display:flex;align-items:center;gap:16px;box-sizing:border-box;padding:18px 20px;border-radius:16px;font-family:var(--pb-font-body,system-ui,sans-serif);font-size:14px;line-height:1.55;box-shadow:0 18px 50px -12px rgba(0,0,0,.28);opacity:0;transform:translateY(16px);transition:opacity .25s ease,transform .25s ease}
.pb-cookie.pb-in{opacity:1;transform:none}
.pb-cookie[hidden]{display:none}
.pb-cookie-bottom{left:16px;right:16px;max-width:1120px;margin:0 auto}
.pb-cookie-bottom-left,.pb-cookie-bottom-right{width:400px;max-width:calc(100% - 32px);flex-direction:column;align-items:stretch}
.pb-cookie-bottom-left{left:16px}
.pb-cookie-bottom-right{right:16px}
.pb-cookie-light{background:#fff;color:var(--pb-c-text,#18181b);border:1px solid var(--pb-c-border,#e4e4e7)}
.pb-cookie-dark{background:var(--pb-c-secondary,#0f172a);color:#fff}
.pb-cookie-text{margin:0;flex:1}
.pb-cookie-text a{color:inherit;font-weight:600;text-decoration:underline;text-underline-offset:3px}
.pb-cookie-actions{display:flex;gap:8px;flex-shrink:0}
.pb-cookie-bottom-left .pb-cookie-btn,.pb-cookie-bottom-right .pb-cookie-btn{flex:1}
.pb-cookie-btn{height:40px;padding:0 20px;border:1px solid transparent;border-radius:999px;font:inherit;font-weight:600;cursor:pointer;transition:opacity .15s ease,background-color .15s ease}
.pb-cookie-accept{background:var(--pb-c-primary,#2563eb);color:#fff}
.pb-cookie-accept:hover{opacity:.9}
.pb-cookie-reject{background:transparent;color:inherit;border-color:color-mix(in srgb,currentColor 30%,transparent)}
.pb-cookie-reject:hover{border-color:currentColor}
@media (max-width:600px){.pb-cookie{left:12px;right:12px;bottom:12px;width:auto;max-width:none;flex-direction:column;align-items:stretch}.pb-cookie-btn{flex:1}}
@media (prefers-reduced-motion:reduce){.pb-cookie{transition:none}}
`;
