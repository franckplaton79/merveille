/* ═══════════════════════════════════════════════════════════════════════════
   L'ŒUVRE — Musée de la Création · creatio.js (module principal)
   Socle d'interactions : accessibilité d'abord, moteur 3D ensuite.
   Ordre de repli imposé : WebGPU → WebGL2 → image fixe → texte.
   Aucune ressource externe ; les bibliothèques sont servies depuis
   /assets/vendor/ et chargées à la demande (R13).
   ═══════════════════════════════════════════════════════════════════════════ */

const script = document.currentScript || document.querySelector('script[data-base]');
const BASE = (script && script.dataset.base) || '';
const racine = document.documentElement;
/* Les imports dynamiques se résolvent relativement à l'URL du module
   (/assets/js/), pas à celle de la page : on repasse toujours par
   document.baseURI pour que BASE (« », « ../ », « ../../ ») s'applique
   depuis la page. */
const urlAsset = (p) => new URL(p, document.baseURI).href;

/* ── 1. Mouvement réduit : préférence système + choix persistant ───────── */
const CLE_MOUVEMENT = 'oeuvre-mouvement-reduit';
const prefere = window.matchMedia('(prefers-reduced-motion: reduce)');
const mouvementReduit = () =>
  localStorage.getItem(CLE_MOUVEMENT) === '1' ||
  (localStorage.getItem(CLE_MOUVEMENT) === null && prefere.matches);
const appliquerMouvement = () => { racine.dataset.mouvementReduit = mouvementReduit() ? '1' : '0'; };
appliquerMouvement();
prefere.addEventListener('change', appliquerMouvement);

/* ── 2. Détection du moteur de rendu ───────────────────────────────────── */
async function detecterMoteur() {
  if (mouvementReduit()) return { nom: 'image', raison: 'mouvement réduit demandé' };
  try {
    if (navigator.gpu) {
      const adapt = await navigator.gpu.requestAdapter();
      if (adapt) return { nom: 'webgpu', raison: 'WebGPU disponible' };
    }
  } catch (_) { /* on descend d'un cran */ }
  try {
    const c = document.createElement('canvas');
    if (c.getContext('webgl2')) return { nom: 'webgl2', raison: 'WebGL2 disponible' };
  } catch (_) { /* on descend d'un cran */ }
  return { nom: 'image', raison: 'aucun contexte 3D disponible' };
}

/* ── 3. Bibliothèque d'interaction : un seul moteur chargé par page ────── */
const moteur = { etat: 'inconnu', promesse: null, trois: null };
function cheminMoteur(nom) {
  return nom === 'webgpu' ? `${BASE}assets/vendor/three.webgpu.min.js`
                          : `${BASE}assets/vendor/three.module.min.js`;
}
async function chargerTrois(nom) {
  if (moteur.trois) return moteur.trois;
  moteur.trois = await import(/* webpackIgnore: true */ urlAsset(cheminMoteur(nom)));
  return moteur.trois;
}

/* ── 4. Scènes : <div class="interaction__scene" data-scene="…" data-repli="…"> */
async function monterScenes() {
  const scenes = [...document.querySelectorAll('[data-scene]')];
  if (!scenes.length) return;
  const det = await detecterMoteur();
  moteur.etat = det.nom;
  scenes.forEach(s => { s.dataset.moteur = det.nom; });
  document.querySelectorAll('[data-moteur-etat]').forEach(el => { el.textContent = det.nom; });

  if (det.nom === 'image') {
    scenes.forEach(afficherRepli);
    avertir(scenes, 'Rendu 3D indisponible sur cet appareil : la salle est présentée en images fixes. ' +
                    'Toutes les informations restent accessibles dans le texte.');
    return;
  }
  try {
    const THREE = await chargerTrois(det.nom);
    for (const s of scenes) await monterUneScene(s, THREE, det.nom);
  } catch (err) {
    console.warn('[L’ŒUVRE] moteur 3D indisponible :', err);
    scenes.forEach(afficherRepli);
    avertir(scenes, 'Le rendu 3D n’a pas pu démarrer. La salle est présentée en images fixes.');
  }
}

function afficherRepli(scene) {
  const repli = scene.querySelector('[data-repli]');
  if (repli) { repli.hidden = false; scene.dataset.repliActif = '1'; }
  const canvas = scene.querySelector('canvas');
  if (canvas) canvas.remove();
}

