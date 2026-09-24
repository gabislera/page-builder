/**
 * Efeitos ao rolar (parallax). O elemento recebe `--pb-py`, somado ao
 * `translate` dele no CSS; a velocidade vem de `--pb-parallax`.
 */
export const motionScript = (_cfg: { viewEndpoint: string; formEndpoint: string }) => `
(function(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var els=[].slice.call(document.querySelectorAll('.pb-parallax'));
  if(!els.length)return;
  var items=els.map(function(el){
    var s=parseFloat(getComputedStyle(el).getPropertyValue('--pb-parallax'))||0.3;
    return {el:el,speed:Math.max(-1,Math.min(1,s))};
  });
  var ticking=false;
  function update(){
    ticking=false;
    var vh=window.innerHeight;
    items.forEach(function(it){
      var r=it.el.getBoundingClientRect();
      if(r.bottom<-vh||r.top>vh*2)return;
      var offset=(r.top+r.height/2)-vh/2;
      it.el.style.setProperty('--pb-py',(-offset*it.speed).toFixed(1)+'px');
    });
  }
  function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(update);}}
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);
  update();
})();
`;
