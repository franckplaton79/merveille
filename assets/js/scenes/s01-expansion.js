/* Salle 01 — L'expansion de l'univers : les galaxies s'éloignent d'autant plus
   vite qu'elles sont loin (loi de Hubble-Lemaître, mesurée en 1929/1927).
   Modèle d'illustration : positions comobiles fixes, facteur d'échelle a piloté. */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage, nuage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 200);
  camera.position.set(0, 2.2, 9);
  camera.lookAt(0, 0, 0);

  const N = 3500;
  const comobile = nuage(THREE, N, 4.2);
  const base = comobile.getAttribute('position').array.slice();
  const mat = new THREE.PointsMaterial({ size: 3.2, sizeAttenuation: false, color: 0xffc98a,
    depthWrite: false });
  const pts = new THREE.Points(comobile, mat);
  const groupe = new THREE.Group();
  groupe.add(pts);
  const sol = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xe6c46a }));
  groupe.add(sol);
  const scene3 = new THREE.Scene();
  scene3.add(groupe);

  const H0 = 67.4;                       // km/s/Mpc (Planck 2018)
  let t = 1;                             // 0 = a petit, 1 = aujourd'hui
  const aDe = (v) => 1 / 16 * Math.pow(16, v);   // a : 1/16 → 1

  const curseur = ajouterCurseur(scene, {
    id: 's01-temps', min: 0, max: 1, step: 0.005, valeur: t,
    etikette: 'Temps écoulé (du jeune univers à aujourd’hui)',
  });
  const valeurs = ajouterValeurs(scene);

  function appliquer() {
    const a = aDe(t);
    const pos = comobile.getAttribute('position');
    for (let i = 0; i < N; i++) {
      pos.array[i * 3] = base[i * 3] * a;
      pos.array[i * 3 + 1] = base[i * 3 + 1] * a;
      pos.array[i * 3 + 2] = base[i * 3 + 2] * a;
    }
    pos.needsUpdate = true;
    const z = 1 / a - 1;
    const chaud = Math.min(1, z / 8);
    mat.color.setRGB(1, 0.79 - 0.35 * chaud, 0.54 - 0.35 * chaud);
    mat.size = 3.2 * (0.75 + 0.45 * a);
    valeurs.span.textContent =
      `facteur d’échelle a = ${a.toFixed(3)} · décalage vers le rouge z = ${z.toFixed(1)} · ` +
      `à 100 Mpc, une galaxie s’éloigne à ${(H0 * 100).toFixed(0)} km/s`;
  }

  curseur.input.addEventListener('input', () => { t = parseFloat(curseur.input.value); appliquer(); L.rafraichir(); });
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      t = Math.min(1, Math.max(0, t + d.delta * 0.02));
      curseur.input.value = t; appliquer(); L.rafraichir();
    },
    surReset: () => { t = 1; curseur.input.value = t; appliquer(); L.rafraichir(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    groupe.rotation.y = temps * 0.00004;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); curseur.retirer(); valeurs.retirer(); L.arreter(); M.detruire(); };
}
