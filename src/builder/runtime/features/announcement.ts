/**
 * Barra de aviso: o "x" esconde a barra e guarda até quando ela fica
 * escondida. O script inline logo depois da barra já esconde na leitura do
 * HTML; aqui só tratamos o clique.
 */
export const announcementScript = (_cfg: {
	viewEndpoint: string;
	formEndpoint: string;
}) => `
(function(){
  var bar=document.querySelector('.pb-bar[data-pb-sticky]:not([hidden])');
  if(!bar)return;
  function set(){document.documentElement.style.setProperty('--pb-bar-h',bar.hidden?'0px':bar.getBoundingClientRect().height+'px');}
  set();
  if('ResizeObserver' in window)new ResizeObserver(set).observe(bar);else addEventListener('resize',set);
})();
document.addEventListener('click',function(e){
  var t=e.target instanceof Element?e.target.closest('[data-pb-bar-close]'):null;if(!t)return;
  var bar=t.closest('[data-pb-bar]');if(!bar)return;
  bar.hidden=true;
  var days=parseFloat(bar.getAttribute('data-pb-remember'))||0;
  try{if(days>0)localStorage.setItem(bar.getAttribute('data-pb-bar'),String(Date.now()+days*864e5));}catch(_){}
});
`;
