/**
 * Carousel: the track already scrolls with scroll-snap (no JS). This adds
 * arrows and dots (one slide / jump to slide), active dot and disabled
 * arrows from scroll, hidden unreachable dots (several slides at once),
 * looping arrows, and autoplay (pauses on hover, inner focus, hidden tab,
 * and respects prefers-reduced-motion).
 */
export const carouselScript = (_cfg: { viewEndpoint: string; formEndpoint: string }) => `
(function(){
  var cs=document.querySelectorAll('[data-pb-carousel]');
  if(!cs.length)return;
  var reduce=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  cs.forEach(function(c){
    var track=c.querySelector('.pb-car-track');if(!track)return;
    var prev=c.querySelector('.pb-car-prev'),next=c.querySelector('.pb-car-next');
    var dots=Array.prototype.slice.call(c.querySelectorAll('.pb-car-dot'));
    var loop=c.getAttribute('data-pb-loop')==='1';
    function slides(){return Array.prototype.filter.call(track.children,function(el){return el.classList.contains('pb-car-slide')&&el.getClientRects().length>0;});}
    function off(el){return el.getBoundingClientRect().left-track.getBoundingClientRect().left+track.scrollLeft;}
    function state(){
      var s=slides(),max=track.scrollWidth-track.clientWidth,x=track.scrollLeft,cur=0,best=Infinity,last=Math.max(s.length-1,0);
      s.forEach(function(el,i){var o=off(el),d=Math.abs(o-x);if(d<best){best=d;cur=i;}if(o>=max-2&&i<last)last=i;});
      var end=x>=max-2;
      return {s:s,cur:end?last:cur,last:last,start:x<=2,end:end};
    }
    function go(i){
      var s=slides();if(!s.length)return;
      var el=s[Math.max(0,Math.min(i,s.length-1))];
      track.scrollTo({left:off(el),behavior:reduce?'auto':'smooth'});
    }
    function move(d){
      var st=state();
      if(d>0&&st.end){if(loop)go(0);return false;}
      if(d<0&&st.start){if(loop)go(st.last);return false;}
      go(st.cur+d);return true;
    }
    var frame=0;
    function sync(){
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(function(){
        var st=state();
        dots.forEach(function(dot,i){
          var on=i===st.cur;
          dot.classList.toggle('pb-car-dot-active',on);
          if(on)dot.setAttribute('aria-current','true');else dot.removeAttribute('aria-current');
          dot.hidden=i>st.last;
        });
        if(prev)prev.disabled=!loop&&st.start;
        if(next)next.disabled=!loop&&st.end;
      });
    }
    if(prev)prev.addEventListener('click',function(){move(-1);});
    if(next)next.addEventListener('click',function(){move(1);});
    dots.forEach(function(dot,i){dot.addEventListener('click',function(){go(i);});});
    track.addEventListener('scroll',sync,{passive:true});
    window.addEventListener('resize',sync);
    sync();
    var sec=parseFloat(c.getAttribute('data-pb-autoplay')||'0');
    if(sec>0&&!reduce){
      var hover=false,focus=false,touch=0;
      if(c.getAttribute('data-pb-pause')==='1'){
        c.addEventListener('mouseenter',function(){hover=true;});
        c.addEventListener('mouseleave',function(){hover=false;});
      }
      c.addEventListener('focusin',function(){focus=true;});
      c.addEventListener('focusout',function(){focus=false;});
      track.addEventListener('pointerdown',function(){touch=Date.now();},{passive:true});
      setInterval(function(){
        if(hover||focus||document.hidden||Date.now()-touch<sec*1000)return;
        var st=state();
        if(st.end)go(0);else go(st.cur+1);
      },Math.max(1,sec)*1000);
    }
  });
})();
`;
