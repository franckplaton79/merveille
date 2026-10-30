/* Salle 11 — 473 gènes : le plus petit génome autonome jamais construit
   (JCVI-syn3.0, Hutchison et al. 2016, Science 352:aad6558). Un point = un gène ;
   on parcourt l'anneau au clavier ou au curseur. Aucun autre chiffre ajouté. */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 2.2, 9.5);
  camera.lookAt(0, 0, 0);

  const scene3 = new THREE.Scene();
  const G = 473;
  const pos = new Float32Array(G * 3);
  for (let i = 0; i < G; i++) {
    const a = (i / G) * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * 3;
    pos[i * 3 + 1] = Math.sin(a * 3) * 0.12;
    pos[i * 3 + 2] = Math.sin(a) * 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x7fd4c1, size: 4.2, sizeAttenuation: false, depthWrite: false }));
  scene3.add(points);

  /* marqueur du gène parcouru */
  const mgeo = new THREE.BufferGeometry();
  mgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
  const marque = new THREE.Points(mgeo, new THREE.PointsMaterial({
    color: 0xe6c46a, size: 9, sizeAttenuation: false, depthWrite: false }));
  scene3.add(marque);

  /* membrane de la cellule minimale, suggérée */
  const ves = new THREE.Mesh(new THREE.SphereGeometry(3.9, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x22384a, wireframe: true }));
  scene3.add(ves);

  const c = ajouterCurseur(scene, { id: 's11-gene', min: 1, max: G, step: 1, valeur: 1,
    etikette: 'Gène parcouru (1 à 473)' });
  const valeurs = ajouterValeurs(scene);

  function appliquer() {
    const i = Math.min(G, Math.max(1, Math.round(parseFloat(c.input.value) || 1)));
    const a = ((i - 1) / G) * Math.PI * 2;
    const arr = mgeo.attributes.position.array;
    arr[0] = Math.cos(a) * 3; arr[1] = Math.sin(a * 3) * 0.12; arr[2] = Math.sin(a) * 3;
    mgeo.attributes.position.needsUpdate = true;
    valeurs.span.textContent =
      `gène ${i} / ${G} — JCVI-syn3.0 : ${G} gènes, le plus petit génome autonome jamais construit en laboratoire (Hutchison et al., 2016)`;
  }

  c.input.addEventListener('input', appliquer);
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      const pas = d.axe === 'y' ? 10 : 1;
      let i = Math.round(parseFloat(c.input.value) || 1) + d.delta * pas;
      i = ((i - 1 + G) % G) + 1;
      c.input.value = i;
      appliquer();
    },
    surReset: () => { c.input.value = 1; appliquer(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    points.rotation.y = temps * 0.00008;
    marque.rotation.y = temps * 0.00008;
    ves.rotation.y = -temps * 0.00004;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); L.arreter(); M.detruire(); };
}
