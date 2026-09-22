/**
 * Botões de compartilhar: monta o link de cada rede com o endereço da página
 * (ou o link fixo), copia o link com aviso e usa o compartilhamento nativo
 * do celular quando existe.
 */
export const shareScript = (_cfg: {
	viewEndpoint: string;
	formEndpoint: string;
}) => `
(function(){
document.querySelectorAll('[data-pb-share]').forEach(function(w){
  var url=w.getAttribute('data-pb-share-url')||location.href.split('#')[0];
  var text=w.getAttribute('data-pb-share-text')||document.title;
  var u=encodeURIComponent(url),t=encodeURIComponent(text);
  var map={
    whatsapp:'https://wa.me/?text='+encodeURIComponent(text+' '+url),
    facebook:'https://www.facebook.com/sharer/sharer.php?u='+u,
    linkedin:'https://www.linkedin.com/sharing/share-offsite/?url='+u,
    x:'https://twitter.com/intent/tweet?url='+u+'&text='+t,
    telegram:'https://t.me/share/url?url='+u+'&text='+t,
    email:'mailto:?subject='+t+'&body='+encodeURIComponent(text+'\\n\\n'+url)
  };
  w.querySelectorAll('a[data-pb-share-net]').forEach(function(a){
    var n=a.getAttribute('data-pb-share-net');if(map[n])a.href=map[n];
    if(n==='email')a.removeAttribute('target');
  });
  if(navigator.share)w.querySelectorAll('[data-pb-share-net=native]').forEach(function(b){b.hidden=false;});
  w.addEventListener('click',function(e){
    var b=e.target instanceof Element?e.target.closest('button[data-pb-share-net]'):null;if(!b)return;
    if(b.getAttribute('data-pb-share-net')==='native'){
      if(navigator.share)navigator.share({title:document.title,text:text,url:url}).catch(function(){});
      return;
    }
    function done(){b.setAttribute('data-pb-copied-show','');clearTimeout(b._pbT);b._pbT=setTimeout(function(){b.removeAttribute('data-pb-copied-show');},1800);}
    function fallback(){
      var ta=document.createElement('textarea');ta.value=url;ta.setAttribute('readonly','');
      ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
      try{document.execCommand('copy');}catch(x){}ta.remove();done();
    }
    if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(url).then(done,fallback);else fallback();
  });
});
})();
`;
