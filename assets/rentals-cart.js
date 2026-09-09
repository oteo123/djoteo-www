/* OTEO rentals cart.
 *
 * Flow as it actually runs: pick a night -> add gear -> send the request ->
 * Alec confirms by email -> the 50% deposit is arranged then. Nothing is
 * charged on this page and no card is collected, so no copy here may suggest
 * otherwise.
 *
 * The original design ("leave a card on file, Alec approves, then the deposit
 * is charged") needed a Stripe checkout at /api/request-booking plus somewhere
 * to store the booking. Neither was ever built — functions/ only contained
 * availability.js — so every live rental request failed with a raw JS
 * exception until 2026-08-19. Building real card-on-file checkout is Alec's
 * decision (Stripe keys, storing customer cards); until he makes it, requests
 * go out over Web3Forms exactly like /booking and /contact.
 *
 * Availability is re-fetched from /api/availability every time the date
 * changes, so the cart cannot offer a 3rd Euphonia when Alec owns 2.
 */
(() => {
  'use strict';

  /* Same key and endpoint /booking and /contact post to — inquiries land in
     oteo@djoteo.com. */
  const WEB3FORMS_ACCESS_KEY = '0ea77eca-edf8-4b40-912e-c36a3dac6de7';
  const grid = document.querySelector('.rentals-catalog');
  if (!grid) return;

  const money = (n) => `$${n.toLocaleString('en-US')}`;
  const todayPlus = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    // Build the date from LOCAL parts. toISOString() is UTC, so any evening
    // after ~8pm Eastern the UTC date is already tomorrow and the picker
    // silently demanded three days' notice while the page promises 48 hours —
    // a customer booking Friday night for Sunday was told no.
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const state = {
    date: '',
    lines: new Map(),     // image -> qty
    remaining: null,      // image -> units free on the chosen date
    blackout: false,
    busy: false,
  };

  const cards = [...document.querySelectorAll('.gear-card[data-image]')];
  const catalogue = new Map(
    cards.map((c) => [c.dataset.image, {
      image: c.dataset.image,
      name: c.dataset.name,
      rate: Number(c.dataset.rate || 0),
      owned: Number(c.dataset.qty || 1),
      card: c,
    }])
  );

  /* ---------- cart panel ---------- */
  const panel = document.createElement('aside');
  panel.className = 'cart-panel';
  panel.setAttribute('aria-label', 'Rental cart');
  panel.hidden = true;
  panel.innerHTML = `
    <button class="cart-close" type="button" aria-label="Close cart"></button>
    <h2 class="cart-title">Your rental</h2>
    <label class="cart-field cart-field-date"><span>Night needed</span>
      <input type="date" class="cart-date" min="${todayPlus(2)}" required readonly></label>
    <p class="cart-note cart-avail" role="status"></p>
    <ul class="cart-lines"></ul>
    <div class="cart-totals"></div>
    <form class="cart-form" novalidate>
      <label class="cart-field"><span>Name</span><input name="name" required autocomplete="name"></label>
      <label class="cart-field"><span>Email</span><input name="email" type="email" required autocomplete="email"></label>
      <label class="cart-field"><span>Phone</span><input name="phone" autocomplete="tel"></label>
      <label class="cart-field"><span>Venue / address</span><input name="venue"></label>
      <label class="cart-field"><span>Anything else?</span><textarea name="notes" rows="2"></textarea></label>
      <label class="cart-agree"><input type="checkbox" name="agree" required>
        <span class="cart-agree-text"></span></label>
      <button class="btn btn-primary cart-submit" type="submit">Request this night</button>
      <p class="cart-note cart-msg" role="alert"></p>
      <p class="cart-fineprint">This is a request &mdash; <strong>no card is taken here</strong>.
        OTEO confirms availability and the price by email, then the 50% deposit is
        arranged. Balance on delivery.</p>
    </form>`;
  document.body.appendChild(panel);

  // Tapping outside the panel is how most people expect to dismiss a drawer.
  const scrim = document.createElement('div');
  scrim.className = 'cart-scrim';
  document.body.appendChild(scrim);

  const bar = document.createElement('button');
  bar.type = 'button';
  bar.className = 'cart-bar';
  bar.hidden = true;
  document.body.appendChild(bar);

  const el = {
    date: panel.querySelector('.cart-date'),
    avail: panel.querySelector('.cart-avail'),
    lines: panel.querySelector('.cart-lines'),
    totals: panel.querySelector('.cart-totals'),
    form: panel.querySelector('.cart-form'),
    msg: panel.querySelector('.cart-msg'),
    submit: panel.querySelector('.cart-submit'),
    agree: panel.querySelector('input[name="agree"]'),
    agreeText: panel.querySelector('.cart-agree-text'),
  };

  // The consent line is built from the same gear.json the page renders, so what
  // the customer agrees to can never drift from the published terms.
  let terms = null;
  let minOrder = 0;
  fetch('/data/gear.json')
    .then((r) => r.json())
    .then((g) => {
      terms = g.terms || {};
      // "on this card" was written for the card-on-file checkout that never
      // shipped. No card is taken on this page, so the wording says when the
      // hold applies instead of pointing at a card the customer never gave.
      const hold = terms.security_hold ? `a refundable $${terms.security_hold} security hold applies for the rental period, ` : '';
      if (terms.minimum_order) minOrder = Number(terms.minimum_order);
      el.agreeText.textContent =
        `I have read the rental terms on this page. I understand ${hold}I am responsible for loss or damage at full replacement cost, and that returning late is charged as another night.`;
    })
    .catch(() => {
      el.agreeText.textContent = 'I have read and agree to the rental terms on this page.';
    });

  /* ---------- angle thumbnails: swap the main image ---------- */
  for (const strip of document.querySelectorAll('.gear-thumbs')) {
    const card = strip.closest('.gear-card');
    const main = card && card.querySelector('.gear-img img');
    if (!main) continue;
    strip.addEventListener('click', (e) => {
      const btn = e.target.closest('.gear-thumb');
      if (!btn) return;
      main.src = btn.dataset.src;
      main.loading = 'eager';
      for (const b of strip.querySelectorAll('.gear-thumb')) b.classList.toggle('is-active', b === btn);
    });
  }

  /* ---------- date bar: pick the night BEFORE shopping ----------
     The date field used to live inside the cart panel, so a customer added
     gear blind and only discovered a conflict at the end. Choosing the night
     first turns every card into a real yes/no for that date. */
  const dateBar = document.createElement('div');
  dateBar.className = 'date-bar';
  const dbLabel = document.createElement('label');
  dbLabel.className = 'date-bar-label';
  dbLabel.setAttribute('for', 'oteo-date');
  dbLabel.textContent = 'What night do you need it?';
  const dbInput = document.createElement('input');
  dbInput.type = 'date';
  dbInput.id = 'oteo-date';
  dbInput.className = 'date-bar-input';
  dbInput.min = todayPlus(2);
  const dbStatus = document.createElement('p');
  dbStatus.className = 'date-bar-status';
  dbStatus.setAttribute('role', 'status');
  dbStatus.textContent = 'Pick a night to see what’s free.';
  dateBar.append(dbLabel, dbInput, dbStatus);

  const catalogSection = document.querySelector('.rentals-catalog .wrap') || grid;
  catalogSection.insertBefore(dateBar, catalogSection.firstChild);

  /* ---------- category jump bar ----------
     The catalogue is 11,689px — 17.6 phone screens — across eight sections,
     and none of them had an id or a link. Someone who came to rent a speaker
     had to scroll past 5,100px of mixers and players to find one. The bar
     sticks under the header so it is still there at screen 12, and scrolls
     sideways on a phone rather than wrapping into three rows.
     Built from the headings actually present, so adding or removing a
     category in the HTML updates this automatically. */
  const cats = [...document.querySelectorAll('.gear-cat')];
  if (cats.length > 2) {
    const jump = document.createElement('nav');
    jump.className = 'cat-jump';
    jump.setAttribute('aria-label', 'Jump to a category');
    cats.forEach((h) => {
      const label = (h.textContent || '').trim();
      if (!label) return;
      if (!h.id) {
        h.id = 'cat-' + label.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      const a = document.createElement('a');
      a.className = 'cat-jump-link';
      a.href = '#' + h.id;
      a.textContent = label;
      jump.appendChild(a);
    });
    dateBar.insertAdjacentElement('afterend', jump);

    // Mark the section you are actually in, so the bar says where you are as
    // well as where you can go. One observer, one entry handler — the first
    // version of this nested an observer inside a ternary on `.observe`, which
    // was unreadable and would have silently done nothing on a miss.
    if ('IntersectionObserver' in window) {
      const linkFor = (id) => jump.querySelector('a[href="#' + id + '"]');
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const link = linkFor(entry.target.id);
          if (link) link.classList.toggle('is-here', entry.isIntersecting);
        });
      }, { rootMargin: '-18% 0px -72% 0px' });
      cats.forEach((h) => spy.observe(h));
    }
  }

  // the two date inputs stay in lockstep
  dbInput.addEventListener('change', () => {
    state.date = dbInput.value;
    el.date.value = dbInput.value;
    loadAvailability();
  });

  /* ---------- add buttons ---------- */
  for (const item of catalogue.values()) {
    if (!item.rate) continue; // bundled items (receiver) are not sold separately
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gear-add';
    btn.dataset.image = item.image;
    btn.textContent = 'Add';
    item.card.querySelector('figcaption').appendChild(btn);
    btn.addEventListener('click', () => addLine(item.image));
  }

  // "Add this package" — adds every line of a rig at once, respecting stock.
  for (const btn of document.querySelectorAll('.pkg-add')) {
    btn.addEventListener('click', () => {
      let refs;
      try {
        refs = JSON.parse(btn.dataset.items || '[]');
      } catch { return; }
      const short = [];
      for (const ref of refs) {
        const item = catalogue.get(ref.image);
        if (!item) continue;
        const free = freeFor(ref.image);
        const have = state.lines.get(ref.image) || 0;
        const want = Math.min(ref.qty, Math.max(0, free - have));
        if (want > 0) state.lines.set(ref.image, have + want);
        if (want < ref.qty) short.push(item.name);
      }
      render();
      pulse();
      if (short.length) flash(`Added what's free — ${short.join(', ')} is limited that night.`);
    });
  }

  function freeFor(image) {
    const owned = catalogue.get(image).owned;
    return state.remaining ? Math.min(owned, state.remaining[image] ?? owned) : owned;
  }

  function addLine(image) {
    const have = state.lines.get(image) || 0;
    const free = freeFor(image);
    if (state.blackout) return flash('That night is unavailable — pick another date.');
    if (have + 1 > free) {
      return flash(free === 0
        ? `${catalogue.get(image).name} is fully booked that night.`
        : `Only ${free} × ${catalogue.get(image).name} available.`);
    }
    state.lines.set(image, have + 1);
    render();
    pulse();   // confirm in the bottom bar; do NOT cover the gear
  }

  function setQty(image, qty) {
    if (qty <= 0) state.lines.delete(image);
    else state.lines.set(image, Math.min(qty, freeFor(image)));
    render();
  }

  function totals() {
    let subtotal = 0;
    for (const [image, qty] of state.lines) subtotal += catalogue.get(image).rate * qty;
    return { subtotal, deposit: Math.round(subtotal * 0.5) };
  }

  function render() {
    el.lines.innerHTML = '';
    for (const [image, qty] of state.lines) {
      const item = catalogue.get(image);
      // Built with DOM nodes rather than innerHTML: item names come from
      // gear.json, and interpolating any data into markup is how an "&" in a
      // product name becomes a rendering bug — or worse, an injection point.
      const li = document.createElement('li');
      li.className = 'cart-line';
      const nameEl = document.createElement('span');
      nameEl.className = 'cart-line-name';
      nameEl.textContent = item.name;
      const qtyEl = document.createElement('span');
      qtyEl.className = 'cart-line-qty';
      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      minus.setAttribute('aria-label', `One fewer ${item.name}`);
      const count = document.createElement('b');
      count.textContent = String(qty);
      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.setAttribute('aria-label', `One more ${item.name}`);
      qtyEl.append(minus, count, plus);
      const costEl = document.createElement('span');
      costEl.className = 'cart-line-cost';
      costEl.textContent = money(item.rate * qty);
      li.append(nameEl, qtyEl, costEl);
      minus.addEventListener('click', () => setQty(image, qty - 1));
      plus.addEventListener('click', () => setQty(image, qty + 1));
      el.lines.appendChild(li);
    }

    const { subtotal, deposit } = totals();
    el.totals.innerHTML = state.lines.size
      ? `<div class="cart-row"><span>Subtotal (per night)</span><b>${money(subtotal)}</b></div>
         <div class="cart-row cart-row-key"><span>50% deposit to book</span><b>${money(deposit)}</b></div>
         <div class="cart-row cart-row-dim"><span>Balance on delivery</span><span>${money(subtotal - deposit)}</span></div>`
      : `<p class="cart-empty">${state.date ? 'Nothing added yet.' : 'Pick your night above, then add gear.'}</p>`;

    bar.hidden = state.lines.size === 0;
    bar.textContent = state.lines.size
      ? (() => {
          const n = [...state.lines.values()].reduce((a, b) => a + b, 0);
          return `${n} ${n === 1 ? 'piece' : 'pieces'} · ${money(subtotal)} — review`;
        })()
      : '';

    for (const item of catalogue.values()) {
      const btn = item.card.querySelector('.gear-add');
      if (!btn) continue;
      const free = freeFor(item.image);
      const used = state.lines.get(item.image) || 0;
      const out = state.blackout || used >= free;
      btn.disabled = out;
      btn.textContent = state.blackout ? 'Unavailable' : (free === 0 ? 'Booked' : (used ? `Added ×${used}` : 'Add'));

      // Say plainly what is free on the chosen night, on the card itself.
      let tag = item.card.querySelector('.gear-avail');
      if (!tag) {
        tag = document.createElement('span');
        tag.className = 'gear-avail';
        item.card.querySelector('figcaption').insertBefore(tag, btn);
      }
      item.card.classList.toggle('is-booked', !state.blackout && free === 0);
      if (!state.date) {
        tag.textContent = '';
        tag.className = 'gear-avail';
      } else if (state.blackout) {
        tag.textContent = 'Not available that night';
        tag.className = 'gear-avail is-out';
      } else if (free === 0) {
        tag.textContent = 'Booked that night';
        tag.className = 'gear-avail is-out';
      } else if (free < item.owned) {
        tag.textContent = `Only ${free} of ${item.owned} free`;
        tag.className = 'gear-avail is-low';
      } else {
        tag.textContent = item.owned > 1 ? `All ${item.owned} available` : 'Available';
        tag.className = 'gear-avail is-ok';
      }
    }
  }

  async function loadAvailability() {
    state.remaining = null;
    state.blackout = false;
    if (!state.date) {
      el.avail.textContent = 'Pick a night to check availability.';
      if (dbStatus) { dbStatus.textContent = 'Pick a night to see what\u2019s free.'; dbStatus.className = 'date-bar-status'; }
      render(); return;
    }
    el.avail.textContent = 'Checking that night\u2026';
    if (dbStatus) { dbStatus.textContent = 'Checking that night\u2026'; dbStatus.className = 'date-bar-status'; }
    try {
      const res = await fetch(`/api/availability?date=${encodeURIComponent(state.date)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'could not check availability');
      state.remaining = data.remaining;
      state.blackout = !!data.blackout;
      el.avail.textContent = state.blackout
        ? 'OTEO is not available that night — please pick another date.'
        : 'All gear shows free for that night — OTEO confirms when he approves.';
      if (dbStatus) {
        const free = Object.values(state.remaining || {}).filter((n) => n > 0).length;
        dbStatus.textContent = state.blackout
          ? 'OTEO is booked that night — try another date.'
          : `${free} of ${catalogue.size} pieces free that night — nothing is charged until OTEO approves.`;
        dbStatus.className = 'date-bar-status' + (state.blackout ? ' is-out' : ' is-ok');
      }
      // trim any line that no longer fits
      for (const [image, qty] of [...state.lines]) {
        const free = freeFor(image);
        if (qty > free) setQty(image, free);
      }
    } catch (err) {
      el.avail.textContent = `Could not check that night (${err.message}). You can still send the request.`;
      if (dbStatus) { dbStatus.textContent = 'Could not check that night — you can still send the request.'; dbStatus.className = 'date-bar-status'; }
    }
    render();
  }

  // A pending clear-timer from an earlier flash must never wipe a LATER
  // message. It could: flash "Minimum order is $150" -> customer adds an item
  // and submits within 4s -> the success line is written, then the old timer
  // fires and blanks it. The form is already hidden by then, so the customer
  // is left staring at nothing, unsure whether the request went out.
  let flashTimer = null;
  function flash(message) {
    el.msg.textContent = message;
    el.msg.classList.add('is-warn');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { el.msg.textContent = ''; el.msg.classList.remove('is-warn'); }, 4000);
    // Show it where the customer is looking rather than covering the catalogue.
    if (panel.hidden) {
      toast(message);
    }
  }

  // brief, non-blocking confirmation
  let toastEl = null;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'cart-toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add('is-up');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('is-up'), 3200);
  }

  function pulse() {
    bar.classList.remove('is-pulse');
    void bar.offsetWidth;          // restart the animation
    bar.classList.add('is-pulse');
  }

  const open = () => { panel.hidden = false; document.body.classList.add('cart-open'); };
  const close = () => { panel.hidden = true; document.body.classList.remove('cart-open'); };
  panel.querySelector('.cart-close').addEventListener('click', close);
  scrim.addEventListener('click', close);
  bar.addEventListener('click', open);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(); });
  el.date.addEventListener('change', () => {
    state.date = el.date.value;
    if (dbInput) dbInput.value = el.date.value;
    loadAvailability();
  });

  el.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.busy) return;
    el.msg.classList.remove('is-warn');
    if (!state.date) return flash('Pick the night you need the gear.');
    if (!state.lines.size) return flash('Add at least one piece of gear.');
    const fd = new FormData(el.form);
    if (!fd.get('name') || !fd.get('email')) return flash('Name and email are required.');
    // The form carries novalidate (we write our own messages), so the browser
    // never enforces type="email" — without this, "asdf" is accepted and the
    // lead arrives with no way to reply to it.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(fd.get('email')).trim())) {
      return flash('That email address does not look right — please check it.');
    }
    if (!el.agree.checked) return flash('Please confirm you have read the rental terms.');
    if (minOrder && totals().subtotal < minOrder) {
      return flash(`Minimum order is $${minOrder} — add a little more and we'll bring it out.`);
    }

    state.busy = true;
    el.submit.disabled = true;
    clearTimeout(flashTimer);
    el.msg.textContent = 'Sending your request…';

    // This used to POST /api/request-booking and redirect to a Stripe checkout
    // URL. That endpoint was never built — functions/ only ever contained
    // availability.js — so the live site answered 405 and the customer was
    // shown the raw exception "Failed to execute 'json' on 'Response'". Every
    // rental request made on djoteo.com died there.
    //
    // Card-on-file checkout needs Stripe keys and a booking store, neither of
    // which exists here — that is Alec's call, not something to invent. So the
    // request goes out the way /booking and /contact already send theirs:
    // Web3Forms, straight to oteo@djoteo.com. Alec gets the lead with the full
    // gear list instead of losing it, and nothing claims a card was taken.
    const customer = Object.fromEntries(fd.entries());
    const gearLines = [...state.lines].map(([image, qty]) => {
      const item = catalogue.get(image);
      return `${qty} x ${item ? item.name : image} — $${(item ? item.rate : 0) * qty}`;
    });
    const sums = totals();

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Gear rental request — ${state.date}`,
          from_name: customer.name || 'djoteo.com rentals',
          name: customer.name,
          email: customer.email,
          phone: customer.phone || '',
          venue: customer.venue || '',
          night_needed: state.date,
          gear: gearLines.join('\n'),
          subtotal: `$${sums.subtotal}`,
          deposit_due_on_confirmation: `$${sums.deposit}`,
          notes: customer.notes || '',
          agreed_to_rental_terms: 'yes',
        }),
      });
      // Web3Forms answers 200 with {"success": false} when it rejects a
      // submission, so res.ok alone would report a dropped lead as "Request
      // sent". /booking already reads data.success — match it here.
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `form service responded ${res.status}`);
      }
      el.form.hidden = true;
      clearTimeout(flashTimer);
      el.msg.classList.remove('is-warn');
      // Says only what is true: the request was sent. No card was collected,
      // so it must never suggest one is on file or that a deposit is pending.
      el.msg.textContent =
        `Request sent for ${state.date}. Nothing has been charged — OTEO will confirm the gear and the date by email, and the 50% deposit is arranged then.`;
    } catch (err) {
      // Never surface a raw exception to a customer, and never claim the
      // request was sent when it was not — give them a path that works.
      el.msg.classList.add('is-warn');
      el.msg.textContent =
        'That did not send — please email oteo@djoteo.com with your date and the gear you need, and OTEO will pick it up from there.';
      state.busy = false;
      el.submit.disabled = false;
    }
  });

  render();
})();
