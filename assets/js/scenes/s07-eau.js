/* Salle 07 — La courbe de densité de l'eau, de 0 à 10 °C.
   Maximum à 3,98 °C (Kell 1975) : c'est cette anomalie qui fait geler les
   lacs par le haut et protège le fond vivant. Courbe en forme de parabole
   locale, valeurs relatives autour du maximum. */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 11);

  const scene3 = new THREE.Scene();
  const N = 220;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = (i / (N - 1)) * 10;
    pos[i * 3] = (t - 5) * 0.9;
    pos[i * 3 + 1] = -Math.pow(t - 3.98, 2) * 0.16 + 2.4;
    pos[i * 3 + 2] = 0;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const courbe = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 3.2, sizeAttenuation: false, color: 0x7fd4ff, depthWrite: false }));
  scene3.add(courbe);

  const marqueur = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xe6c46a }));
  scene3.add(marqueur);
  const sommet = new THREE.Mesh(new THREE.SphereGeometry(0.10, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x4fbf87 }));
  sommet.position.set((3.98 - 5) * 0.9, 2.4, 0);
  scene3.add(sommet);

  const c = ajouterCurseur(scene, { id: 's07-temp', min: 0, max: 10, step: 0.02, valeur: 3.98,
    etikette: 'Température de l’eau (°C)' });
  const valeurs = ajouterValeurs(scene);

  function appliquer() {
    const t = parseFloat(c.input.value);
    marqueur.position.set((t - 5) * 0.9, -Math.pow(t - 3.98, 2) * 0.16 + 2.4, 0);
    const ecart = Math.abs(t - 3.98);
    valeurs.span.textContent =
      `T = ${t.toFixed(2)} °C · écart au maximum : ${ecart.toFixed(2)} °C · ` +
      (ecart < 0.05 ? 'densité maximale : 3,98 °C (Kell 1975)'
        : `l'eau plus proche de 3,98 °C est plus dense et descend`);
  }

  c.input.addEventListener('input', () => { appliquer(); L.rafraichir(); });
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      c.input.value = (parseFloat(c.input.value) + d.delta * 0.05).toFixed(2);
      appliquer(); L.rafraichir();
    },
    surReset: () => { c.input.value = 3.98; appliquer(); L.rafraichir(); },
  });

  appliquer();
  const L = boucle(renderer, () => renderer.render(scene3, camera), mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); L.arreter(); M.detruire(); };
}
