/* Salle 14 — 13 560 km sans escale : la route de la barge rousse.
   Faits sourcés : 13 560 km en 11 j 1 h, suivie par satellite (S-040, 2022) ;
   sterne arctique ~70 000 km/an (Egevang et al., 2010, PNAS, S-030).
   Le compteur de km est une proportion affichée de la distance totale sourcée. */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 1.6, 9);
  camera.lookAt(0, 0, 0);

  const scene3 = new THREE.Scene();
  const globe = new THREE.Group();
  scene3.add(globe);
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(3, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0x2a5573, wireframe: true })));

  function v(lat, lon, r = 3) {
    const la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
    return new THREE.Vector3(
      r * Math.cos(la) * Math.cos(lo),
      r * Math.sin(la),
      r * Math.cos(la) * Math.sin(lo));
  }
  function arc(a, b, mat) {
    const A = v(a[0], a[1]), B = v(b[0], b[1]);
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const p = A.clone().lerp(B, i / 64).normalize().multiplyScalar(3.06);
      pts.push(p);
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const l = new THREE.Line(g, mat);
    globe.add(l);
    return l;
  }
  function marque(lat, lon, couleur) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8),
      new THREE.MeshBasicMaterial({ color: couleur }));
    m.position.copy(v(lat, lon, 3.1));
    globe.add(m);
    return m;
  }

  const ROUTES = {
    barge: { a: [61, -166], b: [-41, 147], km: 13560, mat: new THREE.LineBasicMaterial({ color: 0xe6c46a }) },
    sterne: { a: [65, -18], b: [-65, 0], km: 70000, mat: new THREE.LineBasicMaterial({ color: 0x7fd4c1 }) },
  };
  const arcBarge = arc(ROUTES.barge.a, ROUTES.barge.b, ROUTES.barge.mat);
  const arcSterne = arc(ROUTES.sterne.a, ROUTES.sterne.b, ROUTES.sterne.mat);
  arcSterne.visible = false;
  marque(61, -166, 0xe6c46a); marque(-41, 147, 0xe6c46a);
  const mS1 = marque(65, -18, 0x7fd4c1), mS2 = marque(-65, 0, 0x7fd4c1);
  mS1.visible = mS2.visible = false;

  const avion = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff }));
  globe.add(avion);

  const b = scene.closest('.interaction').querySelector('.interaction__barre');
  const btnRoute = document.createElement('button');
  btnRoute.type = 'button'; btnRoute.className = 'bouton';
  btnRoute.setAttribute('aria-pressed', 'false');
  btnRoute.textContent = 'Route de la sterne arctique';
  b.prepend(btnRoute);

  const c = ajouterCurseur(scene, { id: 's14-avancement', min: 0, max: 100, step: 0.5, valeur: 0,
    etikette: 'Avancement du voyage (%)' });
  const valeurs = ajouterValeurs(scene);

  let sterne = false;
  function appliquer() {
    const f = Math.min(100, Math.max(0, parseFloat(c.input.value) || 0)) / 100;
    const R = sterne ? ROUTES.sterne : ROUTES.barge;
    const A = v(R.a[0], R.a[1]), B = v(R.b[0], R.b[1]);
    avion.position.copy(A.lerp(B, f).normalize().multiplyScalar(3.14));
    avion.visible = !sterne ? true : true;
    arcBarge.visible = !sterne; arcSterne.visible = sterne;
    mS1.visible = mS2.visible = sterne;
    const km = Math.round(R.km * f);
    if (!sterne) {
      const jours = f * 11.04;
      valeurs.span.textContent =
        `barge rousse : ≈ ${km.toLocaleString('fr-FR')} km sur 13 560 — jour ${jours.toFixed(1)} sur 11,0 (11 j 1 h de vol sans escale, suivi satellite 2022)`;
    } else {
      valeurs.span.textContent =
        `sterne arctique : ≈ ${km.toLocaleString('fr-FR')} km sur ~70 000 — une année de migration (Egevang et al., 2010)`;
    }
  }

  btnRoute.addEventListener('click', () => {
    sterne = !sterne;
    btnRoute.textContent = sterne ? 'Route de la barge rousse' : 'Route de la sterne arctique';
    btnRoute.setAttribute('aria-pressed', String(sterne));
    appliquer();
  });
  c.input.addEventListener('input', appliquer);
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      if (d.axe === 'y') { btnRoute.click(); return; }
      c.input.value = Math.min(100, Math.max(0, parseFloat(c.input.value) + d.delta * 2)).toFixed(1);
      appliquer();
    },
    surReset: () => { c.input.value = 0; sterne = false;
      btnRoute.textContent = 'Route de la sterne arctique';
      btnRoute.setAttribute('aria-pressed', 'false'); appliquer(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    globe.rotation.y = temps * 0.00006;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); btnRoute.remove(); L.arreter(); M.detruire(); };
}
