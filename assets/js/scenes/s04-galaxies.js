/* Salle 04 — Plongée en puissances de dix : du ciel profond (10^26 m) à la
   Terre (10^7 m). Chaque palier change d'objet : amas de galaxies, galaxie,
   système stellaire, planète. Échelles ordinales, distances issues des
   catalogues (voir sources de la salle). */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage, nuage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 400);
  camera.position.set(0, 1.5, 16);

  const scene3 = new THREE.Scene();

  // palier 1 : ciel profond (galaxies lointaines)
  const profond = new THREE.Points(nuage(THREE, 1800, 30),
    new THREE.PointsMaterial({ size: 2.8, sizeAttenuation: false, color: 0xbfd4ff, transparent: true,
    depthWrite: false }));
  // palier 2 : une galaxie spirale vue de trois quarts
  const gN = 2600, gPos = new Float32Array(gN * 3);
  for (let i = 0; i < gN; i++) {
    const bras = i % 2, t = Math.random() * 3.4;
    const r = 0.6 + t * 2.6 + (Math.random() - 0.5) * 0.5;
    const th = t * 1.9 + bras * Math.PI + (Math.random() - 0.5) * 0.35;
    gPos.set([r * Math.cos(th), (Math.random() - 0.5) * 0.25, r * Math.sin(th)], i * 3);
  }
  const gGeo = new THREE.BufferGeometry();
  gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
  const galaxie = new THREE.Points(gGeo,
    new THREE.PointsMaterial({ size: 2.6, sizeAttenuation: false, color: 0xffe3ae, transparent: true,
    depthWrite: false }));
  const bulbe = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xffd98f, transparent: true }));
  galaxie.add(bulbe);
  // palier 3 : système stellaire
  const systeme = new THREE.Group();
  const etoile = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true }));
  systeme.add(etoile);
  const planetes = [1.4, 2.1, 3.0, 4.1].map((r, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.12 + i * 0.03, 16, 12),
      new THREE.MeshBasicMaterial({ color: [0x9fb8ff, 0xe6c46a, 0x7fd4ff, 0xd97b4f][i], transparent: true }));
    m.userData.r = r; m.userData.v = 0.4 / Math.sqrt(r);
    systeme.add(m); return m;
  });
  // palier 4 : planète bleue
  const terre = new THREE.Mesh(new THREE.SphereGeometry(1.6, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x2e6fd4, transparent: true }));

  scene3.add(profond, galaxie, systeme, terre);

  const c = ajouterCurseur(scene, { id: 's04-echelle', min: 7, max: 26, step: 0.1, valeur: 26,
    etikette: 'Échelle observée (exposant de 10, en mètres)' });
  const valeurs = ajouterValeurs(scene);

  const fondu = (e, centre, largeur) =>
    Math.max(0, 1 - Math.abs(e - centre) / largeur);

  function appliquer() {
    const e = parseFloat(c.input.value);
    profond.material.opacity = fondu(e, 25, 3);
    galaxie.material.opacity = fondu(e, 21, 3.2);
    bulbe.material.opacity = fondu(e, 21, 3.2);
    const s = fondu(e, 12.5, 3.4);
    systeme.children.forEach(o => { if (o.material) o.material.opacity = s; });
    terre.material.opacity = fondu(e, 7.6, 2.2);
    profond.visible = profond.material.opacity > 0.01;
    galaxie.visible = galaxie.material.opacity > 0.01;
    systeme.visible = s > 0.01;
    terre.visible = terre.material.opacity > 0.01;
    const nom = e >= 24 ? 'univers observable' : e >= 21 ? 'amas de galaxies'
      : e >= 17 ? 'une galaxie et ses étoiles' : e >= 11 ? 'un système stellaire'
      : 'une planète, la Terre';
    valeurs.span.textContent = `échelle : 10^${e.toFixed(1)} m · ${nom}`;
  }

  c.input.addEventListener('input', () => { appliquer(); L.rafraichir(); });
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      c.input.value = (parseFloat(c.input.value) + d.delta * 0.2).toFixed(1);
      appliquer(); L.rafraichir();
    },
    surReset: () => { c.input.value = 26; appliquer(); L.rafraichir(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    const t = temps * 0.001;
    galaxie.rotation.y = t * 0.05;
    planetes.forEach(p => {
      const a = t * p.userData.v;
      p.position.set(Math.cos(a) * p.userData.r, 0, Math.sin(a) * p.userData.r);
    });
    terre.rotation.y = t * 0.1;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); L.arreter(); M.detruire(); };
}
