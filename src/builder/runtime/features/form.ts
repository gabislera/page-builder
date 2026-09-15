/**
 * Runtime dos formulários: máscara de telefone, validação nativa, envio via
 * fetch para o endpoint da página e ação pós-envio (mensagem ou redirect).
 * Configuração vem dos data-atributos do <form data-pb-form>.
 */
export const formScript = (cfg: {
	viewEndpoint: string;
	formEndpoint: string;
}) => `
(function(){
var EP=${JSON.stringify(cfg.formEndpoint)};
function digits(s){return (s||'').replace(/\\D/g,'');}
function maskBR(d){
  if(!d)return '';
  if(d.length<=2)return '('+d;
  var r=d.slice(2),o='('+d.slice(0,2)+') ';
  if(r.length<=4)return o+r;
  if(d.length<=10)return o+r.slice(0,4)+'-'+r.slice(4);
  return o+r.slice(0,5)+'-'+r.slice(5);
}
function telSync(w,typing){
  var inp=w.querySelector('[data-pb-tel-input]'),sel=w.querySelector('[data-pb-ddi]'),out=w.querySelector('[data-pb-tel-value]');
  if(!inp||!out)return;
  var ddi=sel?sel.value:(w.getAttribute('data-pb-ddi-default')||'55');
  var d=digits(inp.value);
  if(ddi==='55'){
    if(d.length>11&&d.indexOf('55')===0)d=d.slice(2);
    d=d.slice(0,11);
    if(typing!==false)inp.value=maskBR(d);
  }else{d=d.slice(0,15);}
  out.value=d?ddi+d:'';
  var bad=d&&(ddi==='55'?d.length<10:d.length<6);
  inp.setCustomValidity(bad?'Informe um telefone válido com DDD.':'');
}
document.addEventListener('input',function(e){
  var t=e.target;if(!(t instanceof Element))return;
  if(t.hasAttribute('data-pb-tel-input')){var w=t.closest('[data-pb-tel]');if(w)telSync(w,!(e.inputType&&e.inputType.indexOf('delete')===0));}
});
document.addEventListener('change',function(e){
  var t=e.target;if(!(t instanceof Element))return;
  if(t.hasAttribute('data-pb-ddi')){var w=t.closest('[data-pb-tel]');if(w)telSync(w);}
});
function withQuery(url){
  try{var u=new URL(url,location.href);new URLSearchParams(location.search).forEach(function(v,k){if(!u.searchParams.has(k))u.searchParams.set(k,v);});return u.toString();}
  catch(x){return url;}
}
document.addEventListener('submit',function(e){
  var f=e.target;
  if(!(f instanceof HTMLFormElement)||!f.hasAttribute('data-pb-form'))return;
  e.preventDefault();
  if(f.getAttribute('data-pb-busy'))return;
  f.querySelectorAll('[data-pb-tel]').forEach(function(w){telSync(w,false);});
  if(f.reportValidity&&!f.reportValidity())return;
  var btn=f.querySelector('[type=submit]'),label=btn&&btn.querySelector('.pb-form-submit-text');
  var ok=f.querySelector('[data-pb-ok]'),err=f.querySelector('[data-pb-error]');
  var oldText=label?label.textContent:'',loading=f.getAttribute('data-pb-loading');
  if(err)err.hidden=true;
  if(ok)ok.hidden=true;
  f.setAttribute('data-pb-busy','1');f.classList.add('pb-loading');
  if(btn)btn.disabled=true;
  if(label&&loading)label.textContent=loading;
  function done(){f.removeAttribute('data-pb-busy');f.classList.remove('pb-loading');if(btn)btn.disabled=false;if(label)label.textContent=oldText;}
  var fd=new FormData(f);
  if(f.getAttribute('data-pb-utm')==='1'){
    new URLSearchParams(location.search).forEach(function(v,k){if(/^(utm_[a-z_]+|fbclid|gclid|src|sck)$/i.test(k)&&!fd.has(k))fd.append(k,v);});
  }
  fetch(EP,{method:'POST',body:fd,headers:{Accept:'application/json'}})
  .then(function(r){return r.json().catch(function(){return null;}).then(function(j){if(!r.ok||!j||j.ok!==true)throw new Error('pb-form');});})
  .then(function(){
    try{if(typeof window.fbq==='function')window.fbq('track','Lead');}catch(x){}
    try{if(typeof window.gtag==='function')window.gtag('event','generate_lead');}catch(x){}
    var url=f.getAttribute('data-pb-redirect');
    if(f.getAttribute('data-pb-after')==='redirect'&&url){
      if(f.getAttribute('data-pb-append-query')==='1')url=withQuery(url);
      var blank=f.getAttribute('data-pb-target')==='_blank';
      // pequena espera para os pixels registrarem o Lead antes de sair da página
      setTimeout(function(){
        if(blank){var w=window.open(url,'_blank','noopener');if(!w){location.href=url;return;}done();f.reset();}
        else{location.href=url;}
      },300);
      return;
    }
    done();f.reset();
    f.querySelectorAll('[data-pb-tel-value]').forEach(function(h){h.value='';});
    f.classList.add('pb-sent');
    if(ok){ok.hidden=false;}
  })
  .catch(function(){done();if(err)err.hidden=false;});
});
})();
`;
