/* Salle 03 — L'angle d'or et les spirales : placer N graines à angle constant
   et observer le motif. À 137,507° (360/φ²), aucune branche radiale ne se
   forme : c'est l'angle d'or, observé en phyllotaxie (salle 12). */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

const OR = 360 / Math.pow((1 + Math.sqrt(5)) / 2, 2);   // 137,50776…°

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 12);

  const N = 1500;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const mat = new THREE.PointsMaterial({ size: 3.6, sizeAttenuation: false, vertexColors: true, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  const scene3 = new THREE.Scene();
  scene3.add(pts);

  const c = ajouterCurseur(scene, { id: 's03-angle', min: 130, max: 145, step: 0.001,
    valeur: OR.toFixed(3), etikette: 'Angle entre deux graines successives (degrés)' });
  const valeurs = ajouterValeurs(scene);

  function motif(angle) {
    if (Math.abs(angle - OR) < 0.06) return 'spirales régulières : angle d’or';
    for (let q = 2; q <= 13; q++) {
      for (let p = 1; p < q; p++) {
        if (Math.abs(angle - 360 * p / q) < 0.12) return `${q} branches radiales (angle rationnel)`;
      }
    }
    return 'motif irrégulier, espace mal rempli';
  }

  function appliquer() {
    const angle = parseFloat(c.input.value);
    const rad = angle * Math.PI / 180;
    const pos = geo.getAttribute('position'), col = geo.getAttribute('color');
    for (let i = 0; i < N; i++) {
      const r = 0.16 * Math.sqrt(i);
      const th = i * rad;
      pos.array[i * 3] = r * Math.cos(th);
      pos.array[i * 3 + 1] = r * Math.sin(th);
      pos.array[i * 3 + 2] = 0;
      const t = i / N;
      col.array[i * 3] = 0.90 - 0.25 * t;
      col.array[i * 3 + 1] = 0.77 - 0.35 * t;
      col.array[i * 3 + 2] = 0.42 - 0.25 * t;
    }
    pos.needsUpdate = true; col.needsUpdate = true;
    valeurs.span.textContent = `angle = ${angle.toFixed(3)}° · angle d’or = ${OR.toFixed(3)}° · ${motif(angle)}`;
  }

  c.input.addEventListener('input', () => { appliquer(); L.rafraichir(); });
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      c.input.value = (parseFloat(c.input.value) + d.delta * 0.01).toFixed(3);
      appliquer(); L.rafraichir();
    },
    surReset: () => { c.input.value = OR.toFixed(3); appliquer(); L.rafraichir(); },
  });

  appliquer();
  const L = boucle(renderer, () => renderer.render(scene3, camera), mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); L.arreter(); M.detruire(); };
}
