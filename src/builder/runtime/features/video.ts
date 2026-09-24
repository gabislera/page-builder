/**
 * Vídeo com miniatura (facade): troca o botão pelo player só ao clicar.
 * A página carrega só a imagem; o iframe do YouTube/Vimeo vem sob demanda.
 */
export const videoScript = (_cfg: { viewEndpoint: string; formEndpoint: string }) => `
document.addEventListener('click',function(e){
  var t=e.target instanceof Element?e.target:null;if(!t)return;
  var b=t.closest('[data-pb-video-facade]');if(!b)return;
  e.preventDefault();
  var src=b.getAttribute('data-pb-src');if(!src)return;
  var hash='';var h=src.indexOf('#');if(h>=0){hash=src.slice(h);src=src.slice(0,h);}
  src+=(src.indexOf('?')>=0?'&':'?')+'autoplay=1';
  var f=document.createElement('iframe');
  f.src=src+hash;
  f.title=(b.getAttribute('aria-label')||'').replace(/^Reproduzir: /,'');
  f.setAttribute('allow','accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share');
  f.setAttribute('allowfullscreen','');
  f.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
  b.parentNode.replaceChild(f,b);
  try{f.focus();}catch(err){}
});
`;
