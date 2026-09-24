/**
 * Tabs: click switches the active tab (`pb-tab-active` on the button and panel);
 * arrows, Home, and End move between tabs (roving tabindex + aria-selected).
 * The Nth button in the bar opens the Nth panel.
 */
export const tabsScript = (_cfg: { viewEndpoint: string; formEndpoint: string }) => `
(function(){
  var ts=document.querySelectorAll('[data-pb-tabs]');
  if(!ts.length)return;
  function kids(el,cls){return el?[].filter.call(el.children,function(c){return c.classList.contains(cls);}):[];}
  ts.forEach(function(t){
    var nav=kids(t,'pb-tabs-nav')[0],list=nav&&kids(nav,'pb-tabs-list')[0];
    var btns=kids(list,'pb-tab-btn'),panels=kids(kids(t,'pb-tabs-panels')[0],'pb-tab-panel');
    if(!btns.length)return;
    function act(i,focus){
      btns.forEach(function(b,j){
        var on=i===j;
        b.classList.toggle('pb-tab-active',on);
        b.setAttribute('aria-selected',on?'true':'false');
        b.tabIndex=on?0:-1;
        if(panels[j])panels[j].classList.toggle('pb-tab-active',on);
      });
      // keep the active tab visible when the bar scrolls horizontally
      var b=btns[i];
      if(list.scrollWidth>list.clientWidth){
        list.scrollTo({left:b.offsetLeft-(list.clientWidth-b.offsetWidth)/2,behavior:'smooth'});
      }
      if(focus)b.focus();
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
