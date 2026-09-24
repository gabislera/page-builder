/**
 * Accordion: enables the smooth animation. Without this script native
 * <details> snaps open/closed; with it, the accordion gets `pb-acc-js` and
 * height animates via `grid-template-rows` (`is-open` class). On close, the
 * `open` attribute is removed only after the transition so the close
 * animation is visible too.
 */
export const accordionScript = (_cfg: { viewEndpoint: string; formEndpoint: string }) => `
(function(){
  var accs=document.querySelectorAll('.pb-acc');
  if(!accs.length)return;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  accs.forEach(function(acc){
    var items=[].filter.call(acc.children,function(c){return c.classList.contains('pb-acc-item');});
    items.forEach(function(d){if(d.open)d.classList.add('is-open');});
    acc.classList.add('pb-acc-js');
    function panel(d){return [].filter.call(d.children,function(c){return c.classList.contains('pb-acc-panel');})[0];}
    function close(d){
      if(!d.classList.contains('is-open'))return;
      d.classList.remove('is-open');
      var p=panel(d);
      function done(){if(!d.classList.contains('is-open'))d.open=false;}
      if(reduce||!p){done();return;}
      var t=setTimeout(done,1200);
      p.addEventListener('transitionend',function h(e){
        if(e.target!==p)return;
        p.removeEventListener('transitionend',h);clearTimeout(t);done();
      });
    }
    function open(d){
      if(acc.hasAttribute('data-pb-exclusive'))items.forEach(function(o){if(o!==d)close(o);});
      d.open=true;
      // two frames: the browser paints the closed panel before animating
      requestAnimationFrame(function(){requestAnimationFrame(function(){d.classList.add('is-open');});});
    }
    items.forEach(function(d){
      var s=[].filter.call(d.children,function(c){return c.tagName==='SUMMARY';})[0];
      if(!s)return;
      s.addEventListener('click',function(e){
        e.preventDefault();
        if(d.classList.contains('is-open'))close(d);else open(d);
      });
    });
  });
})();
`;
