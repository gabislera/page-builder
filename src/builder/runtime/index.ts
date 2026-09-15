/**
 * JavaScript da página publicada. Pequeno, sem dependências, roda depois do
 * HTML. Cada bloco só é incluído se algum componente da página precisar dele.
 */
import type { RuntimeFeature } from "../core/types.ts";
import { countdownScript } from "./features/countdown.ts";
import { floatingScript } from "./features/floating.ts";
import { formScript } from "./features/form.ts";
import { headerScript } from "./features/header.ts";
import { modalScript } from "./features/modal.ts";
import { progressScript } from "./features/progress.ts";
import { videoScript } from "./features/video.ts";

type RuntimeConfig = { viewEndpoint: string; formEndpoint: string };

const CORE = `
function pbOpenModal(id){var d=document.getElementById('modal-'+id);if(d&&d.showModal){d.showModal();}}
document.addEventListener('click',function(e){
  var t=e.target instanceof Element?e.target:null;if(!t)return;
  var m=t.closest('[data-pb-modal]');
  if(m){e.preventDefault();pbOpenModal(m.getAttribute('data-pb-modal'));return;}
  if(t.closest('a,button,input,textarea,select,label'))return;
  var c=t.closest('[data-pb-href]');
  if(c){var href=c.getAttribute('data-pb-href');var tg=c.getAttribute('data-pb-target');
    if(tg==='_blank'){window.open(href,'_blank','noopener');}else{location.href=href;}}
});
(function(){
  var els=document.querySelectorAll('.pb-anim-fade-in,.pb-anim-fade-up');
  if(!els.length)return;
  if(!('IntersectionObserver' in window)){els.forEach(function(el){el.classList.add('pb-in')});return;}
  var io=new IntersectionObserver(function(entries){entries.forEach(function(en){
    if(en.isIntersecting){en.target.classList.add('pb-in');io.unobserve(en.target);}})},{threshold:.15});
  els.forEach(function(el){io.observe(el)});
})();
`;

const pageView = (endpoint: string) => `
(function(){try{
  var p=new URLSearchParams(location.search);var q={};p.forEach(function(v,k){q[k]=v});
  var body=JSON.stringify({ref:document.referrer||null,query:q,w:window.innerWidth});
  if(navigator.sendBeacon){navigator.sendBeacon(${JSON.stringify(endpoint)},new Blob([body],{type:'application/json'}));}
  else{fetch(${JSON.stringify(endpoint)},{method:'POST',body:body,headers:{'Content-Type':'application/json'},keepalive:true});}
}catch(e){}})();
`;

/** Blocos extras por recurso. Preenchidos pelos componentes que precisam. */
export const FEATURE_SCRIPTS: Partial<
	Record<RuntimeFeature, (cfg: RuntimeConfig) => string>
> = {
	header: headerScript,
	form: formScript,
	modal: modalScript,
	floating: floatingScript,
	video: videoScript,
	countdown: countdownScript,
	progress: progressScript,
};

export function buildRuntime(
	features: Set<RuntimeFeature>,
	cfg: RuntimeConfig,
): string {
	let js = CORE;
	for (const f of features) {
		const script = FEATURE_SCRIPTS[f];
		if (script) js += script(cfg);
	}
	js += pageView(cfg.viewEndpoint);
	return `(function(){${js}})();`;
}
