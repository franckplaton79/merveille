/* Salle 21 — Hasard ou information : peser une séquence.
   Niveau RÉFLEXION (lapis) : trois signes convergents pointent chacun vers une
   salle publiée et son fait ÉTABLI : information spécifiée → ADN (salle 10,
   S-024) ; complexité intégrée → ATP synthase (salle 09, Noji 1997) ;
   optimisation → constantes fines (salle 02). Aucun chiffre inventé. */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 0.8, 9);
  camera.lookAt(0, 0, 0);

  const scene3 = new THREE.Scene();

  /* signe 1 : mini double hélice */
  const g1 = new THREE.Group();
  const p1 = [];
  for (let i = 0; i < 220; i++) {
    const t = i / 219, a = t * Math.PI * 6;
    p1.push(new THREE.Vector3(Math.cos(a) * 0.8, (t - 0.5) * 4.4, Math.sin(a) * 0.8));
    p1.push(new THREE.Vector3(Math.cos(a + Math.PI) * 0.8, (t - 0.5) * 4.4, Math.sin(a + Math.PI) * 0.8));
  }
  g1.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(p1),
    new THREE.PointsMaterial({ color: 0x7fb2e5, size: 3.2, sizeAttenuation: false, depthWrite: false })));
  scene3.add(g1);

  /* signe 2 : mini rotor */
  const g2 = new THREE.Group(); g2.visible = false;
  const matR = new THREE.MeshBasicMaterial({ color: 0xd98d4a });
  for (let i = 0; i < 10; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.3), matR);
    const a = (i / 10) * Math.PI * 2;
    b.position.set(Math.cos(a) * 0.95, -0.8, Math.sin(a) * 0.95);
    g2.add(b);
  }
  const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 1.6, 10), matR);
  tige.position.y = 0.2;
  g2.add(tige);
  for (let i = 0; i < 6; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0x5fb8a5 : 0xd98d4a }));
    const a = (i / 6) * Math.PI * 2;
    l.position.set(Math.cos(a) * 0.55, 1.3, Math.sin(a) * 0.55);
    g2.add(l);
  }
  scene3.add(g2);

  /* signe 3 : cadran de réglage fin */
  const g3 = new THREE.Group(); g3.visible = false;
  const cad = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.06, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0x7fd4c1 }));
  g3.add(cad);
  for (let i = 0; i < 24; i++) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.18, 0.03),
      new THREE.MeshBasicMaterial({ color: 0x44607a }));
    const a = (i / 24) * Math.PI * 2;
    t.position.set(Math.cos(a) * 1.7, Math.sin(a) * 1.7, 0);
    t.rotation.z = a;
    g3.add(t);
  }
  const zone = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.16, 8, 12, 0.12),
    new THREE.MeshBasicMaterial({ color: 0xe6c46a }));
  zone.rotation.z = Math.PI / 2 - 0.06;
  g3.add(zone);
  const aigu = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.6, 0.035),
    new THREE.MeshBasicMaterial({ color: 0xe6c46a }));
  aigu.position.y = 0.75;
  aigu.rotation.z = -0.06;
  g3.add(aigu);
  scene3.add(g3);

  const SIGNES = [
    ['information spécifiée', 'une séquence qui porte une fonction : 3,1 milliards de paires de bases, ~2 m par noyau (salle 10)'],
    ['complexité intégrée', 'un moteur rotatif dont la rotation se filme, pièces solidaires (salle 09, Noji et al. 1997)'],
    ['optimisation', 'des constantes physiques réglées si fin qu’une aiguille suffit à figurer la zone viable (salle 02)'],
  ];
  const c = ajouterCurseur(scene, { id: 's21-signe', min: 0, max: 2, step: 1, valeur: 0,
    etikette: 'Signe : 0 information · 1 complexité · 2 optimisation' });
  const valeurs = ajouterValeurs(scene);

  function appliquer() {
    const k = Math.min(2, Math.max(0, Math.round(parseFloat(c.input.value) || 0)));
    g1.visible = k === 0; g2.visible = k === 1; g3.visible = k === 2;
    valeurs.span.textContent =
      `RÉFLEXION — ${SIGNES[k][0]} : ${SIGNES[k][1]} · convergence de signes, non démonstration mathématique`;
  }
  c.input.addEventListener('input', appliquer);
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      c.input.value = Math.min(2, Math.max(0, Math.round(parseFloat(c.input.value) || 0) + Math.sign(d.delta)));
      appliquer();
    },
    surReset: () => { c.input.value = 0; appliquer(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    g1.rotation.y = temps * 0.0002;
    g2.rotation.y = temps * 0.0004;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); L.arreter(); M.detruire(); };
}
