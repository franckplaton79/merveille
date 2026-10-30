/* L'ŒUVRE — module merveilles : compteurs animés + cartes à retourner.
   Replis sans JS : les valeurs sont déjà dans le HTML (data-valeur affiché en texte),
   les cartes à retourner sont des <details> natifs. */
(function () {
  'use strict';
  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fmt(v, dec, exp, suf) {
    var s = v.toFixed(dec);
    if (dec > 0) s = s.replace('.', ',');
    if (exp) s += ' × 10' + String(exp).split('').map(function (c) {
      return '⁰¹²³⁴⁵⁷⁸⁹'[-c] || c; }).join('').replace('⁻', '⁻');
    return s + (suf || '');
  }
  function animer(el) {
    var cible = parseFloat(el.dataset.valeur || '0');
    var dec = parseInt(el.dataset.decimales || '0', 10);
    var exp = el.dataset.exposant || '';
    var suf = el.dataset.suffixe || '';
    if (reduit) { el.textContent = fmt(cible, dec, exp, suf); return; }
    var t0 = null, D = 1200;
    function pas(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / D);
      k = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(cible * k, dec, exp, suf);
      if (k < 1) requestAnimationFrame(pas);
    }
    requestAnimationFrame(pas);
  }
  var vus = new WeakSet();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting && !vus.has(e.target)) { vus.add(e.target); animer(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-compteur]').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('[data-compteur]').forEach(animer);
  }
})();
