/* Salle 16 — Engrenages d'Issus : nymphe et adulte.
   Fait sourcé (résumé ouvert sur science.org) : les nymphes de la cicadelle
   Issus portent des dents cuticulaires qui s'engrènent sur les trochanters
   et synchronisent les pattes au saut ; mécanisme rejeté à la mue finale
   (Burrows & Sutton, 2013, Science 341:1254, S-032). */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 9.5);
  camera.lookAt(0, 0, 0);

  const scene3 = new THREE.Scene();

  function roue(dents, rayon, mat) {
    const g = new THREE.Group();
    const corps = new THREE.Mesh(new THREE.CylinderGeometry(rayon, rayon, 0.5, 24), mat);
    corps.rotation.x = Math.PI / 2;
    g.add(corps);
    for (let i = 0; i < dents; i++) {
      const a = (i / dents) * Math.PI * 2;
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 0.5), mat);
      d.position.set(Math.cos(a) * (rayon + 0.15), Math.sin(a) * (rayon + 0.15), 0);
      d.rotation.z = a;
      g.add(d);
    }
    return g;
  }
  const matG = new THREE.MeshBasicMaterial({ color: 0xc98a4b });
  const r1 = roue(10, 1.25, matG);
  const r2 = roue(10, 1.25, matG);
  r1.position.x = -1.32; r2.position.x = 1.32;
  scene3.add(r1, r2);

  /* pattes suggérées : deux tiges sous les roues */
  const matP = new THREE.MeshBasicMaterial({ color: 0x8a6a44 });
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 3.2, 8), matP);
  const p2 = p1.clone();
  p1.position.set(-1.5, -2.4, 0); p2.position.set(1.5, -2.4, 0);
  p1.rotation.z = 0.25; p2.rotation.z = -0.25;
  scene3.add(p1, p2);

  const b = scene.closest('.interaction').querySelector('.interaction__barre');
  const btnAge = document.createElement('button');
  btnAge.type = 'button'; btnAge.className = 'bouton';
  btnAge.setAttribute('aria-pressed', 'false');
  btnAge.textContent = 'Stade : nymphe';
  b.prepend(btnAge);

  const c = ajouterCurseur(scene, { id: 's16-phase', min: 0, max: 100, step: 0.5, valeur: 0,
    etikette: 'Phase du saut (armement puis propulsion)' });
  const valeurs = ajouterValeurs(scene);

  let adulte = false;
  function appliquer() {
    const f = Math.min(100, Math.max(0, parseFloat(c.input.value) || 0)) / 100;
    const engrene = !adulte;
    r1.visible = r2.visible = engrene;
    const rot = f * Math.PI * 0.9;
    if (engrene) {
      /* engrènement : rotations opposées, dents imbriquées */
      r1.rotation.z = -rot;
      r2.rotation.z = -rot + Math.PI / 10;
      const ecart = f > 0.85 ? (f - 0.85) * 6 : 0;   // séparation en fin de propulsion
      r1.position.x = -1.32 - ecart; r2.position.x = 1.32 + ecart;
      p1.rotation.z = 0.25 + f * 0.5; p2.rotation.z = -0.25 - f * 0.5;
      valeurs.span.textContent =
        f > 0.85
          ? 'fin de propulsion : chez l’adulte, ces engrenages seront rejetés à la mue finale (Burrows & Sutton, 2013)'
          : `nymphe : engrenages engrénés, rotation ${Math.round(rot * 180 / Math.PI)}° — les deux pattes tournent à la même vitesse angulaire (Burrows & Sutton, 2013)`;
    } else {
      p1.rotation.z = 0.25 + f * 0.5; p2.rotation.z = -0.25 - f * 0.5;
      valeurs.span.textContent =
        'adulte : engrenages absents — la synchronisation passe par un appui friction entre les pattes (Burrows & Sutton, 2013)';
    }
  }

  btnAge.addEventListener('click', () => {
    adulte = !adulte;
    btnAge.textContent = adulte ? 'Stade : adulte' : 'Stade : nymphe';
    btnAge.setAttribute('aria-pressed', String(adulte));
    appliquer();
  });
  c.input.addEventListener('input', appliquer);
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      if (d.axe === 'y') { btnAge.click(); return; }
      c.input.value = Math.min(100, Math.max(0, parseFloat(c.input.value) + d.delta * 2)).toFixed(1);
      appliquer();
    },
    surReset: () => { c.input.value = 0; adulte = false;
      btnAge.textContent = 'Stade : nymphe'; btnAge.setAttribute('aria-pressed', 'false');
      appliquer(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); btnAge.remove(); L.arreter(); M.detruire(); };
}
