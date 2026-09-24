/**
 * Progress bar: grows from 0 to the value when it enters the viewport.
 * Without JS (or with reduced motion) the bar already shows the final value.
 */
export const progressScript = (_cfg: { viewEndpoint: string; formEndpoint: string }) => `
(function(){
  var els=document.querySelectorAll('[data-pb-progress]');if(!els.length)return;
  if(!('IntersectionObserver' in window))return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  function bar(el){return el.querySelector('.pb-progress-bar');}
  var io=new IntersectionObserver(function(entries){entries.forEach(function(en){
    if(!en.isIntersecting)return;io.unobserve(en.target);
    var b=bar(en.target);if(!b)return;
    var ms=+en.target.getAttribute('data-pb-duration')||1200;
    b.style.transition='width '+ms+'ms cubic-bezier(.22,1,.36,1)';
    b.style.width=(+en.target.getAttribute('data-pb-progress')||0)+'%';
  })},{threshold:.3});
  els.forEach(function(el){
    var b=bar(el);if(!b)return;
    b.style.transition='none';b.style.width='0%';
    void b.offsetWidth;
    io.observe(el);
  });
})();
`;
