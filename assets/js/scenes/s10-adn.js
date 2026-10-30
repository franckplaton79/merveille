/* Salle 10 — Dérouler les deux mètres d'ADN d'une cellule.
   Faits sourcés : ~3,1 milliards de paires de bases et ~2 m d'ADN repliés
   dans un noyau de quelques micromètres ; densité théorique ~215 Po/g.
   Quatre niveaux de repliement interpolés : fil déroulé, collier de
   nucléosomes, fibre enroulée, pelote du noyau. */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 200);
  camera.position.set(0, 0.8, 11);
  camera.lookAt(0, 0, 0);

  const scene3 = new THREE.Scene();
  const N = 1400;
  const pos = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const ligne = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x7fb2e5 }));
  scene3.add(ligne);

  /* histones du collier : sphères régulières le long du fil (niveau 1) */
  const histones = new THREE.Group();
  const matH = new THREE.MeshBasicMaterial({ color: 0xb9c6de });
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), matH);
    histones.add(s);
    s.userData.k = i / 13;
  }
  scene3.add(histones);

  const cfg = [
    (u) => [ (u - 0.5) * 16, 0, 0 ],                                   // fil déroulé
    (u) => [ (u - 0.5) * 12, Math.sin(u * Math.PI * 26) * 0.55, Math.cos(u * Math.PI * 26) * 0.55 ], // collier
    (u) => {                                                           // fibre enroulée
      const a = u * Math.PI * 9;
      return [ Math.cos(a) * (2.6 + Math.sin(u * Math.PI * 40) * 0.5),
               (u - 0.5) * 5 + Math.sin(u * Math.PI * 40) * 0.4,
               Math.sin(a) * (2.6 + Math.sin(u * Math.PI * 40) * 0.5) ];
    },
    (u) => {                                                           // pelote du noyau
      const a = u * Math.PI * 26, r = 2.5 * Math.sqrt(1 - Math.pow(2 * u - 1, 2) * 0.55);
      return [ Math.cos(a) * r, Math.sin(a * 0.63) * 2.3, Math.sin(a) * r ];
    },
  ];

  const b = scene.closest('.interaction').querySelector('.interaction__barre');
  const c = ajouterCurseur(scene, { id: 's10-zoom', min: 0, max: 3, step: 0.01, valeur: 0,
    etikette: 'Niveau de repliement (du fil déroulé au noyau)' });
  const valeurs = ajouterValeurs(scene);

  const NIVEAUX = [
    'fil déroulé : ~2 m d’ADN par cellule pour ~3,1 milliards de paires de bases',
    'collier de nucléosomes : le fil s’enroule autour de protéines histones',
    'fibre repliée : le collier s’enroule lui-même, ordre de grandeur du noyau',
    'pelote du noyau : ~2 m de fil dans quelques micromètres — densité théorique ~215 pétaoctets par gramme',
  ];

  function appliquer() {
    const t = Math.min(3, Math.max(0, parseFloat(c.input.value) || 0));
    const i0 = Math.min(2, Math.floor(t));
    const f = t - i0;
    const A = cfg[i0], B = cfg[i0 + 1];
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const pa = A(u), pb = B(u);
      pos[i * 3] = pa[0] + (pb[0] - pa[0]) * f;
      pos[i * 3 + 1] = pa[1] + (pb[1] - pa[1]) * f;
      pos[i * 3 + 2] = pa[2] + (pb[2] - pa[2]) * f;
    }
    geo.attributes.position.needsUpdate = true;
    histones.visible = t < 1.6;
    const op = Math.max(0, 1 - Math.abs(t - 1) * 1.4);
    histones.children.forEach((s) => {
      const u = s.userData.k;
      const pa = cfg[0](u), pb = cfg[1](u);
      s.position.set(pa[0] + (pb[0] - pa[0]) * Math.min(1, t),
                     pa[1] + (pb[1] - pa[1]) * Math.min(1, t),
                     pa[2] + (pb[2] - pa[2]) * Math.min(1, t));
      s.scale.setScalar(0.4 + op);
    });
    valeurs.span.textContent = `niveau ${Math.round(t)} / 3 — ${NIVEAUX[Math.round(t)]}`;
  }

  c.input.addEventListener('input', appliquer);
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      c.input.value = Math.min(3, Math.max(0, parseFloat(c.input.value) + d.delta * 0.06)).toFixed(2);
      appliquer();
    },
    surReset: () => { c.input.value = 0; appliquer(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    ligne.rotation.y = temps * 0.00012;
    histones.rotation.y = temps * 0.00012;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); L.arreter(); M.detruire(); };
}
