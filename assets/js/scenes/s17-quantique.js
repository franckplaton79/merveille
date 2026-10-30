/* Salle 17 — E = mc² : ce que pèse un kilogramme de matière.
   Valeur dérivée validée : c² = 8,9875517873681764×10^16 J/kg (c exacte) ;
   relation d'Einstein 1905 (S-049, ouvert). Mode 2 : paire de radicaux du
   cryptochrome 4, hypothèse dominante de la boussole magnétique (Xu 2021,
   mesure in vitro ; in vivo DÉBATTU — badge ambre explicite). */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 0.8, 9);
  camera.lookAt(0, 0, 0);

  const scene3 = new THREE.Scene();
  const C2 = 8.9875517873681764e16;

  /* mode 1 : cube de masse + faisceau d'énergie */
  const g1 = new THREE.Group();
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x9aa4ad }));
  cube.position.x = -2;
  const faisceau = new THREE.Mesh(new THREE.ConeGeometry(0.5, 6, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xe6c46a }));
  faisceau.position.set(1.6, 0.6, 0);
  faisceau.rotation.z = -Math.PI / 2.2;
  g1.add(cube, faisceau);
  scene3.add(g1);

  /* mode 2 : paire de radicaux + champ */
  const g2 = new THREE.Group();
  g2.visible = false;
  const matR = new THREE.MeshBasicMaterial({ color: 0x7fd4c1 });
  const r1 = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), matR);
  const r2 = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), matR);
  r1.position.x = -0.7; r2.position.x = 0.7;
  const lien = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6),
    new THREE.MeshBasicMaterial({ color: 0x44607a }));
  lien.rotation.z = Math.PI / 2;
  const champ = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 5, 6),
      new THREE.MeshBasicMaterial({ color: 0x2a5573 }));
    l.rotation.z = Math.PI / 2;
    l.position.y = -1.6 + i * 0.8;
    champ.add(l);
  }
  g2.add(r1, r2, lien, champ);
  scene3.add(g2);

  const b = scene.closest('.interaction').querySelector('.interaction__barre');
  const btnMode = document.createElement('button');
  btnMode.type = 'button'; btnMode.className = 'bouton';
  btnMode.setAttribute('aria-pressed', 'false');
  btnMode.textContent = 'Boussole quantique (hypothèse)';
  b.prepend(btnMode);

  const c = ajouterCurseur(scene, { id: 's17-masse', min: -3, max: 3, step: 0.01, valeur: 0,
    etikette: 'Masse convertie (échelle logarithme, kg)' });
  const valeurs = ajouterValeurs(scene);

  let mode = 1;
  function sci(x) {
    if (x <= 0) return '0';
    const e = Math.floor(Math.log10(x));
    const m = x / Math.pow(10, e);
    return `${m.toFixed(2)}×10^${e}`;
  }
  function appliquer() {
    const m = Math.pow(10, parseFloat(c.input.value) || 0);
    if (mode === 1) {
      const s = Math.cbrt(Math.min(8, Math.max(0.05, m)));
      cube.scale.setScalar(s);
      faisceau.scale.set(0.4 + Math.log10(1 + m) * 0.25, 1, 0.4 + Math.log10(1 + m) * 0.25);
      valeurs.span.textContent =
        `m = ${m >= 1 ? m.toFixed(1) : m.toPrecision(2)} kg → E = mc² ≈ ${sci(m * C2)} J (Einstein, 1905 ; c exacte)`;
    } else {
      valeurs.span.textContent =
        'DÉBATTU : cryptochrome 4 sensible au champ magnétique via une paire de radicaux (Xu et al., 2021, mesure in vitro ; boussole in vivo = hypothèse dominante)';
    }
  }

  btnMode.addEventListener('click', () => {
    mode = mode === 1 ? 2 : 1;
    g1.visible = mode === 1; g2.visible = mode === 2;
    btnMode.setAttribute('aria-pressed', String(mode === 2));
    btnMode.textContent = mode === 2 ? 'Retour à E = mc²' : 'Boussole quantique (hypothèse)';
    appliquer();
  });
  c.input.addEventListener('input', appliquer);
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      if (d.axe === 'y') { btnMode.click(); return; }
      c.input.value = Math.min(3, Math.max(-3, parseFloat(c.input.value) + d.delta * 0.08)).toFixed(2);
      appliquer();
    },
    surReset: () => { c.input.value = 0; mode = 1; g1.visible = true; g2.visible = false;
      btnMode.setAttribute('aria-pressed', 'false');
      btnMode.textContent = 'Boussole quantique (hypothèse)'; appliquer(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    g2.rotation.y = temps * 0.0003;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); btnMode.remove(); L.arreter(); M.detruire(); };
}
