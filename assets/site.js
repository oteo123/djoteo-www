/* OTEO — cinematic motion layer.
   Lenis (momentum smooth-scroll) + GSAP ScrollTrigger (layered depth /
   scroll-linked parallax / staggered reveals). Progressive enhancement:
   - No JS  -> full static page (CSS renders everything).
   - JS, no GSAP/Lenis -> IntersectionObserver reveals only.
   - JS + GSAP -> full cinematic motion.
   - prefers-reduced-motion -> content revealed, ZERO transforms.
*/
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  root.classList.add("js-motion");

  var header = doc.querySelector(".site-header");
  var creamBand = null;
  function onScrollHeader(y) {
    if (!header) return;
    y = (y == null) ? (window.scrollY || window.pageYOffset) : y;
    header.classList.toggle("scrolled", y > 40);
    if (creamBand) {
      var hb = header.getBoundingClientRect().bottom;
      var cr = creamBand.getBoundingClientRect();
      header.classList.toggle("on-light", cr.top <= hb && cr.bottom >= hb);
    }
  }

  /* ---------- Mobile nav: inject hamburger (no per-page markup) ---------- */
  (function mobileNav() {
    var navWrap = header && header.querySelector(".header-nav");
    var links = navWrap && navWrap.querySelector(".nav-links");
    if (!navWrap || !links) return;
    var btn = doc.createElement("button");
    btn.className = "nav-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Menu");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<span class="nav-toggle-bar" aria-hidden="true"></span>' +
                    '<span class="nav-toggle-bar" aria-hidden="true"></span>' +
                    '<span class="nav-toggle-bar" aria-hidden="true"></span>';
    navWrap.insertBefore(btn, links);
    function setOpen(open) {
      header.classList.toggle("nav-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    btn.addEventListener("click", function () {
      setOpen(!header.classList.contains("nav-open"));
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900) setOpen(false);
    });
  })();

  var yr = doc.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

  /* Decorative hero film: user-controllable and still by default for people
     who request reduced motion. The poster remains the no-video fallback. */
  (function heroMedia() {
    var video = doc.querySelector("[data-hero-video]");
    var toggle = doc.querySelector("[data-hero-media-toggle]");
    var label = toggle && toggle.querySelector("[data-hero-media-label]");
    if (!video) return;

    function setPaused(paused) {
      if (paused) video.pause();
      else {
        var playback = video.play();
        if (playback && typeof playback.catch === "function") {
          playback.catch(function () { setPaused(true); });
        }
      }
      if (!toggle) return;
      toggle.setAttribute("aria-pressed", paused ? "true" : "false");
      if (label) label.textContent = paused ? "Play motion" : "Pause motion";
    }

    setPaused(reduce);
    if (toggle) {
      toggle.addEventListener("click", function () {
        setPaused(!video.paused);
      });
    }
  })();

  /* Contact form: Web3Forms documents browser-side JSON as its supported path.
     Its access key is a public form identifier, not a secret API credential.
     If delivery is not confirmed, open email without claiming it was sent. */
  var form = doc.querySelector("[data-contact-form]");
  if (form) {
    var web3formsId = "0ea77eca-edf8-4b40-912e-c36a3dac6de7";
    var statusEl = form.querySelector("[data-contact-status]");
    var submitEl = form.querySelector("[data-contact-submit]");
    var value = function (n) {
      var field = form.querySelector('[name="' + n + '"]');
      return field ? String(field.value || "").trim() : "";
    };
    var setStatus = function (message, state) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.setAttribute("data-state", state || "");
    };
    var emailFallback = function () {
      var body = value("message") + "\n\n— " + value("name") +
        (value("email") ? " · " + value("email") : "");
      setStatus("The form service did not confirm delivery. Opening a prefilled email instead.", "error");
      window.location.href = "mailto:oteo@djoteo.com?subject=" +
        encodeURIComponent("Booking Inquiry — " + (value("name") || "djoteo.com")) +
        "&body=" + encodeURIComponent(body);
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (submitEl) submitEl.disabled = true;
      setStatus("Sending your inquiry…", "");
      var payload = {};
      new FormData(form).forEach(function (v, k) { payload[k] = v; });
      payload.access_key = web3formsId;
      fetch("https://api.web3forms.com/submit", {
        method:"POST",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify(payload)
      }).then(function (response) {
        return response.json().catch(function () { return {}; });
      }).then(function (data) {
        if (!data || !data.success) throw new Error("unconfirmed");
        form.reset();
        setStatus("Inquiry received. OTEO will reply with availability and next steps.", "success");
      }).catch(emailFallback).finally(function () {
        if (submitEl) submitEl.disabled = false;
      });
    });
  }

  function show(el) { el.classList.add("is-visible"); }
  var reveals = Array.prototype.slice.call(doc.querySelectorAll(".reveal"));

  /* ---------- Fallback path: reveal via IntersectionObserver ---------- */
  function ioFallback() {
    function revealInView() {
      var vh = window.innerHeight || 0;
      reveals.forEach(function (el) {
        if (el.classList.contains("is-visible")) return;
        if (el.getBoundingClientRect().top < vh * 0.92) show(el);
      });
    }
    if ("IntersectionObserver" in window && reveals.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var d = reduce ? 0 : (parseInt(e.target.getAttribute("data-delay"), 10) || 0);
          setTimeout(function () { show(e.target); }, d);
          io.unobserve(e.target);
        });
      }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (el) { io.observe(el); });
      revealInView();
      setTimeout(function () {
        doc.querySelectorAll(".reveal:not(.is-visible)").forEach(show);
      }, 1400);
    } else {
      reveals.forEach(show);
    }
    window.addEventListener("scroll", function () { onScrollHeader(); }, { passive: true });
    onScrollHeader();
  }

  /* ---------- Reduced motion: reveal everything, no transforms ---------- */
  if (reduce) {
    reveals.forEach(show);
    Array.prototype.forEach.call(doc.querySelectorAll("[data-hero]"), show);
    window.addEventListener("scroll", function () { onScrollHeader(); }, { passive: true });
    onScrollHeader();
    return;
  }

  /* Hero intro stagger (runs in both GSAP and fallback paths) */
  function heroIntro() {
    var items = Array.prototype.slice.call(doc.querySelectorAll("[data-hero]"));
    items.forEach(function (el, i) { setTimeout(function () { show(el); }, 120 + i * 110); });
  }

  /* ---------- Boot after deferred vendor scripts settle ---------- */
  function boot() {
    var hasGSAP = window.gsap && window.ScrollTrigger;
    if (!hasGSAP) { ioFallback(); heroIntro(); return; }

    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);

    /* Lenis momentum scroll, driven by GSAP's ticker + synced to ScrollTrigger */
    var lenis = null;
    var Lenis = window.Lenis || (window.lenis && window.lenis.default);
    if (typeof Lenis === "function") {
      try {
        lenis = new Lenis({ duration: 1.05, smoothWheel: true,
          easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
        lenis.on("scroll", ST.update);
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      } catch (e) { lenis = null; }
    }
    ST.addEventListener("refresh", function () { if (lenis) lenis.resize(); });
    /* robust reveal safety: anything you've scrolled to becomes visible even if a
       fast flick outran ScrollTrigger's batch — content can never stay hidden. */
    function revealSweep() {
      var vh = window.innerHeight;
      doc.querySelectorAll(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < vh * 0.96) show(el);
      });
    }
    window.addEventListener("scroll", function () { onScrollHeader(); revealSweep(); }, { passive: true });
    if (lenis) lenis.on("scroll", function (e) { onScrollHeader(e.scroll); revealSweep(); });
    onScrollHeader();

    heroIntro();

    /* --- HERO: wordmark drifts up on scroll (the arc fade/tilt lives in the
           standalone [data-hero-arc] block below) --- */
    var hero = doc.querySelector(".hero");
    if (hero) {
      var wm = hero.querySelector(".hero-wordmark");
      if (wm) gsap.to(wm, { yPercent: -18, ease: "none", scrollTrigger: {
        trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 } });

      /* Subtle pointer parallax via CSS vars — composes with the scroll
         tween through the standalone `translate:` property. */
      var qx = gsap.quickTo(hero, "--mx", { duration: 0.5, ease: "power3" });
      var qy = gsap.quickTo(hero, "--my", { duration: 0.5, ease: "power3" });
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        qx((e.clientX - r.left) / r.width - 0.5);
        qy((e.clientY - r.top) / r.height - 0.5);
      });
      hero.addEventListener("pointerleave", function () { qx(0); qy(0); });
    }

    /* --- staggered reveals (exclude hero items: the hero intro owns them) --- */
    var batchTargets = reveals.filter(function (el) { return !el.hasAttribute("data-hero"); });
    ST.batch(batchTargets, {
      start: "top 88%",
      onEnter: function (els) {
        gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
          stagger: 0.08, overwrite: true, onStart: function () { els.forEach(show); } });
      },
      onEnterBack: function (els) { els.forEach(show); }
    });
    // safety: never leave a reveal stuck hidden
    setTimeout(function () {
      doc.querySelectorAll(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) show(el);
      });
    }, 1600);

    /* --- sound portrait: slow drift inside its frame --- */
    var sp = doc.querySelector(".sound-photo img");
    if (sp) gsap.fromTo(sp, { yPercent: -6 }, { yPercent: 6, ease: "none",
      scrollTrigger: { trigger: ".sound-photo", start: "top bottom", end: "bottom top", scrub: true } });

    /* --- showcase bg slow zoom-drift --- */
    var sbg = doc.querySelector(".showcase-bg");
    if (sbg) gsap.fromTo(sbg, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.04, ease: "none",
      scrollTrigger: { trigger: ".showcase", start: "top bottom", end: "bottom top", scrub: true } });

    /* --- contact bg drift --- */
    var cbg = doc.querySelector(".contact-bg");
    if (cbg) gsap.fromTo(cbg, { yPercent: -12, scale: 1.08 }, { yPercent: 8, ease: "none",
      scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom top", scrub: true } });

    /* --- collage frames: cross-browser scroll float (GSAP preserves each
           frame's CSS rotation and animates only the vertical offset) --- */
    function collageFloat(sel, from, to) {
      var el = doc.querySelector(sel);
      if (el) gsap.fromTo(el, { yPercent: from }, { yPercent: to, ease: "none",
        scrollTrigger: { trigger: ".neo-collage", start: "top bottom", end: "bottom top", scrub: true } });
    }
    collageFloat(".neo-frame-tall", 10, -10);
    collageFloat(".neo-frame-wide", -8, 9);
    collageFloat(".neo-frame-detail", 6, -7);

    /* --- statement image: slow drift + settle (was animation-timeline) --- */
    var stImg = doc.querySelector(".neo-statement-image img");
    if (stImg) gsap.fromTo(stImg, { yPercent: -10, scale: 1.08 }, { yPercent: 4, scale: 1.02, ease: "none",
      scrollTrigger: { trigger: ".neo-statement-image", start: "top bottom", end: "bottom top", scrub: true } });

    /* --- marquee: base drift + scroll-velocity boost --- */
    var track = doc.querySelector("[data-marquee-track]");
    if (track) {
      var half = track.scrollWidth / 2 || 1;
      var mtl = gsap.timeline({ repeat: -1 })
        .fromTo(track, { x: 0 }, { x: -half, duration: 26, ease: "none" });
      ST.create({ start: 0, end: "max",
        onUpdate: function (self) {
          var boost = 1 + Math.min(6, Math.abs(self.getVelocity() / 260));
          gsap.to(mtl, { timeScale: boost, duration: 0.3, overwrite: true });
          clearTimeout(track._mqReset);
          track._mqReset = setTimeout(function () {
            gsap.to(mtl, { timeScale: 1, duration: 1.1, ease: "power2.out", overwrite: true });
          }, 140);
        } });
    }

    ST.refresh();
  }

  /* Deferred vendor scripts finish around DOMContentLoaded; give them a beat. */
  if (doc.readyState === "complete") setTimeout(boot, 60);
  else window.addEventListener("load", function () { setTimeout(boot, 30); });
})();

/* Hero curved-arc: subtle mouse + scroll tilt (skips under reduced-motion) */
(function () {
  var arc = document.querySelector("[data-hero-arc]");
  if (!arc) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  var tx = 0, ty = 0, cx = 0, cy = 0, raf;
  function loop() {
    cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
    arc.style.transform = "rotateX(" + (5 + cy * 4) + "deg) rotateY(" + (cx * 6) + "deg)";
    raf = requestAnimationFrame(loop);
  }
  window.addEventListener("pointermove", function (e) {
    tx = (e.clientX / window.innerWidth) - 0.5;
    ty = (e.clientY / window.innerHeight) - 0.5;
  }, { passive: true });
  window.addEventListener("scroll", function () {
    var y = window.scrollY || 0;
    arc.style.opacity = Math.max(0.15, 1 - y / 700);
  }, { passive: true });
  loop();
})();
