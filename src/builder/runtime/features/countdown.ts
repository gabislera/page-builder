/**
 * Contador regressivo da página publicada. Lê a configuração dos atributos
 * data-pb-* (ver components/countdown.tsx) e atualiza a cada segundo.
 *
 * - date: data-pb-end já vem em UTC (ms), com o fuso aplicado na publicação.
 * - evergreen: início salvo no localStorage por nó; recarregar não reinicia.
 * - daily: zera todo dia no horário data-pb-daily do fuso data-pb-tz.
 */
export const countdownScript = (_cfg: {
	viewEndpoint: string;
	formEndpoint: string;
}) => `
(function(){
  var els=document.querySelectorAll('[data-pb-countdown]');if(!els.length)return;
  var SEC={d:86400,h:3600,m:60,s:1};
  function off(tz){var m=/^([+-])(\\d{2}):?(\\d{2})$/.exec(tz||'');if(!m)return 0;var v=(+m[2])*60+(+m[3]);return (m[1]==='-'?-v:v)*60000;}
  function daily(time,tz,now){var p=(time||'00:00').split(':');var o=off(tz);var l=new Date(now+o);
    var t=Date.UTC(l.getUTCFullYear(),l.getUTCMonth(),l.getUTCDate(),+p[0]||0,+p[1]||0)-o;if(t<=now)t+=86400000;return t;}
  function evergreen(el){var key='pb-cd-'+(el.getAttribute('data-pb-node')||'');var start=0;
    try{start=+localStorage.getItem(key)||0;}catch(e){}
    if(!start){start=Date.now();try{localStorage.setItem(key,String(start));}catch(e){}}
    return start+(+el.getAttribute('data-pb-duration')||0)*1000;}
  function expire(el){
    var a=el.getAttribute('data-pb-expire');
    if(a==='hide'){el.style.display='none';}
    else if(a==='show-message'){var u=el.querySelector('.pb-cd-units');var msg=el.querySelector('.pb-cd-message');
      if(u)u.style.display='none';if(msg)msg.hidden=false;}
    else if(a==='redirect'){var url=el.getAttribute('data-pb-redirect');if(url)location.href=url;}
  }
  var items=[];
  els.forEach(function(el){
    var mode=el.getAttribute('data-pb-mode');
    var it={el:el,mode:mode,done:false,nums:el.querySelectorAll('[data-pb-unit]')};
    if(mode==='evergreen')it.end=evergreen(el);
    else if(mode==='daily')it.end=daily(el.getAttribute('data-pb-daily'),el.getAttribute('data-pb-tz'),Date.now());
    else{it.end=+el.getAttribute('data-pb-end')||0;if(!it.end)it.done=true;}
    items.push(it);
  });
  function pad(n){return n<10?'0'+n:String(n);}
  function tick(){
    var now=Date.now();var alive=false;
    items.forEach(function(it){
      if(it.done)return;
      if(it.mode==='daily'&&it.end<=now)it.end=daily(it.el.getAttribute('data-pb-daily'),it.el.getAttribute('data-pb-tz'),now);
      var rest=Math.max(0,Math.floor((it.end-now)/1000));
      for(var i=0;i<it.nums.length;i++){var n=it.nums[i];var s=SEC[n.getAttribute('data-pb-unit')]||1;
        var v=Math.floor(rest/s);rest=rest%s;var txt=pad(v);if(n.textContent!==txt)n.textContent=txt;}
      if(it.mode!=='daily'&&it.end<=now){it.done=true;expire(it.el);}else{alive=true;}
    });
    if(alive)setTimeout(tick,1000-(Date.now()%1000));
  }
  tick();
})();
`;