function avertir(scenes, message) {
  scenes.forEach(s => {
    if (s.querySelector('.avertissement-moteur')) return;
    const p = document.createElement('p');
    p.className = 'avertissement-moteur';
    p.setAttribute('role', 'status');
    p.textContent = message;
    (s.closest('.interaction') || s).append(p);
  });
}

/* Chargeur de scène : chaque salle fournit son propre module dans
   assets/js/scenes/<id>.js — absent ⇒ repli image honnête. */
async function monterUneScene(scene, THREE, nom) {
  const id = scene.dataset.scene;
  try {
    const module = await import(/* webpackIgnore: true */ urlAsset(`${BASE}assets/js/scenes/${id}.js`));
    if (typeof module.monter === 'function') {
      const arret = await module.monter({ scene, THREE, moteur: nom,
        mouvementReduit: mouvementReduit() });   // valeur booléenne, pas la fonction
      scene._arret = arret || (() => {});
      const repli = scene.querySelector('[data-repli]');
      if (repli) repli.hidden = true;      // le canvas prend la place, l'image reste en secours
    } else {
      afficherRepli(scene);
    }
  } catch (_) {
    afficherRepli(scene);   // scène pas encore écrite : image, pas d'écran noir
  }
}

/* ── 5. Clavier : chaque interaction est pilotable sans souris ─────────── */
function brancherClavier() {
  document.querySelectorAll('[data-interaction]').forEach(zone => {
    if (zone.dataset.clavier === '1') return;
    zone.dataset.clavier = '1';
    if (!zone.hasAttribute('tabindex')) zone.setAttribute('tabindex', '0');
    if (!zone.getAttribute('role')) zone.setAttribute('role', 'application');
    zone.addEventListener('keydown', ev => {
      const pas = ev.shiftKey ? 5 : 1;
      const map = { ArrowLeft: -pas, ArrowRight: pas, ArrowUp: pas, ArrowDown: -pas };
      if (!(ev.key in map)) return;
      ev.preventDefault();
      zone.dispatchEvent(new CustomEvent('oeuvre:piloter', {
        detail: { axe: (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') ? 'x' : 'y', delta: map[ev.key] },
        bubbles: true,
      }));
      annoncer(zone.dataset.aideClavier ||
        'Flèches pour explorer, Majuscule pour des pas plus grands, Entrée pour réinitialiser.');
    });
    zone.addEventListener('keyup', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        zone.dispatchEvent(new CustomEvent('oeuvre:reinitialiser', { bubbles: true }));
      }
    });
  });
}

/* Région vivante discrète pour les retours non visuels */
let vivant = null;
function annoncer(texte) {
  if (!texte) return;
  if (!vivant) {
    vivant = document.createElement('p');
    vivant.className = 'visuellement-cache';
    vivant.setAttribute('role', 'status');
    vivant.setAttribute('aria-live', 'polite');
    document.body.append(vivant);
  }
  vivant.textContent = texte;
}

/* ── 6. Sommaire (tiroir) : ouverture, focus piégé, Échap ──────────────── */
function brancherTiroir() {
  const tiroir = document.getElementById('tiroir');
  const ouvre = document.querySelector('[data-ouvre-tiroir]');
  const ferme = document.querySelector('[data-ferme-tiroir]');
  const voile = document.querySelector('[data-voile]');
  if (voile) voile.hidden = true;
  if (!tiroir || !ouvre) return;
  let precedent = null;

  const set = (ouvert, immediat = false) => {
    ouvre.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    if (voile) { voile.hidden = false; voile.dataset.ouvert = ouvert ? '1' : '0'; }
    document.body.style.overflow = ouvert ? 'hidden' : '';
    if (ouvert) {
      precedent = document.activeElement;
      tiroir.hidden = false;                      // sort de la mise en page fermée
      requestAnimationFrame(() => { tiroir.dataset.ouvert = '1'; });  // puis glisse
      setTimeout(() => {
        const premier = tiroir.querySelector('a,button');
        if (premier && tiroir.dataset.ouvert === '1') premier.focus();
      }, 60);
    } else {
      tiroir.dataset.ouvert = '0';                // glisse vers la gauche…
      const retirer = () => {                     // …puis disparaît de la mise en page
        if (tiroir.dataset.ouvert === '0') tiroir.hidden = true;
      };
      if (immediat) retirer(); else setTimeout(retirer, 360);
      if (precedent && document.contains(precedent)) precedent.focus();
    }
  };
  ouvre.addEventListener('click', () => set(tiroir.dataset.ouvert !== '1'));
  if (ferme) ferme.addEventListener('click', () => set(false));
  if (voile) voile.addEventListener('click', () => set(false, true));
  tiroir.addEventListener('click', ev => { if (ev.target.closest('a')) set(false); });
  document.addEventListener('keydown', ev => {
    if (tiroir.dataset.ouvert !== '1') return;
    if (ev.key === 'Escape') { ev.preventDefault(); set(false, true); return; }
    if (ev.key !== 'Tab') return;
    const cibles = [...tiroir.querySelectorAll('a[href],button')].filter(el => el.offsetParent !== null);
    if (!cibles.length) return;
    const premier = cibles[0], dernier = cibles[cibles.length - 1];
    if (ev.shiftKey && document.activeElement === premier) { ev.preventDefault(); dernier.focus(); }
    else if (!ev.shiftKey && document.activeElement === dernier) { ev.preventDefault(); premier.focus(); }
  });
  window.LOEUVRE = window.LOEUVRE || {};
  window.LOEUVRE.tiroir = { ouvrir: () => set(true), fermer: () => set(false) };
}

