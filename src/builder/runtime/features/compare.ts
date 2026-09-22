/**
 * Antes e depois: o <input type="range"> invisível move a linha; aqui só
 * repassamos o valor para a variável CSS que recorta a imagem de "antes".
 */
export const compareScript = (_cfg: {
	viewEndpoint: string;
	formEndpoint: string;
}) => `
document.addEventListener('input',function(e){
  var t=e.target;
  if(!(t instanceof HTMLInputElement)||!t.classList.contains('pb-ba-range'))return;
  var w=t.closest('[data-pb-ba]');if(w)w.style.setProperty('--pb-ba',t.value+'%');
});
`;
