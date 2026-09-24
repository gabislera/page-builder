/**
 * Menu: painel do celular (abre no hambúrguer; fecha no fundo escuro, no X,
 * ao clicar num link ou com Esc; trava a rolagem da página enquanto aberto),
 * submenus recolhíveis no painel e marcação do link da página atual.
 */
export const menuScript = (_cfg: { viewEndpoint: string; formEndpoint: string }) => `
(function(){
  var ms=Array.prototype.slice.call(document.querySelectorAll('[data-pb-menu]'));
  if(!ms.length)return;
  var norm=function(p){return p.replace(/\\/+$/,'')||'/';};
  var here=norm(location.pathname);
  ms.forEach(function(m){
    m.querySelectorAll('a[href]').forEach(function(a){
      var href=a.getAttribute('href')||'';
      if(!href||href.charAt(0)==='#')return;
      try{
        var u=new URL(href,location.href);
        if(u.origin===location.origin&&!u.hash&&norm(u.pathname)===here){
          a.classList.add('pb-active');a.setAttribute('aria-current','page');
        }
      }catch(e){}
    });
  });
  var prevOverflow=null;
  function lock(on){
    var b=document.body;
    if(on&&prevOverflow===null){prevOverflow=b.style.overflow;b.style.overflow='hidden';}
    else if(!on&&prevOverflow!==null){b.style.overflow=prevOverflow;prevOverflow=null;}
  }
  function isOpen(m){return m.classList.contains('pb-menu-open');}
  function setOpen(m,open){
    if(isOpen(m)===open)return;
    m.classList.toggle('pb-menu-open',open);
    var t=m.querySelector('[data-pb-menu-toggle]');
    if(t)t.setAttribute('aria-expanded',open?'true':'false');
    lock(ms.some(isOpen));
    if(open){var c=m.querySelector('.pb-menu-close');if(c)c.focus();}
    else if(t&&t.offsetParent)t.focus();
  }
  ms.forEach(function(m){
    m.addEventListener('click',function(e){
      var t=e.target instanceof Element?e.target:null;if(!t)return;
      if(t.closest('[data-pb-menu-toggle]')){setOpen(m,!isOpen(m));return;}
      var st=t.closest('[data-pb-submenu-toggle]');
      if(st){
        var li=st.closest('li');if(!li)return;
        var o=!li.classList.contains('pb-sub-open');
        li.classList.toggle('pb-sub-open',o);
        st.setAttribute('aria-expanded',o?'true':'false');
        st.setAttribute('aria-label',o?'Fechar submenu':'Abrir submenu');
        return;
      }
      if(t.closest('[data-pb-menu-close]')){setOpen(m,false);return;}
      if(t.closest('.pb-menu-panel a'))setOpen(m,false);
    });
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape')ms.forEach(function(m){setOpen(m,false);});
  });
  window.addEventListener('resize',function(){
    ms.forEach(function(m){
      var t=m.querySelector('[data-pb-menu-toggle]');
      if(isOpen(m)&&t&&!t.offsetParent)setOpen(m,false);
    });
  });
})();
`;
