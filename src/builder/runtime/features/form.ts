/**
 * Runtime dos formulários: máscara de telefone, validação nativa, etapas
 * (só avança com a etapa válida), envio via fetch para o endpoint da página
 * e ação pós-envio (mensagem ou redirect).
 * Configuração vem dos data-atributos do <form data-pb-form>.
 */
export const formScript = (cfg: { viewEndpoint: string; formEndpoint: string }) => `
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
function steps(f){return f.querySelectorAll('[data-pb-step]');}
function cur(f){return +(f.getAttribute('data-pb-current')||0);}
function go(f,i,focus){
  var st=steps(f),n=st.length;if(!n)return;
  i=Math.max(0,Math.min(n-1,i));
  st.forEach(function(s,k){s.hidden=k!==i;});
  f.setAttribute('data-pb-current',String(i));
  var prev=f.querySelector('[data-pb-prev]'),next=f.querySelector('[data-pb-next]'),sub=f.querySelector('[type=submit]');
  if(prev)prev.hidden=i===0;if(next)next.hidden=i===n-1;if(sub)sub.hidden=i!==n-1;
  var bar=f.querySelector('.pb-form-bar');
  if(bar)bar.style.setProperty('--pb-progress',((i+1)/n*100)+'%');
  var c=f.querySelector('[data-pb-step-count]');if(c)c.textContent='Etapa '+(i+1)+' de '+n;
  var t=f.querySelector('[data-pb-step-title]');if(t)t.textContent=st[i].getAttribute('data-pb-title')||'';
  f.querySelectorAll('[data-pb-dot]').forEach(function(d,k){d.classList.toggle('pb-active',k===i);d.classList.toggle('pb-done',k<i);});
  if(focus){
    var r=f.getBoundingClientRect();if(r.top<0)f.scrollIntoView({behavior:'smooth',block:'start'});
    var first=st[i].querySelector('input:not([type=hidden]),select,textarea');
    if(first)try{first.focus({preventScroll:true});}catch(x){}
  }
}
/** Valida só os campos da etapa visível; mostra o aviso do 1º inválido. */
function stepValid(f){
  var s=steps(f)[cur(f)];if(!s)return true;
  s.querySelectorAll('[data-pb-tel]').forEach(function(w){telSync(w,false);});
  var els=s.querySelectorAll('input,select,textarea');
  for(var k=0;k<els.length;k++){if(!els[k].checkValidity()){els[k].reportValidity();return false;}}
  return true;
}
document.addEventListener('click',function(e){
  var t=e.target instanceof Element?e.target.closest('[data-pb-next],[data-pb-prev]'):null;if(!t)return;
  var f=t.closest('form[data-pb-form]');if(!f)return;
  e.preventDefault();
  if(t.hasAttribute('data-pb-prev')){go(f,cur(f)-1,true);return;}
  if(stepValid(f))go(f,cur(f)+1,true);
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
  // Enter numa etapa intermediária: avança em vez de enviar
  var n=steps(f).length;
  if(n&&cur(f)<n-1){if(stepValid(f))go(f,cur(f)+1,true);return;}
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
    if(n)go(f,0,false);
    f.classList.add('pb-sent');
    if(ok){ok.hidden=false;}
  })
  .catch(function(){done();if(err)err.hidden=false;});
});
})();
`;
