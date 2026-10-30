/* Salle 20 — Langage, art, tombe : ce qui ne s'observe que chez l'humain.
   Niveau RÉFLEXION (lapis) : F-S20-001, sans chiffre ajouté. Trois registres
   parcourus au clavier : sens moral, goût du beau, besoin spirituel. */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 0.6, 9.5);
  camera.lookAt(0, 0.4, 0);

  const scene3 = new THREE.Scene();
  const REG = [
    ['sens moral', 'des règles d’équité et de devoir reconnues dans toutes les sociétés humaines'],
    ['goût du beau', 'ocre, art pariétal, parure, musique : du superflu apparent, partout présent'],
    ['besoin spirituel', 'tombes soignées, offrandes, questions d’origine : jamais nulle part absents'],
  ];
  const colonnes = REG.map((_, i) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.55, 4.4, 18, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x33506b }));
    m.position.set(-2.6 + i * 2.6, 0.2, 0);
    scene3.add(m);
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10),
      new THREE.MeshBasicMaterial({ color: 0x33506b }));
    s.position.set(-2.6 + i * 2.6, 2.7, 0);
    scene3.add(s);
    return [m, s];
  });
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(9, 3),
    new THREE.MeshBasicMaterial({ color: 0x101c28 }));
  sol.rotation.x = -Math.PI / 2;
  sol.position.y = -2;
  scene3.add(sol);

  const c = ajouterCurseur(scene, { id: 's20-registre', min: 0, max: 2, step: 1, valeur: 0,
    etikette: 'Registre : 0 sens moral · 1 goût du beau · 2 besoin spirituel' });
  const valeurs = ajouterValeurs(scene);

  function appliquer() {
    const k = Math.min(2, Math.max(0, Math.round(parseFloat(c.input.value) || 0)));
    colonnes.forEach((cs, i) => {
      const col = i === k ? 0xe6c46a : 0x33506b;
      cs[0].material.color.setHex(col);
      cs[1].material.color.setHex(col);
    });
    valeurs.span.textContent =
      `RÉFLEXION — ${REG[k][0]} : ${REG[k][1]} · partout et toujours, ces traits dépassent la simple survie (niveau réflexion, non mesurable)`;
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
    colonnes.forEach((cs, i) => { cs[1].position.y = 2.7 + Math.sin(temps * 0.0008 + i) * 0.08; });
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); L.arreter(); M.detruire(); };
}
