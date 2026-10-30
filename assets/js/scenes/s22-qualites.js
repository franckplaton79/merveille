/* Salle 22 — Les qualités du Créateur, salle de synthèse.
   Niveau RÉFLEXION (lapis) : selon la Bible (Romains 1:20, reformulé), quatre
   qualités se lisent dans l'œuvre ; chaque qualité pointe vers deux salles
   publiées et leurs faits ÉTABLIS. Anneaux concentriques (aucune disposition
   en croix) ; la qualité active allume son anneau. */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 2.4, 10);
  camera.lookAt(0, 0, 0);

  const scene3 = new THREE.Scene();
  const oeuvre = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0x2e6fd4, wireframe: true }));
  scene3.add(oeuvre);

  const Q = [
    ['puissance', 'salles 01 (fond diffus cosmologique, 1965) et 17 (E = mc², Einstein 1905) : une énergie et une origine hors d’échelle'],
    ['sagesse', 'salles 10 (~2 m d’ADN repliés par noyau) et 03 (angle d’or ≈137,5°) : des agencements qui tiennent dans la durée'],
    ['justice, fidélité', 'salles 02 (constantes mesurées, mêmes lois partout) et 06 (bouclier magnétique mesuré, comparaison MAVEN) : des lois qui ne fluctuent pas'],
    ['amour', 'salles 05 (obliquité stabilisée par la Lune, Laskar 1993) et 07 (densité maximale de l’eau à 3,98 °C) : des réglages qui préservent la vie'],
  ];
  const anneaux = Q.map((_, i) => {
    const a = new THREE.Mesh(new THREE.TorusGeometry(2 + i * 0.62, 0.05, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0x33506b }));
    a.rotation.x = Math.PI / 2.25;
    scene3.add(a);
    return a;
  });

  const c = ajouterCurseur(scene, { id: 's22-qualite', min: 0, max: 3, step: 1, valeur: 0,
    etikette: 'Qualité : 0 puissance · 1 sagesse · 2 justice · 3 amour' });
  const valeurs = ajouterValeurs(scene);

  function appliquer() {
    const k = Math.min(3, Math.max(0, Math.round(parseFloat(c.input.value) || 0)));
    anneaux.forEach((a, i) => a.material.color.setHex(i === k ? 0xe6c46a : 0x33506b));
    valeurs.span.textContent =
      `RÉFLEXION — ${Q[k][0]} : ${Q[k][1]} · lecture biblique de l’œuvre (Romains 1:20, reformulé), faits pointés ÉTABLIS`;
  }
  c.input.addEventListener('input', appliquer);
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      c.input.value = Math.min(3, Math.max(0, Math.round(parseFloat(c.input.value) || 0) + Math.sign(d.delta)));
      appliquer();
    },
    surReset: () => { c.input.value = 0; appliquer(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    oeuvre.rotation.y = temps * 0.00012;
    anneaux.forEach((a, i) => { a.rotation.z = temps * 0.00005 * (i % 2 ? -1 : 1); });
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); L.arreter(); M.detruire(); };
}
