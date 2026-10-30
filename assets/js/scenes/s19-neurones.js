/* Salle 19 — Un millimètre cube de cortex : 150 millions de synapses.
   Trois échelles sourcées : cerveau entier ≈86 milliards de neurones, ~20 W
   (Azevedo et al. 2009) ; 1 mm³ de cortex ≈57 000 cellules et 150 millions de
   synapses (Shapson-Coe et al. 2024) ; connectome complet de la drosophile =
   139 255 neurones, ~50 millions de synapses (Dorkenwald et al. 2024, FlyWire).
   Ratios d'affichage exacts : 1 point = 10 cellules (mm³) ou 10 neurones (mouche). */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 200);
  camera.position.set(0, 1.5, 10);
  camera.lookAt(0, 0, 0);

  const scene3 = new THREE.Scene();

  function nuage(n, forme, couleur, taille) {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      if (forme === 'cerveau') {
        pos[i * 3] = (Math.random() - 0.5) * 7;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 4.2;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
      } else if (forme === 'cube') {
        pos[i * 3] = (Math.random() - 0.5) * 3;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      } else {
        const r = 2.6 * Math.cbrt(Math.random());
        const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.cos(ph) * 0.8;
        pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({
      color: couleur, size: taille, sizeAttenuation: false, depthWrite: false }));
  }

  const niveaux = [
    nuage(20000, 'cerveau', 0x7fb2e5, 2.2),
    nuage(5700, 'cube', 0x7fd4c1, 2.6),
    nuage(13925, 'mouche', 0xd98dd4, 2.4),
  ];
  const cube = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3),
    new THREE.MeshBasicMaterial({ color: 0x2a5573, wireframe: true }));
  niveaux[1].add(cube);
  niveaux.forEach((n) => scene3.add(n));
  niveaux[1].visible = false;
  niveaux[2].visible = false;

  const c = ajouterCurseur(scene, { id: 's19-echelle', min: 0, max: 2, step: 1, valeur: 1,
    etikette: 'Échelle : 0 cerveau entier · 1 millimètre cube · 2 drosophile' });
  const valeurs = ajouterValeurs(scene);

  const TEXTES = [
    'cerveau humain : ≈86 milliards de neurones pour une vingtaine de watts (Azevedo et al., 2009) — nuage illustratif',
    '1 mm³ de cortex : ≈57 000 cellules et 150 millions de synapses (Shapson-Coe et al., 2024) — 1 point = 10 cellules',
    'drosophile entière (FlyWire) : 139 255 neurones, ~50 millions de synapses (Dorkenwald et al., 2024) — 1 point = 10 neurones',
  ];
  function appliquer() {
    const k = Math.min(2, Math.max(0, Math.round(parseFloat(c.input.value) || 0)));
    niveaux.forEach((n, i) => { n.visible = i === k; });
    valeurs.span.textContent = TEXTES[k];
  }

  c.input.addEventListener('input', appliquer);
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      c.input.value = Math.min(2, Math.max(0, Math.round(parseFloat(c.input.value) || 0) + Math.sign(d.delta)));
      appliquer();
    },
    surReset: () => { c.input.value = 1; appliquer(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    niveaux.forEach((n) => { n.rotation.y = temps * 0.00006; });
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); L.arreter(); M.detruire(); };
}
