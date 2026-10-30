/* L'ŒUVRE — helpers communs aux scènes d'interaction.
   Chaque scène reçoit { scene, THREE, moteur, mouvementReduit } et renvoie
   une fonction d'arrêt. Repli image géré par creatio.js si ce module échoue. */

export function creerMoteur(scene, THREE) {
  /* Rendu dans une cible hors écran (WebGLRenderTarget), lecture SYNCHRONE des
     pixels (readRenderTargetPixels) puis écriture putImageData dans un canvas 2D
     visible : composite garanti partout (navigateurs réels, headless, lecteurs
     d'écran d'impression), au prix d'une lecture CPU par image — acceptable
     pour un musée ; le mode « mouvement réduit » ne fait qu'une image. */
  const vis = document.createElement('canvas');
  vis.setAttribute('aria-hidden', 'true');
  scene.prepend(vis);
  const ctx = vis.getContext('2d', { willReadFrequently: false });
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setClearColor(0x06080f, 1);
  renderer.setPixelRatio(1);
  let W = 2, H = 2, rt = null, buf = null, img = null;
  function copier() {
    if (!rt) return;
    renderer.readRenderTargetPixels(rt, 0, 0, W, H, buf);
    // renversement vertical : GL lit bas-en-haut, le canvas 2D haut-en-bas
    const src = buf, dst = img.data;
    for (let y = 0; y < H; y++) {
      const ligne = (H - 1 - y) * W * 4, off = y * W * 4;
      dst.set(src.subarray(ligne, ligne + W * 4), off);
    }
    ctx.putImageData(img, 0, 0);
  }
  const redim = () => {
    const r = scene.getBoundingClientRect();
    W = Math.max(2, Math.round(r.width));
    H = Math.max(2, Math.round(r.height));
    vis.width = W; vis.height = H;
    if (rt) rt.dispose();
    rt = new THREE.WebGLRenderTarget(W, H);
    buf = new Uint8Array(W * H * 4);
    img = ctx.createImageData(W, H);
  };
  const renderOrig = renderer.render.bind(renderer);
  renderer.render = (s, c) => {
    renderer.setRenderTarget(rt);
    renderOrig(s, c);
    renderer.setRenderTarget(null);
    copier();
  };
  redim();
  const ro = new ResizeObserver(redim);
  ro.observe(scene);
  return {
    renderer, canvas: vis, redim,
    detruire() {
      ro.disconnect();
      renderer.setAnimationLoop(null);
      if (rt) rt.dispose();
      renderer.dispose();
      vis.remove();
    },
  };
}

export function boucle(renderer, rend, reduit) {
  if (reduit) {           // mouvement réduit : image fixe, redessinée à la demande
    rend();
    return { arreter() {}, rafraichir: rend };
  }
  renderer.setAnimationLoop(rend);
  return { arreter() { renderer.setAnimationLoop(null); }, rafraichir: rend };
}

export function barre(scene) {
  return scene.closest('.interaction')?.querySelector('.interaction__barre') || scene;
}

export function ajouterCurseur(scene, { id, min, max, step, valeur, etikette }) {
  const b = barre(scene);
  const lab = document.createElement('label');
  lab.className = 'interaction__curseur';
  lab.htmlFor = id;
  lab.textContent = etikette;
  const input = document.createElement('input');
  Object.assign(input, { type: 'range', id, min, max, step, value: valeur });
  input.className = 'curseur';
  lab.append(' ', input);
  b.prepend(lab);
  return { input, retirer() { lab.remove(); } };
}

export function ajouterValeurs(scene) {
  const b = barre(scene);
  const span = document.createElement('span');
  span.className = 'interaction__etat interaction__etat--valeurs';
  b.append(span);
  return { span, retirer() { span.remove(); } };
}

export function brancherPilotage(scene, { surDelta, surReset }) {
  const zone = scene.closest('[data-interaction]') || scene;
  const f = (ev) => surDelta && surDelta(ev.detail);
  const r = () => surReset && surReset();
  zone.addEventListener('oeuvre:piloter', f);
  zone.addEventListener('oeuvre:reinitialiser', r);
  const bouton = barre(scene).querySelector('[data-reinit]');
  if (bouton) bouton.addEventListener('click', r);
  return { retirer() { zone.removeEventListener('oeuvre:piloter', f); zone.removeEventListener('oeuvre:reinitialiser', r); } };
}

export function nuage(THREE, n, rayon, forme = 'sphere') {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    if (forme === 'sphere') {
      const u = Math.random() * 2 - 1, ph = Math.random() * Math.PI * 2;
      const r = rayon * (0.35 + 0.65 * Math.cbrt(Math.random()));
      const s = Math.sqrt(1 - u * u);
      pos.set([r * s * Math.cos(ph), r * s * Math.sin(ph), r * u], i * 3);
    } else {
      pos.set([(Math.random() * 2 - 1) * rayon, (Math.random() * 2 - 1) * rayon,
               (Math.random() * 2 - 1) * rayon], i * 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return g;
}
