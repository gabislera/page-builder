/**
 * Runtime dos modais: fechar pelo botão, pelo fundo e ao seguir âncoras
 * internas, e abertura automática (após tempo ou intenção de saída).
 * A abertura por clique (data-pb-modal) já está no runtime principal.
 */
export const modalScript = (_cfg: {
	viewEndpoint: string;
	formEndpoint: string;
}) => `
(function(){
var ds=document.querySelectorAll('dialog.pb-modal');
if(!ds.length)return;
document.addEventListener('click',function(e){
  var t=e.target;
  if(t instanceof HTMLDialogElement&&t.classList.contains('pb-modal')&&t.open){
    var r=t.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)t.close();
    return;
  }
  if(!(t instanceof Element))return;
  var d=t.closest('dialog.pb-modal');
  if(!d)return;
  if(t.closest('[data-pb-close]')){e.preventDefault();d.close();return;}
  var a=t.closest('a[href^="#"]');
  if(a&&!a.hasAttribute('data-pb-modal'))d.close();
});
function openAuto(d){
  if(d.open||document.querySelector('dialog[open]'))return;
  if(d.getAttribute('data-pb-once')==='1'){
    var k='pb-modal-'+d.id;
    try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1');}catch(x){}
  }
  if(d.showModal)d.showModal();
}
ds.forEach(function(d){
  var mode=d.getAttribute('data-pb-auto');
  if(mode==='delay'){
    setTimeout(function(){openAuto(d);},Math.max(0,parseFloat(d.getAttribute('data-pb-delay'))||0)*1000);
  }else if(mode==='exit'){
    if(!window.matchMedia||!matchMedia('(pointer:fine)').matches)return;
    var fired=false;
    document.addEventListener('mouseout',function(e){
      if(fired||e.relatedTarget||e.clientY>10)return;
      fired=true;openAuto(d);
    });
  }
});
})();
`;
