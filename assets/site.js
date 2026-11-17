// djoteo.com behaviour: phone menu, forms (Web3Forms, same endpoint as the old site), gear request list, active category tab.
(() => {
  // scroll reveal: each block eases in once; cards in the same row arrive one after another
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    const sel = '.head, .card, .rc, .hl, .gear, .pkcard, .setcard, .q, .svc article, .release, .list .li, .steps li, .faq details, .photos .ph, .nums div, .terms div, .facts div, .creds div, .cta h2, .cta p, .cta .ctas, .split > h2, .stack > p, .video, .vcap, .deck';
    const els = [...document.querySelectorAll(sel)].filter(el => !el.closest('.hero, .page-head, .label-hero'));
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => {
      const sibs = el.parentElement ? [...el.parentElement.children].filter(c => c.matches(sel)) : [];
      el.style.setProperty('--d', (Math.min(sibs.indexOf(el), 5) * 0.08) + 's');
      el.classList.add('rv'); io.observe(el);
    });
    // stat numbers count up once (years stay as they are)
    document.querySelectorAll('.nums dt').forEach(dt => {
      const n = parseInt(dt.textContent, 10); if (!n || n > 1900) return;
      const o = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; o.disconnect(); const t0 = performance.now();
        const step = t => { const p = Math.min(1, (t - t0) / 1100); dt.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step); });
      o.observe(dt);
    });
  }
  // moving pictures: stop them for people who asked for less motion, and on data-saver connections
  const still = reduce || (navigator.connection && navigator.connection.saveData);
  if (still) document.querySelectorAll('video[autoplay]').forEach(v => { v.removeAttribute('autoplay'); v.pause(); });

  // residency cards: the room's clip loads on first use, plays on hover (computer) or while the card is in view (phone)
  const loops = [...document.querySelectorAll('video.loop')];
  if (!still && loops.length) {
    const load = v => { if (v.dataset.loaded) return; v.dataset.loaded = 1;
      [['webm', 'video/webm'], ['mp4', 'video/mp4']].forEach(([k, t]) => { const s = document.createElement('source'); s.src = v.dataset['src' + k[0].toUpperCase() + k.slice(1)]; s.type = t; v.appendChild(s); }); v.load(); };
    const play = v => { load(v); const p = v.play(); if (p) p.then(() => v.classList.add('on')).catch(() => {}); };
    const stop = v => { v.classList.remove('on'); v.pause(); };
    if (matchMedia('(hover: hover)').matches) {
      loops.forEach(v => { const card = v.closest('a'); card.addEventListener('mouseenter', () => play(v)); card.addEventListener('mouseleave', () => stop(v)); card.addEventListener('focus', () => play(v)); card.addEventListener('blur', () => stop(v)); });
    } else if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(en => en.intersectionRatio >= 0.6 ? play(en.target) : stop(en.target)), { threshold: [0, 0.6] });
      loops.forEach(v => io.observe(v));
    }
  }

  // what people say: one quote at a time; changes every 7 seconds, holds while hovered or focused, never moves on its own for reduced motion
  document.querySelectorAll('.rot').forEach(rot => {
    const slides = [...rot.querySelectorAll('.rot-slide')], dotsBox = rot.querySelector('.rot-dots');
    if (slides.length < 2) return;
    const dots = [...dotsBox.children]; let i = 0, timer = null, held = false;
    const show = n => { i = (n + slides.length) % slides.length; slides.forEach((s, k) => { s.classList.toggle('cur', k === i); s.setAttribute('aria-hidden', String(k !== i)); }); dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i))); };
    const tick = () => { clearTimeout(timer); if (!reduce && !held) timer = setTimeout(() => { show(i + 1); tick(); }, 7000); };
    dots.forEach((d, k) => d.addEventListener('click', () => { show(k); tick(); }));
    rot.addEventListener('mouseenter', () => { held = true; clearTimeout(timer); }); rot.addEventListener('mouseleave', () => { held = false; tick(); });
    rot.addEventListener('focusin', () => { held = true; clearTimeout(timer); }); rot.addEventListener('focusout', () => { held = false; tick(); });
    rot.classList.add('on'); dotsBox.hidden = false; show(0); tick();
  });
  // Portrait placement, measured against each photo's real frame: the whole head stays in, the top of the hair sits 7% below the
  // top edge, the face is centred left to right, and neck and shoulders show below. Runs again whenever the frame changes size.
  const place = img => {
    const [x0, y0, x1, y1] = img.dataset.face.split(',').map(Number), [nw, nh] = img.dataset.wh.split(',').map(Number);
    const W = img.clientWidth, H = img.clientHeight; if (!W || !H) return;
    const sc = Math.max(W / nw, H / nh), rw = nw * sc, rh = nh * sc, vx = W / rw, vy = H / rh;
    let px = 0.5, py = 0.5;
    if (vx < 1) { const left = Math.min(Math.max((x0 + x1) / 2 - vx / 2, 0), 1 - vx); px = left / (1 - vx); }
    if (vy < 1) { let top = Math.max(0, y0 - 0.07 * vy); if (top + vy < y1 + 0.02) top = Math.max(0, y1 + 0.02 - vy); top = Math.min(top, 1 - vy); py = top / (1 - vy); }
    img.style.objectPosition = `${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%`;
  };
  const faces = [...document.querySelectorAll('img[data-face][data-wh]')];
  faces.forEach(place);
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(es => es.forEach(e => place(e.target))); faces.forEach(i => ro.observe(i)); }
  const btn = document.querySelector('.menu-btn'), sheet = document.getElementById('sheet');
  if (btn && sheet) {
    const set = open => { sheet.hidden = !open; btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Close' : 'Menu'; document.body.style.overflow = open ? 'hidden' : ''; };
    btn.addEventListener('click', () => set(sheet.hidden));
    sheet.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { set(false); btn.focus(); } });
  }

  // video players: the thumbnail turns into the YouTube player on click, so pages stay fast until someone presses play
  document.querySelectorAll('.video[data-yt]').forEach(v => v.querySelector('.play').addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    f.title = v.querySelector('.play').getAttribute('aria-label').replace(/^Play /, '');
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'; f.allowFullscreen = true;
    v.innerHTML = ''; v.appendChild(f);
  }));

  // gear request list
  const cartEl = document.querySelector('[data-cart]'), totalEl = document.querySelector('[data-total]');
  const cart = new Map(); // image -> {name, rate, qty, max}
  const gearIndex = {};
  document.querySelectorAll('[data-add]').forEach(b => { gearIndex[b.dataset.add] = { name: b.dataset.name, rate: +b.dataset.rate, max: +b.dataset.max }; });
  const money = n => '$' + n.toLocaleString('en-US');
  const render = () => {
    if (!cartEl) return;
    if (!cart.size) { cartEl.innerHTML = '<p class="muted">Nothing added yet. Use Add on a package or a piece of gear.</p>'; totalEl.textContent = ''; return; }
    cartEl.innerHTML = ''; let total = 0;
    cart.forEach((v, k) => {
      total += v.rate * v.qty;
      const row = document.createElement('div'); row.className = 'line';
      row.innerHTML = `<span>${v.name}</span><span class="n"><button type="button" aria-label="One fewer ${v.name}">−</button>${v.qty}<button type="button" aria-label="One more ${v.name}">+</button></span><span>${money(v.rate * v.qty)}</span>`;
      const [minus, plus] = row.querySelectorAll('button');
      minus.onclick = () => { v.qty--; if (v.qty < 1) cart.delete(k); render(); };
      plus.onclick = () => { if (v.qty < v.max) { v.qty++; render(); } };
      cartEl.appendChild(row);
    });
    totalEl.innerHTML = `${money(total)} <span>per night, before delivery beyond ${totalEl.dataset.radius} miles</span>`;
  };
  const add = (img, qty) => {
    const g = gearIndex[img]; if (!g) return;
    const cur = cart.get(img) || { ...g, qty: 0 }; cur.qty = Math.min(cur.qty + qty, g.max); cart.set(img, cur);
  };
  const flash = b => { const t = b.textContent; b.textContent = 'Added'; setTimeout(() => b.textContent = t, 1200); };
  document.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => { add(b.dataset.add, 1); render(); flash(b); }));
  document.querySelectorAll('[data-add-pkg]').forEach(b => b.addEventListener('click', () => { JSON.parse(b.dataset.addPkg).forEach(x => add(x.image, x.qty)); render(); flash(b); }));

  // category tabs follow the scroll
  const tabs = [...document.querySelectorAll('.tabs a')];
  if (tabs.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) tabs.forEach(t => t.classList.toggle('on', t.getAttribute('href') === '#' + en.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
    tabs.forEach(t => { const s = document.querySelector(t.getAttribute('href')); if (s) io.observe(s); });
  }

  // forms
  document.querySelectorAll('form[data-web3]').forEach(form => {
    const status = form.querySelector('.status'), submit = form.querySelector('[type=submit]');
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      let bad = null;
      form.querySelectorAll('[required]').forEach(f => { const ok = f.value.trim() && f.checkValidity(); f.setAttribute('aria-invalid', String(!ok)); if (!ok && !bad) bad = f; });
      if (bad) { status.className = 'status err'; status.textContent = bad.type === 'email' ? 'Enter a valid email address.' : 'Fill in the highlighted fields.'; bad.focus(); return; }
      if (form.hasAttribute('data-rentals')) {
        if (!cart.size) { status.className = 'status err'; status.textContent = 'Add at least one package or piece of gear first.'; return; }
        form.querySelector('[name=gear]').value = [...cart.values()].map(v => `${v.name} x${v.qty} (${money(v.rate * v.qty)})`).join('; ');
      }
      submit.disabled = true; status.className = 'status'; status.textContent = 'Sending…';
      try {
        const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || j.success === false) throw new Error(j.message || 'failed');
        form.reset(); cart.clear(); render();
        status.className = 'status ok'; status.textContent = form.dataset.ok;
      } catch {
        status.className = 'status err'; status.innerHTML = 'It didn’t send. Email <a href="mailto:oteo@djoteo.com">oteo@djoteo.com</a> instead.';
      } finally { submit.disabled = false; }
    });
  });
})();