/* ── 7. Entête qui s'efface + rail de progression ──────────────────────── */
function brancherNavigation() {
  const entete = document.querySelector('[data-autohide]');
  const rail = document.querySelector('.rail__plein');
  let dernier = window.scrollY, cache = false;
  const surScroll = () => {
    const y = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (rail) rail.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
    if (entete) {
      const descend = y > dernier && y > 260;
      if (descend !== cache) { cache = descend; entete.dataset.cache = descend ? '1' : '0'; }
    }
    dernier = y;
  };
  window.addEventListener('scroll', surScroll, { passive: true });
  surScroll();
}

/* ── 8. Apparitions : IntersectionObserver, sans dépendance ────────────── */
function brancherRevelations() {
  const cibles = [...document.querySelectorAll('[data-reveal]')];
  if (!cibles.length) return;
  if (!('IntersectionObserver' in window) || mouvementReduit()) {
    cibles.forEach(el => { el.dataset.visible = '1'; });
    return;
  }
  const io = new IntersectionObserver((entrees) => {
    entrees.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.dataset.visible = '1';
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  cibles.forEach(el => io.observe(el));
}

/* ── 9. Améliorations progressives : Lenis + GSAP SplitText ────────────── */
async function ameliorations() {
  if (mouvementReduit()) return;
  try {
    const [{ default: Lenis }, gsapMod] = await Promise.all([
      import(/* webpackIgnore: true */ urlAsset(`${BASE}assets/vendor/lenis.min.js`)),
      import(/* webpackIgnore: true */ urlAsset(`${BASE}assets/vendor/gsap.min.js`)),
    ]);
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: .9 });
    const boucle = (t) => { lenis.raf(t); requestAnimationFrame(boucle); };
    requestAnimationFrame(boucle);
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', ev => {
        const cible = document.querySelector(a.getAttribute('href'));
        if (!cible) return;
        ev.preventDefault();
        lenis.scrollTo(cible, { offset: -70 });
        cible.setAttribute('tabindex', '-1');
        cible.focus({ preventScroll: true });
      });
    });
    window.LOEUVRE = window.LOEUVRE || {};
    window.LOEUVRE.lenis = lenis;
    if (gsapMod && gsapMod.gsap) window.LOEUVRE.gsap = gsapMod.gsap;
  } catch (err) {
    console.info('[L’ŒUVRE] défilement lissé indisponible, défilement natif conservé.');
  }
  /* Titre héro : lettres qui se posent, uniquement si SplitText est là */
  const titre = document.querySelector('.titre-hero');
  if (titre && !mouvementReduit()) {
    try {
      const st = await import(/* webpackIgnore: true */ urlAsset(`${BASE}assets/vendor/SplitText.min.js`));
      const gsap = (await import(/* webpackIgnore: true */ urlAsset(`${BASE}assets/vendor/gsap.min.js`))).gsap;
      if (st && st.SplitText && gsap) {
        gsap.registerPlugin(st.SplitText);
        const split = new st.SplitText(titre, { type: 'chars', charsClass: 'lettre' });
        titre.dataset.anime = '1';
        gsap.fromTo(split.chars, { opacity: 0, y: '0.42em' },
          { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.022, delay: 0.15 });
      }
    } catch (_) { /* le titre reste entier : aucune perte */ }
  }
}

