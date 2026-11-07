(() => {
  "use strict";
  const WEB3FORMS_ACCESS_KEY = "0ea77eca-edf8-4b40-912e-c36a3dac6de7";
  const grid = document.querySelector(".rentals-catalog");
  if (!grid) return;
  const money = (n) => `$${n.toLocaleString("en-US")}`;
  const niceDate = (iso) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return iso || "";
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };
  const todayPlus = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const state = {
    date: "",
    lines: new Map(),
    remaining: null,
    blackout: false,
    busy: false,
    sent: false
  };
  const cards = [...document.querySelectorAll(".gear-card[data-image]")];
  const catalogue = new Map(
    cards.map((c) => [c.dataset.image, {
      image: c.dataset.image,
      name: c.dataset.name,
      rate: Number(c.dataset.rate || 0),
      owned: Number(c.dataset.qty || 1),
      card: c
    }])
  );
  const panel = document.createElement("aside");
  panel.className = "cart-panel";
  panel.setAttribute("aria-label", "Rental cart");
  panel.hidden = true;
  panel.innerHTML = `
    <div class="cart-head">
      <h2 class="cart-title">Your rental</h2>
      <button class="cart-close" type="button" aria-label="Close cart"></button>
    </div>
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
      <p class="cart-fineprint">This is a request and <strong>no card is taken here</strong>.
        Oteo confirms availability and the price by email, then the 50% deposit is
        arranged. Balance on delivery.</p>
    </form>`;
  document.body.appendChild(panel);
  const scrim = document.createElement("div");
  scrim.className = "cart-scrim";
  document.body.appendChild(scrim);
  const bar = document.createElement("button");
  bar.type = "button";
  bar.className = "cart-bar";
  bar.hidden = true;
  document.body.appendChild(bar);
  const el = {
    date: panel.querySelector(".cart-date"),
    avail: panel.querySelector(".cart-avail"),
    lines: panel.querySelector(".cart-lines"),
    totals: panel.querySelector(".cart-totals"),
    form: panel.querySelector(".cart-form"),
    msg: panel.querySelector(".cart-msg"),
    submit: panel.querySelector(".cart-submit"),
    agree: panel.querySelector('input[name="agree"]'),
    agreeText: panel.querySelector(".cart-agree-text")
  };
  let terms = null;
  let minOrder = 0;
  fetch("/data/gear.json").then((r) => r.json()).then((g) => {
    terms = g.terms || {};
    const hold = terms.security_hold ? `a refundable $${terms.security_hold} security hold applies for the rental period, ` : "";
    if (terms.minimum_order) minOrder = Number(terms.minimum_order);
    el.agreeText.textContent = `I have read the rental terms on this page. I understand ${hold}I am responsible for loss or damage at full replacement cost, and that returning late is charged as another night.`;
  }).catch(() => {
    el.agreeText.textContent = "I have read and agree to the rental terms on this page.";
  });
  for (const strip of document.querySelectorAll(".gear-thumbs")) {
    const card = strip.closest(".gear-card");
    const main = card && card.querySelector(".gear-img img");
    if (!main) continue;
    strip.addEventListener("click", (e) => {
      const btn = e.target.closest(".gear-thumb");
      if (!btn) return;
      main.src = btn.dataset.src;
      main.loading = "eager";
      markActive(strip, btn);
    });
    markActive(strip, strip.querySelector(".gear-thumb.is-active") || strip.querySelector(".gear-thumb"));
  }
  function markActive(strip, btn) {
    for (const b of strip.querySelectorAll(".gear-thumb")) {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.disabled = on;
      b.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }
  const dateBar = document.createElement("div");
  dateBar.className = "date-bar";
  const dbLabel = document.createElement("label");
  dbLabel.className = "date-bar-label";
  dbLabel.setAttribute("for", "oteo-date");
  dbLabel.textContent = "What night do you need it?";
  const dbInput = document.createElement("input");
  dbInput.type = "date";
  dbInput.id = "oteo-date";
  dbInput.className = "date-bar-input";
  dbInput.min = todayPlus(2);
  const dbStatus = document.createElement("p");
  dbStatus.className = "date-bar-status";
  dbStatus.setAttribute("role", "status");
  dbStatus.textContent = "Delivered before the night, collected the day after.";
  dateBar.append(dbLabel, dbInput, dbStatus);
  const catalogSection = document.querySelector(".rentals-catalog .wrap") || grid;
  catalogSection.insertBefore(dateBar, catalogSection.firstChild);
  const cats = [...document.querySelectorAll(".gear-cat")];
  if (cats.length > 2) {
    const jump = document.createElement("nav");
    jump.className = "cat-jump";
    jump.setAttribute("aria-label", "Jump to a category");
    cats.forEach((h) => {
      const label = (h.textContent || "").trim();
      if (!label) return;
      if (!h.id) {
        h.id = "cat-" + label.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      const a = document.createElement("a");
      a.className = "cat-jump-link";
      a.href = "#" + h.id;
      a.textContent = label;
      jump.appendChild(a);
    });
    dateBar.insertAdjacentElement("afterend", jump);
    if ("IntersectionObserver" in window) {
      const linkFor = (id) => jump.querySelector('a[href="#' + id + '"]');
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const link = linkFor(entry.target.id);
          if (link) link.classList.toggle("is-here", entry.isIntersecting);
        });
      }, { rootMargin: "-18% 0px -72% 0px" });
      cats.forEach((h) => spy.observe(h));
    }
  }
  dbInput.addEventListener("change", () => {
    state.date = dbInput.value;
    el.date.value = dbInput.value;
    loadAvailability();
  });
  for (const item of catalogue.values()) {
    if (!item.rate) continue;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gear-add";
    btn.dataset.image = item.image;
    btn.textContent = "Add";
    item.card.querySelector("figcaption").appendChild(btn);
    btn.addEventListener("click", () => addLine(item.image));
  }
  for (const btn of document.querySelectorAll(".pkg-add")) {
    btn.addEventListener("click", () => {
      if (state.sent) return flash(SENT_MSG);
      let refs;
      try {
        refs = JSON.parse(btn.dataset.items || "[]");
      } catch {
        return;
      }
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
      if (short.length) flash(`Added what is free. ${short.join(", ")} is limited that night.`);
    });
  }
  function freeFor(image) {
    const owned = catalogue.get(image).owned;
    return state.remaining ? Math.min(owned, state.remaining[image] ?? owned) : owned;
  }
  const SENT_MSG = "Your request has already been sent. Email oteo@djoteo.com to change it.";
  function addLine(image) {
    if (state.sent) return flash(SENT_MSG);
    const have = state.lines.get(image) || 0;
    const free = freeFor(image);
    if (state.blackout) return flash("That night is unavailable. Pick another date.");
    if (have + 1 > free) {
      return flash(free === 0 ? `${catalogue.get(image).name} is fully booked that night.` : `Only ${free} of ${catalogue.get(image).name} available that night.`);
    }
    state.lines.set(image, have + 1);
    render();
    pulse();
  }
  function setQty(image, qty) {
    if (state.sent) return;
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
    el.lines.innerHTML = "";
    for (const [image, qty] of state.lines) {
      const item = catalogue.get(image);
      const li = document.createElement("li");
      li.className = "cart-line";
      const nameEl = document.createElement("span");
      nameEl.className = "cart-line-name";
      nameEl.textContent = item.name;
      const qtyEl = document.createElement("span");
      qtyEl.className = "cart-line-qty";
      const minus = document.createElement("button");
      minus.type = "button";
      minus.textContent = "−";
      minus.setAttribute("aria-label", `One fewer ${item.name}`);
      const count = document.createElement("b");
      count.textContent = String(qty);
      const plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";
      plus.setAttribute("aria-label", `One more ${item.name}`);
      qtyEl.append(minus, count, plus);
      const costEl = document.createElement("span");
      costEl.className = "cart-line-cost";
      costEl.textContent = money(item.rate * qty);
      li.append(nameEl, qtyEl, costEl);
      minus.disabled = plus.disabled = state.sent;
      minus.addEventListener("click", () => setQty(image, qty - 1));
      plus.addEventListener("click", () => setQty(image, qty + 1));
      el.lines.appendChild(li);
    }
    const { subtotal, deposit } = totals();
    el.totals.innerHTML = state.lines.size ? `<div class="cart-row"><span>Subtotal (per night)</span><b>${money(subtotal)}</b></div>
         <div class="cart-row cart-row-key"><span>50% deposit to book</span><b>${money(deposit)}</b></div>
         <div class="cart-row cart-row-dim"><span>Balance on delivery</span><span>${money(subtotal - deposit)}</span></div>` : `<p class="cart-empty">${state.date ? "Nothing added yet." : "Pick your night above, then add gear."}</p>`;
    bar.hidden = state.lines.size === 0;
    bar.textContent = state.lines.size ? (() => {
      const n = [...state.lines.values()].reduce((a, b) => a + b, 0);
      return state.sent ? "Request sent" : `${n} ${n === 1 ? "piece" : "pieces"} · ${money(subtotal)} · Review`;
    })() : "";
    for (const item of catalogue.values()) {
      const btn = item.card.querySelector(".gear-add");
      if (!btn) continue;
      const free = freeFor(item.image);
      const used = state.lines.get(item.image) || 0;
      const out = state.sent || state.blackout || used >= free;
      btn.disabled = out;
      btn.textContent = state.blackout ? "Unavailable" : free === 0 ? "Booked" : used ? item.owned > 1 ? `${used} added` : "Added" : "Add";
      let tag = item.card.querySelector(".gear-avail");
      if (!tag) {
        tag = document.createElement("span");
        tag.className = "gear-avail";
        item.card.querySelector("figcaption").insertBefore(tag, btn);
      }
      item.card.classList.toggle("is-booked", !state.blackout && free === 0);
      if (!state.date) {
        tag.textContent = "";
        tag.className = "gear-avail";
      } else if (state.blackout) {
        tag.textContent = "Not available that night";
        tag.className = "gear-avail is-out";
      } else if (free === 0) {
        tag.textContent = "Booked that night";
        tag.className = "gear-avail is-out";
      } else if (free < item.owned) {
        tag.textContent = `Only ${free} of ${item.owned} free`;
        tag.className = "gear-avail is-low";
      } else {
        tag.textContent = item.owned > 1 ? `All ${item.owned} available` : "Available";
        tag.className = "gear-avail is-ok";
      }
    }
  }
  function loadAvailability() {
    state.remaining = null;
    state.blackout = false;
    if (!state.date) {
      el.avail.textContent = "Delivered before the night, collected the day after.";
      if (dbStatus) {
        dbStatus.textContent = "Delivered before the night, collected the day after.";
        dbStatus.className = "date-bar-status";
      }
      render();
      return;
    }
    el.avail.textContent = "Oteo confirms the gear and the night by email. Nothing is charged until then.";
    if (dbStatus) {
      dbStatus.textContent = "Add what you need. Oteo confirms the gear and the night by email, and nothing is charged until then.";
      dbStatus.className = "date-bar-status is-ok";
    }
    render();
  }
  let flashTimer = null;
  function flash(message) {
    el.msg.textContent = message;
    el.msg.classList.add("is-warn");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      el.msg.textContent = "";
      el.msg.classList.remove("is-warn");
    }, 4e3);
    if (panel.hidden) {
      toast(message);
    }
  }
  let toastEl = null;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "cart-toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("is-up");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove("is-up"), 3200);
  }
  function pulse() {
    bar.classList.remove("is-pulse");
    void bar.offsetWidth;
    bar.classList.add("is-pulse");
  }
  const open = () => {
    panel.hidden = false;
    document.body.classList.add("cart-open");
  };
  const close = () => {
    panel.hidden = true;
    document.body.classList.remove("cart-open");
  };
  panel.querySelector(".cart-close").addEventListener("click", close);
  scrim.addEventListener("click", close);
  bar.addEventListener("click", open);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) close();
  });
  el.date.addEventListener("change", () => {
    state.date = el.date.value;
    if (dbInput) dbInput.value = el.date.value;
    loadAvailability();
  });
  el.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (state.busy) return;
    el.msg.classList.remove("is-warn");
    if (!state.date) return flash("Pick the night first.");
    if (!state.lines.size) return flash("Add at least one piece of gear.");
    const fd = new FormData(el.form);
    if (!fd.get("name") || !fd.get("email")) return flash("Name and email are required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(fd.get("email")).trim())) {
      return flash("That email address does not look right. Please check it.");
    }
    if (!el.agree.checked) return flash("Please confirm you have read the rental terms.");
    if (minOrder && totals().subtotal < minOrder) {
      return flash(`The minimum order is $${minOrder}. Add gear to reach it.`);
    }
    state.busy = true;
    el.submit.disabled = true;
    clearTimeout(flashTimer);
    el.msg.textContent = "Sending your request…";
    const customer = Object.fromEntries(fd.entries());
    const gearLines = [...state.lines].map(([image, qty]) => {
      const item = catalogue.get(image);
      return `${qty} x ${item ? item.name : image} ($${(item ? item.rate : 0) * qty})`;
    });
    const sums = totals();
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Gear rental request for ${niceDate(state.date)}`,
          from_name: customer.name || "djoteo.com rentals",
          name: customer.name,
          email: customer.email,
          phone: customer.phone || "",
          venue: customer.venue || "",
          night_needed: state.date,
          gear: gearLines.join("\n"),
          subtotal: `$${sums.subtotal}`,
          deposit_due_on_confirmation: `$${sums.deposit}`,
          notes: customer.notes || "",
          agreed_to_rental_terms: "yes"
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `form service responded ${res.status}`);
      }
      state.sent = true;
      el.form.classList.add("is-sent");
      render();
      clearTimeout(flashTimer);
      el.msg.classList.remove("is-warn");
      el.msg.textContent = `Request sent for ${niceDate(state.date)}. Nothing has been charged. Oteo will confirm the gear and the date by email, and the 50% deposit is arranged then.`;
    } catch (err) {
      el.msg.classList.add("is-warn");
      el.msg.textContent = "That did not send. Email oteo@djoteo.com with your date and the gear you need, and Oteo will pick it up from there.";
      state.busy = false;
      el.submit.disabled = false;
    }
  });
  render();
})();
