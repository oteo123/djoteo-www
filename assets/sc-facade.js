/* SoundCloud click-to-load facade.
   A .sc-facade[data-sc-url] element renders a lightweight branded play button;
   the real (cookie-setting, heavier) SoundCloud iframe is only injected when the
   visitor chooses to listen. Keeps third-party cookies + iframe weight off the
   initial page load. Progressive: no JS = the facade's own link still works. */
(function () {
  "use strict";
  function load(el) {
    var url = el.getAttribute("data-sc-url");
    if (!url) return;
    var color = el.getAttribute("data-sc-color") || "c8a96a";
    var height = el.getAttribute("data-sc-height") || "340";
    var src = "https://w.soundcloud.com/player/?url=" + encodeURIComponent(url) +
      "&color=%23" + color +
      "&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true";
    var ifr = document.createElement("iframe");
    ifr.title = el.getAttribute("data-sc-title") || "OTEO on SoundCloud";
    ifr.setAttribute("allow", "autoplay");
    ifr.setAttribute("loading", "eager");
    ifr.style.cssText = "display:block;width:100%;height:" + height + "px;border:0;background:#111";
    ifr.src = src;
    el.replaceWith(ifr);
  }
  function wire(el) {
    el.addEventListener("click", function (e) {
      if (e.target.closest("a")) return; // let the fallback link work
      load(el);
    });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); load(el); }
    });
  }
  var nodes = document.querySelectorAll(".sc-facade[data-sc-url]");
  for (var i = 0; i < nodes.length; i++) wire(nodes[i]);
})();