/* ── 10. Figures : « Agrandir » / « Fermer » (jamais de glyphe + ou X) ─── */
function brancherFigures() {
  document.querySelectorAll('[data-agrandissable]').forEach(fig => {
    if (fig.dataset.pret === '1') return;
    fig.dataset.pret = '1';
    const barre = fig.querySelector('.figure__actions');
    if (!barre) return;
    const bouton = barre.querySelector('[data-agrandir]');
    if (!bouton) return;
    bouton.textContent = 'Agrandir';
    bouton.addEventListener('click', () => {
      const ouvert = fig.dataset.agrandi === '1';
      fig.dataset.agrandi = ouvert ? '0' : '1';
      bouton.textContent = ouvert ? 'Agrandir' : 'Fermer';
      bouton.setAttribute('aria-expanded', ouvert ? 'false' : 'true');
      if (!ouvert) fig.querySelector('img')?.focus?.();
    });
    document.addEventListener('keydown', ev => {
      if (ev.key === 'Escape' && fig.dataset.agrandi === '1') bouton.click();
    });
  });
}

/* ── 11. Narration : lecteur unique, transcription toujours disponible ─── */
function brancherNarration() {
  document.querySelectorAll('[data-narration]').forEach(b => {
    b.addEventListener('click', () => {
      const src = b.dataset.narration;
      if (!src) {
        annoncer('La narration de cette salle n’est pas encore enregistrée. ' +
                 'La transcription écrite est disponible plus bas dans la page.');
        b.textContent = 'Narration bientôt disponible';
        b.disabled = true;
        return;
      }
      const audio = new Audio(`${BASE}${src}`);
      audio.play().catch(() => annoncer('Lecture audio impossible sur cet appareil.'));
    });
  });
}

/* ── Amorçage ──────────────────────────────────────────────────────────── */
window.LOEUVRE = window.LOEUVRE || {};
Object.assign(window.LOEUVRE, {
  base: BASE, detecterMoteur, chargerTrois, mouvementReduit,
  setMouvementReduit(v) { localStorage.setItem(CLE_MOUVEMENT, v ? '1' : '0'); appliquerMouvement(); },
  annoncer,
});

document.body.dataset.transition = 'entree';
brancherTiroir();
brancherNavigation();
brancherRevelations();
brancherClavier();
brancherFigures();
brancherNarration();
monterScenes();
ameliorations();

/* ── Effets sonores d'interface (R09 : Web Audio, synthèses à la volée) ──── */
const CLE_SFX = 'oeuvre-sfx';
let sfx = null;
const sfxActif = () => localStorage.getItem(CLE_SFX) !== '0';
function chargerSfx() {
  if (sfx || !sfxActif()) return;
  import(/* webpackIgnore: true */ urlAsset(`${BASE}assets/js/sfx.js`))
    .then((m) => { sfx = m; m.regler(true); })
    .catch(() => { sfx = null; });
}
['pointerdown', 'keydown'].forEach((ev) =>
  window.addEventListener(ev, chargerSfx, { once: true, passive: true }));

let dernierTick = 0;
document.addEventListener('click', (e) => {
  if (e.target.closest('.interaction button, .interaction__barre button')) sfx && sfx.clic();
}, true);
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el && el.matches && el.matches('.interaction input[type="range"]')) {
    const t = performance.now();
    if (t - dernierTick > 140) { dernierTick = t; sfx && sfx.tick(); }
  }
}, true);
document.addEventListener('oeuvre:reinitialiser', () => { sfx && sfx.carillon(); }, true);
document.addEventListener('oeuvre:piloter', () => { sfx && sfx.whoosh && null; }, true);

const btnSfx = document.getElementById('sfx-toggle');
if (btnSfx) {
  const maj = () => {
    const on = sfxActif();
    btnSfx.setAttribute('aria-pressed', String(on));
    btnSfx.textContent = on ? 'Effets sonores : activés' : 'Effets sonores : coupés';
  };
  maj();
  btnSfx.addEventListener('click', () => {
    localStorage.setItem(CLE_SFX, sfxActif() ? '0' : '1');
    if (sfxActif()) chargerSfx();
    sfx && sfx.regler(sfxActif());
    maj();
  });
}

/* ── Impression : ouvrir transcriptions et détails avant la sortie papier ── */
window.addEventListener('beforeprint', () => {
  document.querySelectorAll('details').forEach((d) => { d.open = true; });
});
document.addEventListener('click', (ev) => {
  if (ev.target.closest && ev.target.closest('.print-btn')) window.print();
}, true);
