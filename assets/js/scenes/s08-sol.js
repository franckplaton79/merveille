/* Salle 08 — Une cuillère de sol : descendre vers le milliard de vivants.
   Ordres de grandeur : ~10⁹ organismes par cuillère (cm³), 10⁸-10¹⁰ par
   gramme selon la méthode (culture vs microscopie/qPCR), Nature Reviews
   Microbiology 2011. La densité de points affichée est illustrative. */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 10);

  const scene3 = new THREE.Scene();
  // agrégats de sol
  const gN = 900;
  const gGeo = new THREE.BufferGeometry();
  const gPos = new Float32Array(gN * 3);
  for (let i = 0; i < gN; i++) {
    const r = 5 * Math.cbrt(Math.random());
    const u = Math.random() * 2 - 1, ph = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    gPos.set([r * s * Math.cos(ph), r * s * Math.sin(ph), r * u * 0.6], i * 3);
  }
  gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
  const sol = new THREE.Points(gGeo, new THREE.PointsMaterial({
    size: 4.5, sizeAttenuation: false, color: 0x8a5a33, depthWrite: false }));
  scene3.add(sol);

  // microbes : visibles seulement en zoomant
  const mN = 3000;
  const mGeo = new THREE.BufferGeometry();
  const mPos = new Float32Array(mN * 3);
  const seuil = new Float32Array(mN);
  for (let i = 0; i < mN; i++) {
    const r = 5 * Math.cbrt(Math.random());
    const u = Math.random() * 2 - 1, ph = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    mPos.set([r * s * Math.cos(ph), r * s * Math.sin(ph), r * u * 0.6], i * 3);
    seuil[i] = -2 - Math.random() * 4;      // exposant d'échelle d'apparition
  }
  mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  const microbes = new THREE.Points(mGeo, new THREE.PointsMaterial({
    size: 2.2, sizeAttenuation: false, color: 0x9fe8b0, depthWrite: false }));
  scene3.add(microbes);

  const c = ajouterCurseur(scene, { id: 's08-echelle', min: -6, max: -2, step: 0.05, valeur: -2,
    etikette: 'Échelle observée (exposant de 10, en mètres)' });
  const valeurs = ajouterValeurs(scene);

  function appliquer() {
    const e = parseFloat(c.input.value);
    let visibles = 0;
    const p = mGeo.getAttribute('position');
    for (let i = 0; i < mN; i++) {
      const on = e <= seuil[i];
      p.array[i * 3 + 2] = on ? mPos[i * 3 + 2] : 999;
      if (on) visibles++;
    }
    p.needsUpdate = true;
    const ordre = e > -3 ? 'milliers à millions par cm³'
      : e > -4.5 ? 'millions à centaines de millions par cm³'
      : 'de l’ordre du milliard et plus par cuillère (10⁹-10¹⁰/g selon méthode)';
    valeurs.span.textContent = `échelle 10^${e.toFixed(2)} m · ${ordre} · Nat Rev Microbiol 2011`;
  }

  c.input.addEventListener('input', () => { appliquer(); L.rafraichir(); });
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      c.input.value = (parseFloat(c.input.value) + d.delta * 0.1).toFixed(2);
      appliquer(); L.rafraichir();
    },
    surReset: () => { c.input.value = -2; appliquer(); L.rafraichir(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    scene3.rotation.y = temps * 0.00004;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); L.arreter(); M.detruire(); };
}
