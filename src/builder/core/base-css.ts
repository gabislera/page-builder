/**
 * CSS base aplicado igualmente no canvas do editor e na página publicada.
 * Mantém os dois idênticos: nada de reset do Tailwind dentro do canvas.
 */
import { UI_ACCENT, UI_ACCENT_SOFT, UI_EDITING } from "#/lib/brand";

export const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;min-height:100vh}
img,video,svg,iframe{display:block;max-width:100%}
h1,h2,h3,h4,h5,h6,p{margin:0;font-size:inherit;font-weight:inherit}
a{color:inherit;text-decoration:none}
button,input,textarea,select{font:inherit;color:inherit}
ul,ol{margin:0;padding-left:1.25em}
.pb-page{display:flex;flex-direction:column;min-height:100vh;width:100%;overflow-x:clip}
.pb-section{position:relative;display:flex;flex-direction:column;width:100%}
.pb-section-inner{position:relative;display:flex;flex-direction:column;width:100%;margin:0 auto}
.pb-anchor{position:absolute;top:0;left:0;width:0;height:0}
.pb-rich p:empty::after{content:"\\00a0"}
.pb-rich a{text-decoration:underline}
.pb-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;cursor:pointer;border:0;text-align:center}
.pb-btn svg{flex-shrink:0}
.pb-header:has(.pb-menu-open){z-index:2000 !important}
.pb-anim-pulse{animation:pb-pulse 1.6s ease-in-out infinite}
@keyframes pb-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
.pb-anim-fade-in,.pb-anim-fade-up{opacity:0;transition:opacity .7s ease,transform .7s ease}
.pb-anim-fade-up{transform:translateY(24px)}
.pb-anim-fade-in.pb-in,.pb-anim-fade-up.pb-in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.pb-anim-pulse{animation:none}.pb-anim-fade-in,.pb-anim-fade-up{opacity:1;transform:none;transition:none}}
`;

/** CSS só do editor: contornos de seleção, placeholders e elementos ocultos. */
export const EDITOR_CSS = `
html{scroll-behavior:auto}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-track,::-webkit-scrollbar-corner{background:transparent}
::-webkit-scrollbar-thumb{border:3px solid transparent;border-radius:999px;background-color:rgba(0,0,0,.18);background-clip:content-box}
::-webkit-scrollbar-thumb:hover{background-color:rgba(0,0,0,.35)}
@supports not selector(::-webkit-scrollbar){html{scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.25) transparent}}
[data-pb-node]{cursor:default}
.pb-hover{outline:1px dashed ${UI_ACCENT_SOFT} !important;outline-offset:-1px}
.pb-selected{outline:2px solid ${UI_ACCENT} !important;outline-offset:-2px}
.pb-anim-fade-in,.pb-anim-fade-up{opacity:1;transform:none}
.pb-placeholder{display:flex;align-items:center;justify-content:center;min-height:80px;width:100%;border:1.5px dashed #c4c4cc;border-radius:6px;color:#71717a;font:500 12px/1.4 Inter,system-ui,sans-serif;background:repeating-linear-gradient(45deg,#fafafa,#fafafa 8px,#f4f4f5 8px,#f4f4f5 16px);pointer-events:none;text-align:center;padding:12px}
.pb-editing{outline:2px solid ${UI_EDITING} !important;cursor:text}
.pb-editing:focus{outline:2px solid #22c55e !important}
`;
