/**
 * Numeric counter: when the number enters the viewport, counts from `from`
 * to the final value with ease-out. The HTML already has the final number;
 * without JS (or with reduced motion) it just appears ready.
 */
export const counterScript = (_cfg: { viewEndpoint: string; formEndpoint: string }) => `
(function(){
  var els=document.querySelectorAll('[data-pb-count]');
  if(!els.length||!('IntersectionObserver' in window))return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  function fmt(v,dec,sep){return v.toLocaleString('pt-BR',{minimumFractionDigits:dec,maximumFractionDigits:dec,useGrouping:sep});}
  function run(el){
    var to=parseFloat(el.getAttribute('data-pb-count'))||0;
    var from=parseFloat(el.getAttribute('data-pb-from'))||0;
    var dec=parseInt(el.getAttribute('data-pb-decimals'),10)||0;
    var dur=parseInt(el.getAttribute('data-pb-duration'),10)||0;
    var sep=el.getAttribute('data-pb-thousands')==='1';
    if(dur<=0){el.textContent=fmt(to,dec,sep);return;}
    var start=null;
    function step(t){
      if(start===null)start=t;
      var p=Math.min(1,(t-start)/dur);
      var eased=1-Math.pow(1-p,3);
      el.textContent=fmt(from+(to-from)*eased,dec,sep);
      if(p<1)requestAnimationFrame(step);
    }
    el.textContent=fmt(from,dec,sep);
    requestAnimationFrame(step);
  }
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){io.unobserve(e.target);run(e.target);}});
  },{threshold:.4});
  els.forEach(function(el){io.observe(el);});
})();
`;
