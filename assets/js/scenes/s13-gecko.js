/* Salle 13 — Une sétule : la force de van der Waals, doigt par doigt.
   Fait sourcé : adhérence sèche sans colle, force d'adhésion d'un seul poil
   mesurée (Autumn et al., 2000, Nature 405:681, S-029). Les forces de van der
   Waals sont de très courte portée : le lien ne s'active qu'au contact. */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 0.4, 9);
  camera.lookAt(0, 0, 0);

  const scene3 = new THREE.Scene();

  /* paroi : plan vertical translucide à droite */
  const paroi = new THREE.Mesh(new THREE.PlaneGeometry(7, 7),
    new THREE.MeshBasicMaterial({ color: 0x274b63, side: THREE.DoubleSide }));
  paroi.position.x = 2.6;
  paroi.rotation.y = Math.PI / 2;
  scene3.add(paroi);

  /* sétule : hampe inclinée + bouquet de spatules */
  const setule = new THREE.Group();
  const hampe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 3.4, 10),
    new THREE.MeshBasicMaterial({ color: 0xb9855a }));
  hampe.rotation.z = -Math.PI / 2.35;
  hampe.position.set(-1.1, -0.5, 0);
  setule.add(hampe);
  const spatules = [];
  const liens = [];
  const matSpat = new THREE.MeshBasicMaterial({ color: 0x8d99a6 });
  const matSpatOn = new THREE.MeshBasicMaterial({ color: 0xe6c46a });
  const matLien = new THREE.LineBasicMaterial({ color: 0xe6c46a });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), matSpat);
    s.position.set(0.6 + Math.cos(a) * 0.5, 0.55 + Math.sin(a) * 0.5, 0);
    setule.add(s);
    spatules.push(s);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const l = new THREE.Line(g, matLien);
    l.visible = false;
    setule.add(l);
    liens.push(l);
  }
  scene3.add(setule);

  const c = ajouterCurseur(scene, { id: 's13-distance', min: 0, max: 20, step: 0.1, valeur: 6,
    etikette: 'Distance spatules–paroi (nanomètres)' });
  const valeurs = ajouterValeurs(scene);

  function appliquer() {
    const d = Math.max(0, parseFloat(c.input.value) || 0);
    setule.position.x = -d * 0.11;                 // approche visuelle
    const contact = d <= 1;                        // portée : contact quasi nul
    let n = 0;
    spatules.forEach((s, i) => {
      s.material = contact ? matSpatOn : matSpat;
      liens[i].visible = contact;
      if (contact) {
        n++;
        const arr = liens[i].geometry.attributes.position.array;
        arr[0] = s.position.x + 0.12; arr[1] = s.position.y; arr[2] = 0;
        arr[3] = 2.6 - setule.position.x - 0.02; arr[4] = s.position.y; arr[5] = 0;
        liens[i].geometry.attributes.position.needsUpdate = true;
      }
    });
    valeurs.span.textContent = contact
      ? `contact établi : ${n} spatules liées — adhérence sèche par forces de van der Waals, sans colle (Autumn et al., 2000)`
      : `distance ${d.toFixed(1)} nm : pas de lien — les forces de van der Waals n'agissent qu'à contact quasi nul`;
  }

  c.input.addEventListener('input', appliquer);
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      c.input.value = Math.min(20, Math.max(0, parseFloat(c.input.value) - d.delta * 0.4)).toFixed(1);
      appliquer();
    },
    surReset: () => { c.input.value = 6; appliquer(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    setule.rotation.z = Math.sin(temps * 0.0004) * 0.02;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); L.arreter(); M.detruire(); };
}
