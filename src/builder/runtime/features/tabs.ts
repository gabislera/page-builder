/**
 * Abas: clique troca a aba ativa (classe `pb-tab-active` no botão e no
 * painel); setas do teclado, Home e End navegam entre as abas (tabindex
 * móvel + aria-selected). Botões e painéis são filhos diretos de
 * [data-pb-tabs], na mesma ordem (o N-ésimo botão abre o N-ésimo painel).
 */
export const tabsScript = (_cfg: {
	viewEndpoint: string;
	formEndpoint: string;
}) => `
(function(){
  var ts=document.querySelectorAll('[data-pb-tabs]');
  if(!ts.length)return;
  function kids(el,cls){return Array.prototype.filter.call(el.children,function(c){return c.classList.contains(cls);});}
  ts.forEach(function(t){
    var btns=kids(t,'pb-tab-btn'),panels=kids(t,'pb-tab-panel');
    if(!btns.length)return;
    function act(i,focus){
      btns.forEach(function(b,j){
        var on=i===j;
        b.classList.toggle('pb-tab-active',on);
        b.setAttribute('aria-selected',on?'true':'false');
        b.tabIndex=on?0:-1;
        if(panels[j])panels[j].classList.toggle('pb-tab-active',on);
      });
      if(focus)btns[i].focus();
    }
    btns.forEach(function(b,i){
      b.addEventListener('click',function(){act(i,false);});
      b.addEventListener('keydown',function(e){
        var n=btns.length,k=e.key,to=-1;
        if(k==='ArrowRight'||k==='ArrowDown')to=(i+1)%n;
        else if(k==='ArrowLeft'||k==='ArrowUp')to=(i-1+n)%n;
        else if(k==='Home')to=0;
        else if(k==='End')to=n-1;
        if(to<0)return;
        e.preventDefault();act(to,true);
      });
    });
  });
})();
`;
