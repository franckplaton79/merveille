/* Modèle de Hill indicatif : paramètres arbitraires, non clinique. */
(() => {
  'use strict';
  const slider = document.getElementById('oxygen-niveau');
  const status = document.getElementById('oxygen-etat');
  const canvas = document.getElementById('oxygen-courbe');
  if (!slider || !status || !canvas) return;
  const ctx = canvas.getContext('2d');
  const sat = x => x === 0 ? 0 : Math.pow(x, 2.8) / (Math.pow(50, 2.8) + Math.pow(x, 2.8));
  slider.disabled = false;
  function update() {
    const n = Number(slider.value), fraction = sat(n), occupied = Math.round(fraction * 4);
    status.textContent = `Niveau relatif ${n} sur 100. Occupation moyenne illustrative : ${Math.round(fraction * 100)} pour cent. Repère symbolique : ${occupied} site${occupied > 1 ? 's' : ''} sur 4.`;
    if (!ctx) return;
    const W = canvas.width, H = canvas.height, left=35, top=15, width=W-55, height=H-40;
    ctx.clearRect(0, 0, W, H);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#4b5563';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(left,top+height);ctx.lineTo(left+width,top+height);ctx.stroke();
    ctx.strokeStyle='#136e65';ctx.lineWidth=3;ctx.beginPath();
    for(let x=0;x<=100;x++){const px=left+width*x/100, py=top+height*(1-sat(x));if(x===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();
    ctx.fillStyle='#9a571d';ctx.beginPath();ctx.arc(left+width*n/100,top+height*(1-fraction),5,0,2*Math.PI);ctx.fill();
    ctx.fillStyle='#222';ctx.font='14px sans-serif';ctx.fillText('0',left-4,H-5);ctx.fillText('100',left+width-25,H-5);
  }
  slider.addEventListener('input', update);update();
})();
