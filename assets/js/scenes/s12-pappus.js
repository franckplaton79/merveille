/* Salle 12 — Le pappus du pissenlit et son anneau tourbillonnaire séparé
   (Cummins et al. 2018, Nature) : un anneau de vortex flotte AU-DESSUS du
   pappus, detached, et augmente la traînée → chute lente. Vue de profil
   privilégiée ; l'anneau se montre/se masque. */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 0.6, 10);
  camera.lookAt(0, 0.4, 0);

  const scene3 = new THREE.Scene();
  const graine = new THREE.Group();
  scene3.add(graine);

  /* akène (graine) : cône allongé */
  const matG = new THREE.MeshBasicMaterial({ color: 0x8a6a44 });
  const akene = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.5, 10), matG);
  akene.position.y = -1.5;
  akene.rotation.x = Math.PI;
  graine.add(akene);
  const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 6),
    new THREE.MeshBasicMaterial({ color: 0xc9b189 }));
  tige.position.y = -0.1;
  graine.add(tige);

  /* pappus : parapluie de ~100 filaments fins, vus plutôt de profil */
  const matF = new THREE.LineBasicMaterial({ color: 0xdfe6ee });
  const NF = 100;
  for (let i = 0; i < NF; i++) {
    const a = (i / NF) * Math.PI * 2;
    const g = new THREE.BufferGeometry();
    const hx = Math.cos(a), hz = Math.sin(a);
    const ouv = 0.62;                       // demi-angle d'ouverture du parapluie
    const ggeo = new Float32Array([
      0, 0.6, 0,
      hx * ouv * 1.9, 0.6 + 1.9 * Math.cos(0.62) * 0.75, hz * ouv * 1.9,
    ]);
    g.setAttribute('position', new THREE.BufferAttribute(ggeo, 3));
    graine.add(new THREE.Line(g, matF));
  }

  /* anneau tourbillonnaire séparé : tore au-dessus du pappus */
  const vortex = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.16, 10, 40),
    new THREE.MeshBasicMaterial({ color: 0x6fb8d4, wireframe: true }));
  vortex.rotation.x = Math.PI / 2;
  vortex.position.y = 2.6;
  scene3.add(vortex);

  const b = scene.closest('.interaction').querySelector('.interaction__barre');
  const btnV = document.createElement('button');
  btnV.type = 'button'; btnV.className = 'bouton';
  btnV.setAttribute('aria-pressed', 'true');
  btnV.textContent = 'Anneau tourbillonnaire : visible';
  b.prepend(btnV);

  const c = ajouterCurseur(scene, { id: 's12-pointdevue', min: -60, max: 60, step: 1, valeur: 18,
    etikette: 'Point de vue (degrés, profil = 0)' });
  const valeurs = ajouterValeurs(scene);

  let montre = true;
  function appliquer() {
    const deg = parseFloat(c.input.value) || 0;
    scene3.rotation.y = deg * Math.PI / 180;
    vortex.visible = montre;
    valeurs.span.textContent = montre
      ? 'anneau de vortex séparé, flottant au-dessus du pappus (Cummins et al., 2018) : traînée accrue, chute lente'
      : 'pappus seul : sans l’anneau séparé, la traînée mesurée s’effondre — comparaison illustrative';
  }
  btnV.addEventListener('click', () => {
    montre = !montre;
    btnV.textContent = montre ? 'Anneau tourbillonnaire : visible' : 'Anneau tourbillonnaire : masqué';
    btnV.setAttribute('aria-pressed', String(montre));
    appliquer();
  });
  c.input.addEventListener('input', appliquer);
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      if (d.axe === 'y') { btnV.click(); return; }
      c.input.value = Math.min(60, Math.max(-60, parseFloat(c.input.value) + d.delta * 1.5)).toFixed(0);
      appliquer();
    },
    surReset: () => { c.input.value = 18; montre = true;
      btnV.textContent = 'Anneau tourbillonnaire : visible';
      btnV.setAttribute('aria-pressed', 'true'); appliquer(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    graine.position.y = Math.sin(temps * 0.0004) * 0.25 - 0.4;   // dérive lente
    graine.rotation.z = Math.sin(temps * 0.0003) * 0.06;
    vortex.position.y = 2.35 + Math.sin(temps * 0.0005 + 1) * 0.12;
    vortex.rotation.z = temps * 0.0004;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); btnV.remove(); L.arreter(); M.detruire(); };
}
