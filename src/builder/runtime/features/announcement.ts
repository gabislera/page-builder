/**
 * Announcement bar: the "x" hides the bar and stores how long it stays
 * hidden. The inline script right after the bar already hides it while the
 * HTML is parsed; here we only handle the click.
 */
export const announcementScript = (_cfg: { viewEndpoint: string; formEndpoint: string }) => `
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
