/**
 * Cabeçalho: menu hambúrguer (abre/fecha, fecha ao clicar num link, fora
 * do cabeçalho ou com Esc) e sombra ao rolar nos cabeçalhos fixos.
 */
export const headerScript = (_cfg: {
	viewEndpoint: string;
	formEndpoint: string;
}) => `
(function(){
  var hs=Array.prototype.slice.call(document.querySelectorAll('[data-pb-header]'));
  if(!hs.length)return;
  function setOpen(h,open){
    h.classList.toggle('pb-menu-open',open);
    var t=h.querySelector('[data-pb-menu-toggle]');
    if(t){t.setAttribute('aria-expanded',open?'true':'false');t.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');}
  }
  hs.forEach(function(h){
    var t=h.querySelector('[data-pb-menu-toggle]');
    if(t)t.addEventListener('click',function(){setOpen(h,!h.classList.contains('pb-menu-open'));});
    h.addEventListener('click',function(e){
      var a=e.target instanceof Element?e.target.closest('a'):null;
      if(a&&h.contains(a))setOpen(h,false);
    });
  });
  document.addEventListener('click',function(e){
    var t=e.target instanceof Node?e.target:null;
    hs.forEach(function(h){if(h.classList.contains('pb-menu-open')&&t&&!h.contains(t))setOpen(h,false);});
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape')hs.forEach(function(h){if(h.classList.contains('pb-menu-open'))setOpen(h,false);});
  });
  var sticky=hs.filter(function(h){return h.hasAttribute('data-pb-sticky');});
  if(sticky.length){
    var onScroll=function(){var s=(window.scrollY||window.pageYOffset)>4;sticky.forEach(function(h){h.classList.toggle('pb-scrolled',s);});};
    window.addEventListener('scroll',onScroll,{passive:true});
    onScroll();
  }
})();
`;
