/**
 * Cabeçalho: marca `pb-scrolled` quando a página rolou (fundo, sombra e
 * encolhimento via CSS) e, com `data-pb-hide-on-scroll`, esconde o cabeçalho
 * ao rolar para baixo (`pb-header-hidden`) e o mostra de volta ao subir.
 * O menu hambúrguer fica no runtime do Menu.
 */
export const headerScript = (_cfg: {
	viewEndpoint: string;
	formEndpoint: string;
}) => `
(function(){
  var hs=Array.prototype.slice.call(document.querySelectorAll('[data-pb-header]'));
  if(!hs.length)return;
  var last=window.scrollY||window.pageYOffset||0;
  var ticking=false;
  function update(){
    ticking=false;
    var y=window.scrollY||window.pageYOffset||0;
    // com um menu aberto a página não rola: mantém o cabeçalho como está
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
