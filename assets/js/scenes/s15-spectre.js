/* Salle 15 — Douze canaux de 300 à 720 nm : le spectre de la squille.
   Faits sourcés : 12 types de photorécepteurs, bandes étroites 300-720 nm, dont
   4 UV mesurés à 315, 330, 340, 380 nm (Marshall & Oberwinkler 1999 ; Thoen et
   al. 2014) ; reconnaissance des couleurs par balayage, non par discrimination
   (Thoen et al. 2014) ; polarisation circulaire (Chiou et al. 2008).
   Les 8 canaux non UV sont positionnés de façon SCHÉMATIQUE (positions exactes
   non reprises ici) ; le curseur λ est une valeur choisie par le visiteur. */
import { creerMoteur, boucle, ajouterCurseur, ajouterValeurs, brancherPilotage } from './_commun.js';

export function monter({ scene, THREE, mouvementReduit }) {
  const M = creerMoteur(scene, THREE);
  const { renderer } = M;
  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
  camera.position.set(0, 0.6, 8.5);
  camera.lookAt(0, 0, 0);

  const scene3 = new THREE.Scene();
  const L0 = 300, L1 = 720;
  const xOf = (l) => ((l - L0) / (L1 - L0) - 0.5) * 8;

  function lamRGB(l) {
    /* approximation classique du rendu perceptuel, 380-720 nm ; UV = violet désaturé */
    if (l < 380) return [0.42, 0.34, 0.55];
    let r = 0, g = 0, b = 0;
    if (l < 440) { r = (440 - l) / 60; b = 1; }
    else if (l < 490) { g = (l - 440) / 50; b = 1; }
    else if (l < 510) { g = 1; b = (510 - l) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; }
    else if (l < 645) { r = 1; g = (645 - l) / 65; }
    else { r = 1; }
    return [r * 0.9 + 0.06, g * 0.9 + 0.06, b * 0.9 + 0.06];
  }

  /* bande spectrale */
  const geo = new THREE.PlaneGeometry(8, 1.1, 140, 1);
  const posA = geo.attributes.position;
  const cols = new Float32Array(posA.count * 3);
  for (let i = 0; i < posA.count; i++) {
    const l = L0 + ((posA.getX(i) + 4) / 8) * (L1 - L0);
    const [r, g, b] = lamRGB(l);
    cols[i * 3] = r; cols[i * 3 + 1] = g; cols[i * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  scene3.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true })));

  /* zone UV : voile sombre quand on compare avec notre vision */
  const voile = new THREE.Mesh(new THREE.PlaneGeometry(xOf(380) - xOf(300), 1.1),
    new THREE.MeshBasicMaterial({ color: 0x06080f, transparent: true, opacity: 0.82 }));
  voile.position.set((xOf(300) + xOf(380)) / 2, 0, 0.02);
  voile.visible = false;
  scene3.add(voile);

  /* 12 canaux : 4 UV mesurés + 8 schématiques */
  const PICS = [315, 330, 340, 380, 420, 450, 480, 510, 545, 580, 630, 700];
  const MESURES = 4;
  const canaux = PICS.map((l, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.7),
      new THREE.MeshBasicMaterial({ color: i < MESURES ? 0xb98dd4 : 0x9fb4c8 }));
    m.position.set(xOf(l), 0.95, 0.01);
    scene3.add(m);
    return m;
  });

  /* curseur λ */
  const curseur3 = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 2.3),
    new THREE.MeshBasicMaterial({ color: 0xe6c46a }));
  curseur3.position.z = 0.03;
  scene3.add(curseur3);

  /* anneau de polarisation circulaire (motif hélicoïdal suggéré par un tore) */
  const pol = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.07, 10, 40),
    new THREE.MeshBasicMaterial({ color: 0x7fd4c1, wireframe: true }));
  pol.position.set(0, -1.5, 0.4);
  pol.visible = false;
  scene3.add(pol);

  const b = scene.closest('.interaction').querySelector('.interaction__barre');
  const btnHum = document.createElement('button');
  btnHum.type = 'button'; btnHum.className = 'bouton';
  btnHum.setAttribute('aria-pressed', 'false');
  btnHum.textContent = 'Comparer avec notre vision';
  b.prepend(btnHum);
  const btnPol = document.createElement('button');
  btnPol.type = 'button'; btnPol.className = 'bouton';
  btnPol.setAttribute('aria-pressed', 'false');
  btnPol.textContent = 'Polarisation circulaire';
  b.prepend(btnPol);

  const c = ajouterCurseur(scene, { id: 's15-lambda', min: 300, max: 720, step: 1, valeur: 550,
    etikette: 'Longueur d’onde pointée (nm)' });
  const valeurs = ajouterValeurs(scene);

  let hum = false, polOn = false;
  function appliquer() {
    const l = Math.min(720, Math.max(300, parseFloat(c.input.value) || 300));
    curseur3.position.x = xOf(l);
    let k = 0, d = 1e9;
    PICS.forEach((p, i) => { const dd = Math.abs(p - l); if (dd < d) { d = dd; k = i; } });
    canaux.forEach((m, i) => m.material.color.setHex(i === k ? 0xe6c46a : (i < MESURES ? 0xb98dd4 : 0x9fb4c8)));
    voile.visible = hum;
    pol.visible = polOn;
    const uv = l < 380;
    valeurs.span.textContent =
      `λ = ${Math.round(l)} nm — canal ${k + 1}/12 le plus proche` +
      (uv ? ' · ultraviolet : visible pour la squille, invisible pour nous (Marshall & Oberwinkler, 1999)' : '') +
      (polOn ? ' · polarisation circulaire détectée (Chiou et al., 2008)' : '') +
      ' · 4 pics UV mesurés : 315, 330, 340, 380 nm ; reconnaissance par balayage (Thoen et al., 2014)';
  }

  btnHum.addEventListener('click', () => {
    hum = !hum;
    btnHum.setAttribute('aria-pressed', String(hum));
    btnHum.textContent = hum ? 'Retirer la comparaison' : 'Comparer avec notre vision';
    appliquer();
  });
  btnPol.addEventListener('click', () => {
    polOn = !polOn;
    btnPol.setAttribute('aria-pressed', String(polOn));
    appliquer();
  });
  c.input.addEventListener('input', appliquer);
  const pilote = brancherPilotage(scene, {
    surDelta: (d) => {
      if (d.axe === 'y') { btnHum.click(); return; }
      c.input.value = Math.min(720, Math.max(300, parseFloat(c.input.value) + d.delta * 4)).toFixed(0);
      appliquer();
    },
    surReset: () => { c.input.value = 550; hum = false; polOn = false;
      btnHum.setAttribute('aria-pressed', 'false');
      btnHum.textContent = 'Comparer avec notre vision';
      btnPol.setAttribute('aria-pressed', 'false'); appliquer(); },
  });

  appliquer();
  const L = boucle(renderer, (temps = 0) => {
    if (!Number.isFinite(temps)) temps = 0;
    pol.rotation.z = temps * 0.0006;
    renderer.render(scene3, camera);
  }, mouvementReduit);

  return () => { pilote.retirer(); c.retirer(); valeurs.retirer(); btnHum.remove(); btnPol.remove(); L.arreter(); M.detruire(); };
}
