/* Analogie sonore, pas une simulation de la physiologie d'un oiseau. */
(function () {
  'use strict';
  var section = document.querySelector('[data-syrinx-etat]');
  var Audio = window.AudioContext || window.webkitAudioContext;
  if (!section || !Audio) return;
  var boutons = document.querySelectorAll('[data-syrinx]');
  var contexte = null, oscillateurs = [], fin = null;
  function statut(texte) { section.textContent = texte; }
  function arreter() {
    clearTimeout(fin);
    oscillateurs.forEach(function (osc) { try { osc.stop(); } catch (e) {} });
    oscillateurs = [];
    if (contexte) { contexte.close().catch(function () {}); contexte = null; }
  }
  function son(ctx, frequence, debut, duree) {
    var o = ctx.createOscillator(), gain = ctx.createGain(), t = ctx.currentTime + debut;
    o.type = 'sine'; o.frequency.value = frequence;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.035, t + 0.04);
    gain.gain.setValueAtTime(0.035, t + duree - 0.06);
    gain.gain.linearRampToValueAtTime(0, t + duree);
    o.connect(gain); gain.connect(ctx.destination); o.start(t); o.stop(t + duree); oscillateurs.push(o);
  }
  boutons.forEach(function (bouton) {
    bouton.disabled = false;
    bouton.addEventListener('click', function () {
      var mode = bouton.dataset.syrinx;
      arreter();
      if (mode === 'stop') { statut('Écoute arrêtée.'); return; }
      try {
        contexte = new Audio();
        son(contexte, 440, 0.05, mode === 'suite' ? 0.45 : 0.9);
        son(contexte, 660, mode === 'suite' ? 0.55 : 0.05, mode === 'suite' ? 0.45 : 0.9);
        statut(mode === 'suite' ? 'Écoute : son grave puis son aigu.' : 'Écoute : sons grave et aigu simultanés.');
        fin = setTimeout(function () { arreter(); statut('Écoute terminée.'); }, 1150);
      } catch (e) { arreter(); statut('Écoute indisponible sur cet appareil. Le texte décrit les deux exemples.'); }
    });
  });
  statut('Prêt : choisissez un exemple sonore.');
})();
