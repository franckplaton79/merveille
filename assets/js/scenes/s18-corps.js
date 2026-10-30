/* Salle 18 — Compteurs du corps : le cœur en temps réel, et la lumière guidée
   par les cellules de Müller. Faits sourcés : ~100 000 battements/jour (Guyton
   & Hall, traité de physiologie) ; cellules de Müller guidant la lumière comme
   des fibres optiques (Franze et al. 2007), avec nuance : en fovéa de primate
   elles dessinent un « Z » et ce rôle optique y est débattu (IOVS 2019). */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 0.4, 9);
  camera.lookAt(0, 0, 0);

  const scene3 = new THREE.Scene();

  /* mode 1 : cœur pulsant */
  const g1 = new THREE.Group();
  const coeur = new THREE.Mesh(new THREE.SphereGeometry(1.3, 24, 18),
    new THREE.MeshBasicMaterial({ color: 0xc04545 }));
  const art = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.4, 10),
    new THREE.MeshBasicMaterial({ color: 0x9d3636 }));
  art.position.y = 1.5;
  g1.add(coeur, art);
  scene3.add(g1);

  /* mode 2 : fibre de Müller + rayon guidé */
  const g2 = new THREE.Group();
  g2.visible = false;
  const matF = new THREE.MeshBasicMaterial({ color: 0x3d5a73 });
  const segs = [];
  function seg(y, h, incl) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, h, 14, 1, true), matF);
    s.position.y = y; s.rotation.z = incl;
    g2.add(s); segs.push(s); return s;
  }
  seg(1.6, 1.6, 0); seg(0, 1.6, 0); seg(-1.6, 1.6, 0);
  const rayon = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 5.4, 8),
    new THREE.MeshBasicMaterial({ color: 0xe6c46a }));
  g2.add(rayon);
  scene3.add(g2);

  const b = scene.closest('.interaction').querySelector('.interaction__barre');
  const btnMode = document.createElement('button');
  btnMode.type = 'button'; btnMode.className = 'bouton';
  btnMode.setAttribute('aria-pressed', 'false');
  btnMode.textContent = 'Lumière guidée (Müller)';
  b.prepend(btnMode);
  const btnZ = document.createElement('button');
  btnZ.type = 'button'; btnZ.className = 'bouton';
  btnZ.setAttribute('aria-pressed', 'false');
  btnZ.textContent = 'Fovéa en « Z » (débattu)';
  btnZ.style.display = 'none';
  b.prepend(btnZ);

  const c = ajouterCurseur(scene, { id: 's18-temps', min: 0, max: 600, step: 1, valeur: 60,
    etikette: 'Durée écoulée (secondes)' });
  const valeurs = ajouterValeurs(scene);

  let mode = 1, enZ = false;
  function appliquer() {
    const t = Math.max(0, parseFloat(c.input.value) || 0);
    if (mode === 1) {
      const bat = t * 100000 / 86400;
      valeurs.span.textContent =
        `≈ ${Math.round(bat).toLocaleString('fr-FR')} battements en ${Math.round(t)} s — rythme ~100 000 battements/jour (Guyton & Hall)`;
    } else {
      segs[0].rotation.z = enZ ? 0.35 : 0;
      segs[1].rotation.z = enZ ? -0.35 : 0;
      segs[2].rotation.z = enZ ? 0.35 : 0;
      rayon.rotation.z = 0;
      valeurs.span.textContent = enZ
        ? 'DÉBATTU : en fovéa de primate, les cellules de Müller dessinent un « Z » ; le rôle de guide d’onde y est discuté (IOVS 2019)'
        : 'lumière guidée le long des cellules de Müller, comme dans une fibre optique vivante (Franze et al., 2007)';
    }
  }

  btnMode.addEventListener('click', () => {
    mode = mode === 1 ? 2 : 1;
    g1.visible = mode === 1; g2.visible = mode === 2;
    btnMode.setAttribute('aria-pressed', String(mode === 2));
    btnMode.textContent = mode === 2 ? 'Retour au cœur' : 'Lumière guidée (Müller)';
    btnZ.style.display = mode === 2 ? '' : 'none';
    appliquer();
  });
  btnZ.addEventListener('click', () => {
    enZ = !enZ;
    btnZ.setAttribute('aria-pressed', String(enZ));
    appliquer();
  });
  c.input.addEventListener('input', appliquer);
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      if (d.axe === 'y') { if (mode === 2) btnZ.click(); else btnMode.click(); return; }
      c.input.value = Math.min(600, Math.max(0, parseFloat(c.input.value) + d.delta * 5)).toFixed(0);
      appliquer();
    },
    surReset: () => { c.input.value = 60; mode = 1; enZ = false;
      g1.visible = true; g2.visible = false;
      btnMode.setAttribute('aria-pressed', 'false');
      btnMode.textContent = 'Lumière guidée (Müller)';
      btnZ.setAttribute('aria-pressed', 'false'); btnZ.style.display = 'none';
      appliquer(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    const puls = 1 + 0.07 * Math.abs(Math.sin(temps * 0.006));
    coeur.scale.setScalar(puls);
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); btnMode.remove(); btnZ.remove(); L.arreter(); M.detruire(); };
}
