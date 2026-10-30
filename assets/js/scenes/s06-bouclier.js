/* Salle 06 — Vent solaire contre bouclier magnétique.
   Le champ magnétique terrestre dévie le vent solaire ; Mars, sans champ
   global, a perdu son atmosphère sous ce vent (MAVEN, Science 2017).
   Visualisation pédagogique : la taille de la magnétopause suit le champ. */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 200);
  camera.position.set(0, 2.5, 14);
  camera.lookAt(0, 0, 0);

  const scene3 = new THREE.Scene();
  const terre = new THREE.Mesh(new THREE.SphereGeometry(1.1, 40, 28),
    new THREE.MeshBasicMaterial({ color: 0x2e6fd4 }));
  scene3.add(terre);
  const bulle = new THREE.Mesh(new THREE.SphereGeometry(3, 40, 24),
    new THREE.MeshBasicMaterial({ color: 0x39d0c8, wireframe: true }));
  bulle.scale.set(1, 0.85, 0.85);
  scene3.add(bulle);

  const N = 2600;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const vit = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = -16 + Math.random() * 30;
    pos[i * 3 + 1] = (Math.random() * 2 - 1) * 6;
    pos[i * 3 + 2] = (Math.random() * 2 - 1) * 3;
    vit[i] = 0.03 + Math.random() * 0.05;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const vent = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 2.2, sizeAttenuation: false, color: 0xffa64d, depthWrite: false }));
  scene3.add(vent);

  const c = ajouterCurseur(scene, { id: 's06-champ', min: 0, max: 2, step: 0.05, valeur: 1,
    etikette: 'Champ magnétique (force relative, Terre = 1)' });
  const valeurs = ajouterValeurs(scene);

  let B = 1;
  function appliquer() {
    B = parseFloat(c.input.value);
    const R = B <= 0.02 ? 0 : 1.6 + 2.4 * B;
    bulle.visible = R > 0;
    bulle.scale.set(R / 3, 0.85 * R / 3, 0.85 * R / 3);
    bulle.material.color.setHex(B < 0.4 ? 0xd97b4f : 0x39d0c8);
    valeurs.span.textContent = B <= 0.02
      ? 'champ nul : le vent solaire frappe l’atmosphère — cas de Mars, décapée (MAVEN 2017)'
      : `champ ×${B.toFixed(2)} · magnétopause ≈ ${(R / 1.1).toFixed(1)} rayons terrestres du côté du Soleil`;
  }

  c.input.addEventListener('input', () => { appliquer(); L.rafraichir(); });
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      c.input.value = (parseFloat(c.input.value) + d.delta * 0.05).toFixed(2);
      appliquer(); L.rafraichir();
    },
    surReset: () => { c.input.value = 1; appliquer(); L.rafraichir(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    const R = B <= 0.02 ? 0 : 1.6 + 2.4 * B;
    const p = geo.getAttribute('position');
    for (let i = 0; i < N; i++) {
      let x = p.array[i * 3] + vit[i] * 2.2;
      let y = p.array[i * 3 + 1];
      if (R > 0) {
        const d2 = x * x + y * y;
        if (d2 < R * R + 0.6 && x < 0.6) {
          y += (y >= 0 ? 1 : -1) * 0.16 * (1 - d2 / (R * R + 0.6));
        }
      }
      if (x > 15) { x = -16; y = (Math.random() * 2 - 1) * 6; }
      p.array[i * 3] = x; p.array[i * 3 + 1] = y;
    }
    p.needsUpdate = true;
    terre.rotation.y = temps * 0.00015;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); L.arreter(); M.detruire(); };
}
