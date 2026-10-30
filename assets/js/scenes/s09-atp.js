/* Salle 09 — moteurs moléculaires : rotor de l'ATP synthase (rotation observée
   au microscope, Noji et al. 1997) et kinésine (pas de 8 nm, un ATP hydrolysé
   par pas, Schnitzer & Block 1997). Schéma explicatif : aucune cadence non
   sourcée n'est affichée, le compteur de pas est exact (8 nm/pas). */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 1.4, 9);
  camera.lookAt(0, 0.2, 0);

  const scene3 = new THREE.Scene();
  const matRose = new THREE.MeshBasicMaterial({ color: 0xd98d4a });
  const matVert = new THREE.MeshBasicMaterial({ color: 0x5fb8a5 });
  const matMem = new THREE.MeshBasicMaterial({ color: 0x2c3e50 });

  /* --- mode rotor : anneau c (10 blocs, schéma), tige, tête à 3 lobes x2 --- */
  const rotor = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.34), matRose);
    const a = (i / 10) * Math.PI * 2;
    b.position.set(Math.cos(a) * 0.9, -0.9, Math.sin(a) * 0.9);
    b.rotation.y = -a;
    rotor.add(b);
  }
  const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.6, 10), matRose);
  tige.position.y = 0.1;
  rotor.add(tige);
  const tete = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), i % 2 ? matVert : matRose);
    const a = (i / 6) * Math.PI * 2;
    l.position.set(Math.cos(a) * 0.62, 1.35, Math.sin(a) * 0.62);
    tete.add(l);
  }
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), matMem);
    const a = (i / 26) * Math.PI * 2;
    s.position.set(Math.cos(a) * 2.6, -0.9, Math.sin(a) * 2.6);
    scene3.add(s);
  }
  scene3.add(rotor, tete);

  /* --- mode kinésine : rail de microtubule + marcheur à deux têtes --- */
  const kines = new THREE.Group();
  kines.visible = false;
  const matTub = new THREE.MeshBasicMaterial({ color: 0x3d5a73 });
  for (let i = 0; i < 24; i++) {
    const t = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), matTub);
    t.position.set(-5.5 + i * 0.48, -0.6, 0);
    kines.add(t);
  }
  const matTete = new THREE.MeshBasicMaterial({ color: 0xd9b45b });
  const teteA = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), matTete);
  const teteB = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), matTete);
  const queue = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8), matTete);
  const carg = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), matVert);
  kines.add(teteA, teteB, queue, carg);
  scene3.add(kines);

  const b = scene.closest('.interaction').querySelector('.interaction__barre');
  const btnMode = document.createElement('button');
  btnMode.type = 'button'; btnMode.className = 'bouton';
  btnMode.setAttribute('aria-pressed', 'false');
  btnMode.textContent = 'Voir la kinésine';
  b.prepend(btnMode);

  const c = ajouterCurseur(scene, { id: 's09-activite', min: 0, max: 3, step: 0.05, valeur: 1,
    etikette: 'Activité relative du moteur' });
  const valeurs = ajouterValeurs(scene);

  const etat = { mode: 'rotor', tours: 0, pas: 0, angle: 0, pos: 0 };

  function hud() {
    if (etat.mode === 'rotor') {
      valeurs.span.textContent =
        `rotor : ${etat.tours.toFixed(1)} tours accumulés — rotation observée directement au microscope (Noji et al., 1997), plusieurs tours par seconde selon les conditions ; schéma, cadence non à l'échelle`;
    } else {
      valeurs.span.textContent =
        `kinésine : ${etat.pas} pas × 8 nm = ${etat.pas * 8} nm — un pas de 8 nm par ATP hydrolysé (Schnitzer & Block, 1997) ; schéma, cadence non à l'échelle`;
    }
  }

  function basculer() {
    etat.mode = etat.mode === 'rotor' ? 'kine' : 'rotor';
    const k = etat.mode === 'kine';
    kines.visible = k; rotor.visible = !k; tete.visible = !k;
    btnMode.textContent = k ? 'Voir le rotor' : 'Voir la kinésine';
    btnMode.setAttribute('aria-pressed', String(k));
    hud();
  }
  btnMode.addEventListener('click', basculer);
  c.input.addEventListener('input', () => hud());

  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      if (d.axe === 'y') { basculer(); return; }
      c.input.value = Math.min(3, Math.max(0, parseFloat(c.input.value) + d.delta * 0.05)).toFixed(2);
      hud();
    },
    surReset: () => {
      c.input.value = 1; etat.tours = 0; etat.pas = 0; etat.angle = 0; etat.pos = 0;
      if (etat.mode !== 'rotor') basculer(); else hud();
    },
  });

  hud();
  let dernier = 0;
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    const dt = Math.min(50, Math.max(0, temps - dernier));
    dernier = temps;
    const v = parseFloat(c.input.value) || 0;
    if (etat.mode === 'rotor') {
      etat.angle += dt * 0.001 * v * 1.6;
      rotor.rotation.y = etat.angle;
      etat.tours += (dt * 0.001 * v * 1.6) / (Math.PI * 2);
    } else {
      etat.pos += dt * 0.001 * v * 2.2;
      const p = etat.pos % 22;
      etat.pas = Math.floor(etat.pos);
      const x = -5.5 + p * 0.48;
      const pair = Math.floor(etat.pos) % 2 === 0;
      teteA.position.set(x, -0.15, 0.12);
      teteB.position.set(x + (pair ? 0.24 : -0.24), -0.15, -0.12);
      queue.position.set(x + 0.12, 0.45, 0);
      carg.position.set(x + 0.12, 1.0, 0);
    }
    hud();
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); btnMode.remove(); L.arreter(); M.detruire(); };
}
