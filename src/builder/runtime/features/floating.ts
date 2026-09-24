/**
 * Runtime dos botões flutuantes: mostra o "voltar ao topo" depois de rolar
 * (data-pb-offset, em px) e rola suavemente até o topo ao clicar.
 */
export const floatingScript = (_cfg: { viewEndpoint: string; formEndpoint: string }) => `
(function(){
var tops=document.querySelectorAll('[data-pb-top]');
if(!tops.length)return;
var queued=false;
function update(){
  queued=false;
  var y=window.scrollY||document.documentElement.scrollTop||0;
  for(var i=0;i<tops.length;i++){
    var off=parseFloat(tops[i].getAttribute('data-pb-offset'))||300;
    tops[i].classList.toggle('pb-visible',y>off);
  }
}
window.addEventListener('scroll',function(){if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});
update();
document.addEventListener('click',function(e){
  var t=e.target instanceof Element?e.target.closest('[data-pb-top]'):null;
  if(!t)return;
  e.preventDefault();
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});
});
})();
`;
