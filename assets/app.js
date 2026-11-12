(function() {
  var busy = false;
  var NAV = [
    { href: "/booking", label: "Booking" },
    { href: "/rentals", label: "Gear Rentals" },
    { href: "/residencies", label: "Track Record" },
    { href: "/works", label: "Rooms" },
    { href: "/blog", label: "Sets" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" }
  ];
  var NAV_FOOTER = [{ href: "/foowr", label: "The Label" }, { href: "/ugc", label: "Branded Content" }];
  function navGroups() {
    var out = [];
    var works = document.querySelectorAll('a[href$="works"],a[href$="works/"]');
    for (var i = 0; i < works.length; i++) {
      var w = works[i], h = w.getAttribute("href") || "";
      if (!/^(\/|(\.\.?\/)+)works\/?$/.test(h)) continue;
      var base = h.replace(/works\/?$/, "");
      var row = w.parentElement;
      while (row && row !== document.body) {
        if (row.querySelector('a[href="' + base + 'about"]') && row.querySelector('a[href="' + base + 'contact"]')) break;
        row = row.parentElement;
      }
      if (!row || row === document.body) continue;
      if (row.textContent.replace(/\s+/g, "").length > 400) continue;
      if (out.indexOf(row) > -1) continue;
      out.push(row);
    }
    return out;
  }
  function navCell(row, item, templateLabel) {
    var w = row.querySelector('a[href$="works"],a[href$="works/"]');
    if (!w) return null;
    var cell = w;
    while (cell.parentElement && cell.parentElement !== row) cell = cell.parentElement;
    if (cell.parentElement !== row) return null;
    var copy = cell.cloneNode(true);
    copy.setAttribute("data-oteo-nav", item.href);
    var a = copy.querySelector("a") || (copy.tagName === "A" ? copy : null);
    if (!a) return null;
    a.setAttribute("href", item.href);
    a.removeAttribute("data-framer-page-link-current");
    a.removeAttribute("aria-current");
    unzeroReveal(copy);
    var srcLabel = templateLabel, tw0 = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT, null, false), t0;
    while (t0 = tw0.nextNode()) {
      if (t0.nodeValue.trim()) {
        srcLabel = t0.nodeValue.trim();
        break;
      }
    }
    var tw = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT, null, false), t;
    while (t = tw.nextNode()) {
      if (t.nodeValue.trim() === srcLabel) t.nodeValue = t.nodeValue.replace(srcLabel, item.label);
    }
    return copy;
  }
  var HAIRLINE = '[style*="height: 1px"],[style*="height:1px"]';
  function hasHairline(el) {
    return el.matches(HAIRLINE) || !!el.querySelector(HAIRLINE);
  }
  function navRule(row) {
    var kids = row.children;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].matches("a") || kids[i].querySelector("a")) continue;
      if (!hasHairline(kids[i])) continue;
      var copy = kids[i].cloneNode(true);
      copy.setAttribute("data-oteo-nav-rule", "1");
      var bars = Array.prototype.slice.call(copy.querySelectorAll(HAIRLINE));
      if (copy.matches(HAIRLINE)) bars.push(copy);
      for (var b = 0; b < bars.length; b++) {
        if (bars[b].style.position === "absolute") bars[b].style.width = "100%";
      }
      return copy;
    }
    return null;
  }
  function unifyNav() {
    var groups = navGroups();
    for (var g = 0; g < groups.length; g++) {
      var row = groups[g];
      var isFooter = !!row.querySelector("h3");
      var isPhoneMenu = !!row.closest('nav[data-framer-name="Phone Open"]');
      var items = isFooter ? NAV.concat(NAV_FOOTER) : NAV;
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (row.querySelector('a[href="' + item.href + '"],a[href="' + item.href.replace(/\/$/, "") + '/"]')) continue;
        if (row.querySelector('[data-oteo-nav="' + item.href + '"]')) continue;
        var cell = navCell(row, item, "Works");
        if (!cell) continue;
        row.appendChild(cell);
        if (isFooter || isPhoneMenu) {
          var rule = navRule(row);
          if (rule) row.appendChild(rule);
        }
      }
      {
        var keep = {};
        for (var k = 0; k < items.length; k++) keep[items[k].href.replace(/\/$/, "")] = 1;
        var anchors = row.querySelectorAll("a[href]");
        for (var a = 0; a < anchors.length; a++) {
          var path = (anchors[a].getAttribute("href") || "").replace(/^\.+/, "").replace(/\/$/, "");
          if (!path) continue;
          var cellEl = anchors[a].closest("[data-oteo-nav]") || anchors[a];
          var rule = ruleFor(cellEl);
          if (keep[path]) {
            if (cellEl.style.display === "none") cellEl.style.display = "";
            if (rule && rule.style.display === "none") rule.style.display = "";
          } else if (/^\/(works|blog|residencies|calendar|foowr|mixes)$/.test(path)) {
            cellEl.style.display = "none";
            if (rule) rule.style.display = "none";
          }
        }
      }
      if (isPhoneMenu) {
        var pa = row.querySelectorAll("a[href]");
        for (var q = 0; q < pa.length; q++) {
          var pc = pa[q];
          while (pc.parentElement && pc.parentElement !== row) pc = pc.parentElement;
          if (pc.parentElement !== row || pc.style.display === "none") continue;
          if (ruleFor(pc)) continue;
          var nr = navRule(row);
          if (nr) row.insertBefore(nr, pc.nextSibling);
        }
      }
      orderNav(row, items);
      if (isPhoneMenu && row.style.gridAutoFlow) {
        row.style.display = "";
        row.style.gridTemplateRows = "";
        row.style.gridAutoFlow = "";
        row.style.columnGap = "";
        row.style.rowGap = "";
        row.style.alignItems = "";
        row.style.justifyContent = "";
      }
      if (!isFooter && !isPhoneMenu && row.children.length > 4) {
        row.style.display = "grid";
        row.style.gridTemplateRows = "repeat(4,auto)";
        row.style.gridAutoFlow = "column";
        row.style.columnGap = "36px";
        row.style.rowGap = "0px";
        row.style.alignItems = "start";
        row.style.justifyContent = "start";
      }
    }
  }
  function unzeroReveal(copy) {
    var all = [copy].concat(Array.prototype.slice.call(copy.querySelectorAll("*")));
    for (var k = 0; k < all.length; k++) {
      var el = all[k];
      el.removeAttribute("data-framer-appear-id");
      if (!el.style || el.style.opacity === "") continue;
      if (el !== copy && !(el.textContent || "").trim()) continue;
      el.style.opacity = "1";
      el.style.transform = "none";
    }
  }
  function ruleFor(cell) {
    var rule = cell.nextElementSibling;
    if (!rule) return null;
    if (rule.hasAttribute("data-oteo-nav-rule")) return rule;
    if (rule.querySelector("a[href]") || !hasHairline(rule)) return null;
    return rule;
  }
  function orderNav(row, items) {
    var want = [];
    for (var i = 0; i < items.length; i++) {
      var a = row.querySelector('a[href="' + items[i].href + '"],a[href="' + items[i].href.replace(/\/$/, "") + '/"]');
      if (!a) continue;
      var cell = a;
      while (cell.parentElement && cell.parentElement !== row) cell = cell.parentElement;
      if (cell.parentElement !== row) continue;
      want.push(cell);
      var rule = ruleFor(cell);
      if (rule) want.push(rule);
    }
    if (!want.length) return;
    var kids = row.children, n = kids.length, ok = n >= want.length;
    for (var k = 0; ok && k < want.length; k++) if (kids[n - want.length + k] !== want[k]) ok = false;
    if (ok) return;
    for (var m = 0; m < want.length; m++) row.appendChild(want[m]);
  }
  function fixDupIds() {
    var bad = document.querySelectorAll('[id^="undefined-"]');
    for (var i = 0; i < bad.length; i++) bad[i].removeAttribute("id");
    var seen = {}, els = document.querySelectorAll("[id]");
    for (var j = 0; j < els.length; j++) {
      var id = els[j].id;
      if (!id) continue;
      if (seen[id]) {
        var k = 2;
        while (document.getElementById(id + "-" + k)) k++;
        els[j].id = id + "-" + k;
      } else seen[id] = 1;
    }
  }
  function fixLinks() {
    var as = document.querySelectorAll("a[href]");
    for (var i = 0; i < as.length; i++) {
      var a = as[i], h = a.getAttribute("href") || "";
      if (/^https?:\/\/(www\.)?djoteo\.com\/?$/.test(h)) {
        a.setAttribute("href", "/");
        h = "/";
      }
      if (/^(\/|https?:\/\/djoteo\.com)/.test(h) && a.getAttribute("target") === "_blank") {
        a.removeAttribute("target");
        a.removeAttribute("rel");
      }
    }
  }
  function fixTouch() {
    var els = document.querySelectorAll('[style*="touch-action"]');
    for (var i = 0; i < els.length; i++) {
      if (els[i].style.touchAction === "none") els[i].style.touchAction = "pan-y";
    }
  }
  function fixBrand() {
    var slots = document.querySelectorAll(".framer-nagdz8");
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      if (s.querySelector("[data-oteo-brand]")) continue;
      for (var j = 0; j < s.children.length; j++) s.children[j].style.display = "none";
      var t = document.createElement("span");
      t.className = "brand";
      t.setAttribute("data-oteo-brand", "1");
      t.textContent = "Oteo";
      t.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;color:#f1ede4;";
      s.appendChild(t);
    }
  }
  function stripHiddenSlider() {
    var s = document.querySelector('[data-framer-name="Slider"]');
    if (!s) return 0;
    var cs = window.getComputedStyle(s);
    if (cs.display !== "none" && cs.visibility !== "hidden") return 0;
    var imgs = s.querySelectorAll("img[src],img[srcset],source[srcset]"), n = 0;
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i];
      if (im.hasAttribute("data-oteo-stripped")) continue;
      im.setAttribute("data-oteo-stripped", im.getAttribute("src") || im.getAttribute("srcset") || "1");
      im.removeAttribute("srcset");
      im.removeAttribute("src");
      n++;
    }
    return n;
  }
  function watchHiddenSlider() {
    var run = function() {
      try {
        stripHiddenSlider();
      } catch (e) {
      }
    };
    run();
    var mo = new MutationObserver(run);
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function() {
      mo.disconnect();
      run();
    }, 12e3);
  }
  var SERVICES = [
    {
      href: "/booking",
      kicker: "01 / Live DJ",
      title: "Book a DJ",
      copy: "Any crowd, any vibe. Oteo plays everything from hip hop and Top 40 to Latin, disco and international music, often on a House beat, and keeps it classy, clean and high-energy.",
      note: "Quoted per event",
      cta: "Book Oteo"
    },
    {
      href: "/rentals",
      kicker: "02 / Gear Rental",
      title: "Rent DJ gear",
      copy: "Pioneer DJ and AlphaTheta decks, mixers, speakers and microphones, delivered, set up and picked up.",
      note: "22 models · $150 minimum · Central Florida",
      cta: "See the gear"
    }
  ];
  function insertServices() {
    if (location.pathname !== "/" && location.pathname !== "/index.html") return;
    if (document.querySelector("[data-oteo-services]")) return;
    var hero = document.querySelector('[data-framer-name="Hero"]');
    if (!hero || !hero.parentElement) return;
    var sec = document.createElement("section");
    sec.setAttribute("data-oteo-services", "");
    sec.className = "oteo-services";
    var wrap = document.createElement("div");
    wrap.className = "oteo-services-wrap";
    SERVICES.forEach(function(s) {
      var a = document.createElement("a");
      a.className = "oteo-service";
      a.href = s.href;
      [
        ["span", "oteo-service-k", s.kicker],
        ["h2", "oteo-service-t", s.title],
        ["p", "oteo-service-c", s.copy],
        ["span", "oteo-service-n", s.note],
        ["span", "oteo-service-cta", s.cta]
      ].forEach(function(d) {
        var el = document.createElement(d[0]);
        el.className = d[1];
        el.textContent = d[2];
        a.appendChild(el);
      });
      wrap.appendChild(a);
    });
    sec.appendChild(wrap);
    var proof = document.createElement("a");
    proof.className = "oteo-proof";
    proof.href = "/residencies";
    var pLead = document.createElement("span");
    pLead.className = "oteo-proof-lead";
    pLead.textContent = "Playing Orlando since 2017";
    var pRooms = document.createElement("span");
    pRooms.className = "oteo-proof-rooms";
    pRooms.textContent = "Debonair Supper Club · Casa Mezcal · The H Orlando · Helena Modern Riviera · AVA MediterrAegean · Taverna Opa · The Lawn Bar at ICON Park";
    var pCta = document.createElement("span");
    pCta.className = "oteo-proof-cta";
    pCta.textContent = "See the track record";
    proof.append(pLead, pRooms, pCta);
    sec.appendChild(proof);
    hero.parentElement.insertBefore(sec, hero.nextSibling);
  }
  function insertTestimonialProof() {
    if (location.pathname !== "/" && location.pathname !== "/index.html") return;
    if (document.querySelector("[data-oteo-tproof]")) return;
    var sec = document.querySelector('[data-framer-name="Testimonials"]');
    if (!sec) return;
    var left = sec.querySelector('[data-framer-name="Left"]');
    if (!left || !left.parentElement) return;
    var box = document.createElement("div");
    box.setAttribute("data-oteo-tproof", "");
    box.className = "oteo-tproof";
    box.innerHTML = '<div class="oteo-tproof-stat"><span class="oteo-tproof-num">31</span><span class="oteo-tproof-lbl">venues played, Greater Orlando</span></div><div class="oteo-tproof-press"><span class="oteo-tproof-k">Press</span><span class="oteo-tproof-v">Orlando Weekly, Best Club DJ nominee</span></div>';
    left.parentElement.appendChild(box);
  }
  function phoneHeaderCta() {
    var right = document.querySelector('nav[data-framer-name="Phone"] [data-framer-name="Right"]');
    if (!right) return;
    if (right.querySelector("[data-oteo-phone-cta]")) return;
    var burger = right.querySelector('[data-framer-name="Menu"]');
    if (!burger) return;
    var src = null, as = document.querySelectorAll("a"), pass2, i;
    for (pass2 = 0; pass2 < 2 && !src; pass2++) {
      for (i = 0; i < as.length; i++) {
        if (!/book\s*oteo/i.test(as[i].textContent || "")) continue;
        if (as[i].getBoundingClientRect().width < 50) continue;
        if (pass2 === 0 && as[i].getAttribute("data-framer-name") !== "Primary") continue;
        src = as[i];
        break;
      }
    }
    if (!src) return;
    var copy = src.cloneNode(true);
    copy.setAttribute("data-oteo-phone-cta", "1");
    unzeroReveal(copy);
    right.insertBefore(copy, burger);
  }
  var scrolled = false;
  function headerScrim() {
    var on = (window.pageYOffset || document.documentElement.scrollTop) > 60;
    if (on === scrolled) return;
    scrolled = on;
    document.documentElement.classList.toggle("oteo-scrolled", on);
  }
  function fixHeadingSemantics() {
    var h1s = document.querySelectorAll("h1");
    if (h1s.length < 2) return;
    var full = [];
    for (var i = 0; i < h1s.length; i++) full.push((h1s[i].textContent || "").trim());
    h1s[0].setAttribute("aria-label", full.join(" ").replace(/\s+/g, " "));
    for (var j = 1; j < h1s.length; j++) {
      if (h1s[j].getAttribute("role") === "presentation") continue;
      h1s[j].setAttribute("role", "presentation");
    }
  }
  function addSkipLink() {
    if (document.querySelector("a.skip-link")) return;
    var main = document.querySelector("main") || document.querySelector('[data-framer-name="Main"]');
    if (!main) return;
    if (!main.id) main.id = "main";
    var a = document.createElement("a");
    a.className = "skip-link";
    a.href = "#" + main.id;
    a.textContent = "Skip to content";
    document.body.insertBefore(a, document.body.firstChild);
  }
  var SET_MEDIA = { "casa-mezcal-oct-10-2026": { yt: "QH1LPQfxR3g", t: "Four Hours at Casa Mezcal" }, "casa-mezcal-oct-3-2026": { yt: "8IPALiY9RoY", t: "Five Hours at Casa Mezcal" }, "opening-for-mochakk-sept-12-2026": { yt: "f1KYvO-kKvo", t: "Opening for Mochakk at Wall Street Plaza" }, "ava-mm-lounge-july-6-2024": { sc: "https://soundcloud.com/oteo-397563902/ava-mm-070624", t: "Saturday Night at the AVA MM Lounge" } };
  function insertSetPlayer() {
    var m = location.pathname.match(/^\/(?:blog|mixes)\/([a-z0-9-]+)\/?$/);
    if (!m || !SET_MEDIA[m[1]]) return;
    if (document.querySelector("[data-oteo-player]")) return;
    var main = document.querySelector('[data-framer-name="Main content"]');
    if (!main) return;
    var d = SET_MEDIA[m[1]], w = document.createElement("div");
    w.setAttribute("data-oteo-player", "");
    w.style.cssText = "position:relative;aspect-ratio:16/9;width:100%;margin:0 0 36px;border-radius:14px;overflow:hidden;background:#000";
    var cov = main.querySelector('[data-framer-name="Image mask"] img');
    var poster = cov && (cov.currentSrc || cov.src) || "";
    w.innerHTML = '<button type="button" aria-label="Play: ' + d.t.replace(/"/g, "&quot;") + '" style="position:absolute;inset:0;width:100%;height:100%;border:0;padding:0;margin:0;cursor:pointer;background:#000 url(' + poster + ') center/cover no-repeat"><span style="position:absolute;left:50%;top:50%;width:84px;height:84px;margin:-42px 0 0 -42px;border-radius:50%;background:rgba(18,17,13,.74);border:1.5px solid rgba(200,169,106,.95);display:flex;align-items:center;justify-content:center"><svg width="32" height="32" viewBox="0 0 24 24" fill="#c8a96a" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span></button>';
    w.querySelector("button").addEventListener("click", function() {
      var src = d.yt ? "https://www.youtube-nocookie.com/embed/" + d.yt + "?autoplay=1&rel=0" : "https://w.soundcloud.com/player/?url=" + encodeURIComponent(d.sc) + "&color=%23c8a96a&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true";
      w.innerHTML = '<iframe src="' + src + '" title="' + d.t.replace(/"/g, "&quot;") + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>';
    });
    var cover = main.querySelector('[data-framer-name="Image mask"]');
    var row = document.createElement("div");
    row.setAttribute("data-oteo-player-row", "");
    row.appendChild(w);
    if (cover) {
      cover.style.display = "none";
      cover.parentNode.insertBefore(row, cover);
    } else {
      row.style.order = "-1";
      main.insertBefore(row, main.firstChild);
    }
  }
  var roomFilterLabel = "All";
  function roomFilterApply() {
    var f = document.querySelector('[data-framer-name="Filter"]');
    if (f) {
      var tabs = f.querySelectorAll('[class$="-container"]');
      for (var t = 0; t < tabs.length; t++) {
        var border = tabs[t].querySelector('[data-framer-name="Border"]');
        if (!border) continue;
        border.style.opacity = (tabs[t].innerText || "").trim() === roomFilterLabel ? "1" : "0";
      }
    }
    var cards = document.querySelectorAll('#main a[href*="/works/"]');
    for (var i = 0; i < cards.length; i++) {
      var a = cards[i];
      if (!/\/works\/[a-z0-9-]+\/?$/.test(a.getAttribute("href") || "")) continue;
      var show = roomFilterLabel === "All" || (a.innerText || "").toUpperCase().indexOf(roomFilterLabel.toUpperCase()) > -1;
      var cell = a.parentElement && a.parentElement.children.length === 1 && !a.parentElement.getAttribute("data-framer-name") ? a.parentElement : a;
      cell.style.display = show ? "" : "none";
    }
  }
  function roomFilter() {
    if (!/^\/works\/?$/.test(location.pathname)) return;
    var f = document.querySelector('[data-framer-name="Filter"]');
    if (!f) return;
    if (!f.__oteoFilter) {
      f.__oteoFilter = 1;
      f.addEventListener("click", function(e) {
        var tab = e.target && e.target.closest ? e.target.closest('[data-framer-name="Filter"] [class$="-container"]') : null;
        if (!tab) return;
        var label = (tab.innerText || "").trim();
        if (!label) return;
        roomFilterLabel = label;
        roomFilterApply();
      }, true);
    }
    if (roomFilterLabel !== "All") roomFilterApply();
  }
  function pass() {
    if (busy) return;
    busy = true;
    try {
      fixLinks();
      fixDupIds();
      unifyNav();
      roomFilter();
      fixTouch();
      fixBrand();
      stripHiddenSlider();
      insertServices();
      insertTestimonialProof();
      phoneHeaderCta();
      fixHeadingSemantics();
      addSkipLink();
      insertSetPlayer();
    } finally {
      busy = false;
    }
  }
  function reveal() {
    document.documentElement.style.setProperty("opacity", "1", "important");
  }
  function start() {
    pass();
    reveal();
    headerScrim();
    window.addEventListener("scroll", headerScrim, { passive: true });
    var mo = new MutationObserver(function() {
      clearTimeout(window.__od);
      window.__od = setTimeout(pass, 80);
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    [400, 1200, 2500, 5e3].forEach(function(d) {
      setTimeout(pass, d);
    });
  }
  function early() {
    try {
      watchHiddenSlider();
    } catch (e) {
    }
    var done = false, go = function() {
      if (done) return;
      done = true;
      reveal();
    };
    var t0 = Date.now(), wait = function() {
      var known = false;
      try {
        document.fonts.forEach(function(f) {
          if (/Playfair/.test(f.family)) known = true;
        });
      } catch (e) {
      }
      if (known || Date.now() - t0 > 2300) {
        if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('500 1em "Playfair Display"'), document.fonts.load('italic 600 1em "Playfair Display"'), document.fonts.load("400 1em Geist"), document.fonts.load("600 1em Geist"), document.fonts.load("700 1em Geist"), document.fonts.load('500 1em "Geist Mono"')]).then(function() {
          return document.fonts.ready;
        }).then(function() {
          settle(3);
        }, go);
        else go();
      } else setTimeout(wait, 40);
    };
    var settle = function(k) {
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          if (document.fonts.status === "loading" && k > 0) document.fonts.ready.then(function() {
            settle(k - 1);
          });
          else go();
        });
      });
    };
    wait();
    setTimeout(go, 2500);
  }
  function fiberCoverage() {
    var els = document.querySelectorAll("#main [data-framer-name], #main a[href], #main h1, #main h2, #main p"), n = 0;
    for (var i = 0; i < els.length; i++) {
      var k = Object.keys(els[i]);
      for (var j = 0; j < k.length; j++) {
        if (k[j].indexOf("__reactFiber") === 0) {
          n++;
          break;
        }
      }
    }
    return { n: n, total: els.length };
  }
  var __coverStable = 0;
  function hydrated() {
    var c = fiberCoverage();
    if (c.n === 0 || c.n < c.total) {
      __coverStable = 0;
      return false;
    }
    __coverStable++;
    return __coverStable >= 2;
  }
  function whenHydrated(fn) {
    var t0 = Date.now();
    (function poll() {
      var age = Date.now() - t0;
      if (hydrated() || (age > 12e3 && fiberCoverage().n === 0) || age > 60e3) {
        setTimeout(fn, 150);
        return;
      }
      setTimeout(poll, 120);
    })();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", early);
  else early();
  function boot() {
    whenHydrated(start);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
