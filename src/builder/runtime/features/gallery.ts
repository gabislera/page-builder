/**
 * Gallery lightbox: opens the image fullscreen with prev/next, close,
 * keyboard (arrows/Esc), swipe on mobile, and focus trapped in the dialog.
 * Items are the [data-pb-lightbox] links in each [data-pb-gallery]; items
 * with their own link are excluded.
 */
export const galleryScript = (_cfg: { viewEndpoint: string; formEndpoint: string }) => `
(function(){
if(!document.querySelector('[data-pb-gallery]'))return;
var st=document.createElement('style');
st.textContent='.pb-lb{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(9,9,11,.92);opacity:0;transition:opacity .2s ease;touch-action:pan-y}'
+'.pb-lb.pb-lb-on{opacity:1}'
+'.pb-lb figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:12px;max-width:92vw;max-height:88vh}'
+'.pb-lb img{max-width:92vw;max-height:80vh;width:auto;height:auto;object-fit:contain;border-radius:6px;box-shadow:0 20px 60px rgba(0,0,0,.5);user-select:none;-webkit-user-drag:none}'
+'.pb-lb figcaption{color:#e4e4e7;font:400 15px/1.4 system-ui,sans-serif;text-align:center;max-width:720px}'
+'.pb-lb button{position:absolute;display:flex;align-items:center;justify-content:center;width:48px;height:48px;border:0;border-radius:999px;background:rgba(255,255,255,.1);color:#fff;cursor:pointer;transition:background .2s ease}'
+'.pb-lb button:hover,.pb-lb button:focus-visible{background:rgba(255,255,255,.22);outline:none}'
+'.pb-lb button:focus-visible{box-shadow:0 0 0 2px #fff}'
+'.pb-lb svg{width:24px;height:24px}'
+'.pb-lb-close{top:16px;right:16px}.pb-lb-prev{left:16px;top:50%;transform:translateY(-50%)}.pb-lb-next{right:16px;top:50%;transform:translateY(-50%)}'
+'.pb-lb-count{position:absolute;top:28px;left:24px;color:#a1a1aa;font:500 13px/1 system-ui,sans-serif}'
+'@media (max-width:600px){.pb-lb-prev,.pb-lb-next{top:auto;bottom:20px;transform:none}.pb-lb-prev{left:calc(50% - 60px)}.pb-lb-next{right:calc(50% - 60px)}}';
document.head.appendChild(st);
var svg=function(d){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';};
var lb=null,img,cap,count,prev,next,items=[],idx=0,opener=null,prevOverflow='';
function build(){
  lb=document.createElement('div');lb.className='pb-lb';
  lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Imagem ampliada');
  lb.innerHTML='<span class="pb-lb-count"></span><figure><img alt=""><figcaption></figcaption></figure>'
    +'<button type="button" class="pb-lb-prev" aria-label="Imagem anterior">'+svg('<path d="m15 18-6-6 6-6"/>')+'</button>'
    +'<button type="button" class="pb-lb-next" aria-label="Próxima imagem">'+svg('<path d="m9 18 6-6-6-6"/>')+'</button>'
    +'<button type="button" class="pb-lb-close" aria-label="Fechar">'+svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>')+'</button>';
  img=lb.querySelector('img');cap=lb.querySelector('figcaption');count=lb.querySelector('.pb-lb-count');
  prev=lb.querySelector('.pb-lb-prev');next=lb.querySelector('.pb-lb-next');
  prev.addEventListener('click',function(){go(-1);});
  next.addEventListener('click',function(){go(1);});
  lb.querySelector('.pb-lb-close').addEventListener('click',close);
  lb.addEventListener('click',function(e){if(e.target===lb||e.target.tagName==='FIGURE')close();});
  lb.addEventListener('keydown',function(e){
    if(e.key==='Escape'){e.preventDefault();close();}
    else if(e.key==='ArrowLeft'){e.preventDefault();go(-1);}
    else if(e.key==='ArrowRight'){e.preventDefault();go(1);}
    else if(e.key==='Tab'){
      var f=[].slice.call(lb.querySelectorAll('button')).filter(function(b){return b.style.display!=='none';});
      if(!f.length)return;
      var i=f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus();
    }
  });
  var sx=null,sy=0;
  lb.addEventListener('touchstart',function(e){if(e.touches.length===1){sx=e.touches[0].clientX;sy=e.touches[0].clientY;}},{passive:true});
  lb.addEventListener('touchend',function(e){
    if(sx===null)return;
    var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;sx=null;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))go(dx<0?1:-1);
  });
}
function show(){
  var a=items[idx];
  img.src=a.getAttribute('href');
  var i=a.querySelector('img');img.alt=i?i.alt:'';
  var c=a.getAttribute('data-pb-caption')||'';
  cap.textContent=c;cap.style.display=c?'':'none';
  var many=items.length>1;
  prev.style.display=next.style.display=count.style.display=many?'':'none';
  count.textContent=(idx+1)+' / '+items.length;
}
function go(d){if(items.length<2)return;idx=(idx+d+items.length)%items.length;show();}
function open(a){
  var g=a.closest('[data-pb-gallery]');
  items=[].slice.call(g.querySelectorAll('a[data-pb-lightbox]'));
  idx=Math.max(0,items.indexOf(a));opener=a;
  if(!lb)build();
  // inside an open modal, must live on the same top layer
  (a.closest('dialog[open]')||document.body).appendChild(lb);
  show();
  lb.style.display='flex';
  prevOverflow=document.documentElement.style.overflow;
  document.documentElement.style.overflow='hidden';
  requestAnimationFrame(function(){lb.classList.add('pb-lb-on');});
  lb.querySelector('.pb-lb-close').focus();
}
function close(){
  if(!lb||lb.style.display==='none')return;
  lb.classList.remove('pb-lb-on');lb.style.display='none';img.removeAttribute('src');
  document.documentElement.style.overflow=prevOverflow;
  if(opener&&opener.focus)opener.focus();
}
document.addEventListener('click',function(e){
  var t=e.target instanceof Element?e.target:null;if(!t)return;
  var a=t.closest('a[data-pb-lightbox]');
  if(!a||!a.closest('[data-pb-gallery]'))return;
  if(e.metaKey||e.ctrlKey||e.shiftKey||e.button===1)return;
  e.preventDefault();open(a);
});
})();
`;
