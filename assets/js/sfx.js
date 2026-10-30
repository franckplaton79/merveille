/* L'ŒUVRE — effets sonores d'interface (R09 : Web Audio, aucun fichier).
   Synthèse à la volée : oscillateurs + bruit filtré, gains très faibles,
   déclenchés uniquement par des gestes explicites du visiteur. */
let ctx = null;
let actif = true;

export function regler(v) { actif = !!v; }

function ac() {
  if (!actif) return null;
  try {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch (_) { return null; }
}

function tone(freq, dur, gain, type = 'sine', retard = 0) {
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + retard;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

/* clic discret : boutons d'interaction */
export function clic() { tone(660, 0.09, 0.05); }

/* tick : curseurs (déplacés), très bref */
export function tick() { tone(440, 0.045, 0.028, 'triangle'); }

/* carillon doux : réinitialisation */
export function carillon() { tone(523.25, 0.35, 0.045); tone(783.99, 0.4, 0.035, 'sine', 0.09); }

/* whoosh : changement de mode / registre */
export function whoosh() {
  const c = ac(); if (!c) return;
  const dur = 0.28;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(420, c.currentTime);
  f.frequency.exponentialRampToValueAtTime(1400, c.currentTime + dur);
  f.Q.value = 1.1;
  const g = c.createGain();
  g.gain.setValueAtTime(0.04, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  src.connect(f); f.connect(g); g.connect(c.destination);
  src.start();
}
