/* Salle 02 — Trois cadrans : déplacer une constante, voir l'univers changer.
   Modèle d'exploration ASSUMÉ comme tel (pas une simulation) : les seuils
   repris sont ceux discutés dans la littérature (fenêtres de quelques pour
   cent pour la résonance du carbone, sensibilité de la chimie à α, Λ). */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage, nuage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 300);
  camera.position.set(0, 0, 14);

  const N = 4200;
  const geo = nuage(THREE, N, 7);
  const mat = new THREE.PointsMaterial({ size: 3.2, sizeAttenuation: false, color: 0xfff2cf, transparent: true,
    opacity: 1, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  const scene3 = new THREE.Scene();
  scene3.add(pts);

  const etat = { alpha: 0, carbone: 0, lambda: 0 };
  const cA = ajouterCurseur(scene, { id: 's02-alpha', min: -6, max: 6, step: 0.1, valeur: 0,
    etikette: 'Constante de structure fine α (écart en %)' });
  const cC = ajouterCurseur(scene, { id: 's02-carbone', min: -4, max: 4, step: 0.05, valeur: 0,
    etikette: 'Résonance du carbone (écart en %)' });
  const cL = ajouterCurseur(scene, { id: 's02-lambda', min: -2, max: 4, step: 0.1, valeur: 0,
    etikette: 'Constante cosmologique Λ (×10^écart)' });
  const valeurs = ajouterValeurs(scene);

  function appliquer() {
    etat.alpha = parseFloat(cA.input.value);
    etat.carbone = parseFloat(cC.input.value);
    etat.lambda = parseFloat(cL.input.value);

    const chimie = Math.abs(etat.alpha) > 2 ? 0.08 : 1;
    const carbone = Math.abs(etat.carbone) > 0.5 ? 0.04 : 1;
    const structures = etat.lambda > 1 ? 0.15 : (etat.lambda < -1 ? 0.3 : 1);
    const richesse = chimie * carbone * structures;

    mat.opacity = 0.15 + 0.85 * richesse;
    mat.color.setRGB(1, 0.85 - 0.45 * (1 - richesse), 0.6 - 0.45 * (1 - richesse));
    pts.scale.setScalar(0.8 + 0.4 * richesse);

    const lignes = [
      `chimie fine : ${chimie < 1 ? 'effondrée' : 'possible'}`,
      `carbone : ${carbone < 1 ? 'production insuffisante' : 'produit en quantité'}`,
      `structures : ${structures < 1 ? 'étouffées' : 'se forment'}`,
    ];
    valeurs.span.textContent =
      `modèle d’exploration · ${lignes.join(' · ')} · ` +
      (richesse > 0.9 ? 'univers semblable au nôtre' : 'univers stérile');
  }

  [cA, cC, cL].forEach(c => c.input.addEventListener('input', () => { appliquer(); L.rafraichir(); }));
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      const c = [cA, cC, cL][d.axe === 'x' ? 1 : 2];
      c.input.value = parseFloat(c.input.value) + d.delta * parseFloat(c.input.step);
      appliquer(); L.rafraichir();
    },
    surReset: () => { [cA, cC, cL].forEach(c => c.input.value = 0); appliquer(); L.rafraichir(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    pts.rotation.y = temps * 0.00005;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); [cA, cC, cL, valeurs].forEach(x => x.retirer()); L.arreter(); M.detruire(); };
}
