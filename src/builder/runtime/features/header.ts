/**
 * Header: adds `pb-scrolled` after the page scrolls (background, shadow, and
 * shrink via CSS) and, with `data-pb-hide-on-scroll`, hides the header on
 * scroll down (`pb-header-hidden`) and shows it again on scroll up.
 * The hamburger menu lives in the Menu runtime.
 */
export const headerScript = (_cfg: { viewEndpoint: string; formEndpoint: string }) => `
(function(){
  var hs=Array.prototype.slice.call(document.querySelectorAll('[data-pb-header]'));
  if(!hs.length)return;
  var last=window.scrollY||window.pageYOffset||0;
  var ticking=false;
  function update(){
    ticking=false;
    var y=window.scrollY||window.pageYOffset||0;
    // with a menu open the page does not scroll: keep the header as-is
    var locked=!!document.querySelector('[data-pb-menu].pb-menu-open');
    hs.forEach(function(h){
      h.classList.toggle('pb-scrolled',y>8);
      if(!h.hasAttribute('data-pb-hide-on-scroll')||locked)return;
      if(y<last-2||y<=h.offsetHeight)h.classList.remove('pb-header-hidden');
      else if(y>last+2)h.classList.add('pb-header-hidden');
    });
    if(Math.abs(y-last)>2)last=y;
  }
  window.addEventListener('scroll',function(){
    if(!ticking){ticking=true;requestAnimationFrame(update);}
  },{passive:true});
  update();
})();
`;
