/* Lesmana count-up mechanic, ported to the OTEO design.
   Counts [data-count] numbers up when they scroll into view — the Framer/Lesmana
   counter feel, but on real verified numbers only (§0: no invented figures).
   Progressive enhancement: without JS the final number is already in the HTML. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nodes = [].slice.call(document.querySelectorAll("[data-count]"));
  if (!nodes.length) return;

  // final values are authored in the HTML; capture then reset to 0 for the run
  nodes.forEach(function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    el.__t = isNaN(target) ? 0 : target;
    el.__suffix = el.getAttribute("data-suffix") || "";
    if (!reduce) el.textContent = "0" + el.__suffix;
  });
  if (reduce) { nodes.forEach(function (el) { el.textContent = el.__t + el.__suffix; }); return; }

  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); } // ~ Lesmana ease

  function run(el) {
    var dur = 1100, start = null, t = el.__t;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      el.textContent = Math.round(easeOutExpo(p) * t) + el.__suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = t + el.__suffix;
    }
    requestAnimationFrame(frame);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (el) { io.observe(el); });
  } else {
    nodes.forEach(run);
  }
})();
