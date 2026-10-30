/* Salle 05 — Avec ou sans Lune : l'axe de la Terre bascule-t-il ?
   D'après Laskar, Joutel & Robutel 1993 (Nature 361:615) : AVEC la Lune,
   l'obliquité reste dans ±1,3° autour de ~23,3° ; SANS la Lune, elle erre
   de façon chaotique entre ~0° et ~85°. Courbes illustratives d'après ces
   régimes, pas une intégration numérique complète. */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 1.2, 10);
  camera.lookAt(0, 0, 0);

  const scene3 = new THREE.Scene();
  const terre = new THREE.Mesh(new THREE.SphereGeometry(1.5, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x2e6fd4 }));
  const axe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.2, 8),
    new THREE.MeshBasicMaterial({ color: 0xe6c46a }));
  const lune = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xb9bcc4 }));
  scene3.add(terre, axe, lune);

  const b = scene.closest('.interaction').querySelector('.interaction__barre');
  const btnLune = document.createElement('button');
  btnLune.type = 'button'; btnLune.className = 'bouton';
  btnLune.setAttribute('aria-pressed', 'true');
  btnLune.textContent = 'Avec la Lune';
  b.prepend(btnLune);

  const c = ajouterCurseur(scene, { id: 's05-temps', min: 0, max: 100, step: 0.5, valeur: 0,
    etikette: 'Temps simulé (millions d’années)' });
  const valeurs = ajouterValeurs(scene);

  let avecLune = true;
  function obliquite(t) {
    if (avecLune) return 23.3 + 1.3 * Math.sin(t * 0.35);
    // régime chaotique illustré : somme de périodes incommensurables, 0-85°
    const u = Math.sin(t * 0.21) + Math.sin(t * 0.53 + 1.7) + Math.sin(t * 1.31 + 4.2);
    return 42.5 + 42.5 * (u / 3);
  }

  function appliquer() {
    const t = parseFloat(c.input.value);
    const ob = obliquite(t);
    axe.rotation.z = -ob * Math.PI / 180;
    terre.rotation.z = -ob * Math.PI / 180;
    lune.visible = avecLune;
    if (avecLune) {
      const a = t * 2.2;
      lune.position.set(Math.cos(a) * 4.4, 0.2, Math.sin(a) * 4.4);
    }
    valeurs.span.textContent =
      `obliquité = ${ob.toFixed(1)}° · ${avecLune
        ? 'avec la Lune : plage stable ±1,3° autour de 23,3°'
        : 'sans la Lune : errance chaotique 0-85° (Laskar 1993)'}`;
  }

  btnLune.addEventListener('click', () => {
    avecLune = !avecLune;
    btnLune.textContent = avecLune ? 'Avec la Lune' : 'Sans la Lune';
    btnLune.setAttribute('aria-pressed', avecLune ? 'true' : 'false');
    appliquer(); L.rafraichir();
  });
  c.input.addEventListener('input', () => { appliquer(); L.rafraichir(); });
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      if (d.axe === 'y') { btnLune.click(); return; }
      c.input.value = (parseFloat(c.input.value) + d.delta * 0.5).toFixed(1);
      appliquer(); L.rafraichir();
    },
    surReset: () => { c.input.value = 0; avecLune = true;
      btnLune.textContent = 'Avec la Lune'; btnLune.setAttribute('aria-pressed', 'true');
      appliquer(); L.rafraichir(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    terre.rotation.y = temps * 0.0002;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); btnLune.remove(); L.arreter(); M.detruire(); };
}
