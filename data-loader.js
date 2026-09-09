/**
 * data-loader.js — Drives all OTEO site content from central JSON in /data/
 * Keeps HTML skeletons 100% identical to reference ports (tags, classes, scripts, behaviors, decorative assets unchanged).
 * Populates text, images, lists, modals, etc. at runtime.
 * Include with <script src="data-loader.js" defer></script> in each page.
 * All user information lives here or in the source JSONs. No hard-coded facts in HTML.
 */

(function() {
  'use strict';

  const DATA_BASE = 'data/';

  async function loadJSON(name) {
    try {
      const res = await fetch(DATA_BASE + name);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.warn('[data-loader] Could not fetch ' + name + ', falling back to inline if present.', e);
      // Fallback: look for inline script#data- + name
      const inline = document.getElementById('data-' + name.replace('.json',''));
      if (inline) {
        try { return JSON.parse(inline.textContent); } catch (_) {}
      }
      return null;
    }
  }

  function setText(selector, text, root = document) {
    const el = root.querySelector(selector);
    if (el) el.textContent = text;
  }

  function setHTML(selector, html, root = document) {
    const el = root.querySelector(selector);
    if (el) el.innerHTML = html;
  }

  function setAttr(selector, attr, value, root = document) {
    const el = root.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  }

  function populateList(selector, items, templateFn, root = document) {
    const container = root.querySelector(selector);
    if (!container) return;
    container.innerHTML = '';
    items.forEach((item, i) => {
      const node = templateFn(item, i);
      if (node) container.appendChild(node);
    });
  }

  // Generic: fill elements that have data-key="path.to.value"
  function hydrateByDataKeys(root = document, data) {
    root.querySelectorAll('[data-key]').forEach(el => {
      const key = el.getAttribute('data-key');
      let val = key.split('.').reduce((o, k) => o && o[k], data);
      if (val == null) return;
      if (el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.tagName === 'SOURCE') {
        if (typeof val === 'string') el.src = val;
        else if (val.src) el.src = val.src;
      } else if (el.tagName === 'A' && el.hasAttribute('data-href-key')) {
        el.href = val;
      } else {
        el.textContent = Array.isArray(val) ? val.join(' • ') : val;
      }
    });
  }

  async function init() {
    const page = document.body.getAttribute('data-page') || location.pathname.split('/').pop().replace('.html','') || 'index';

    // Common meta (if data/meta.json exists)
    const meta = await loadJSON('meta.json');
    if (meta) {
      document.title = meta.title || document.title;
      // hydrate common elements
      hydrateByDataKeys(document, { meta });
    }

    if (page === 'booking' || page === 'services') {
      const servicesData = await loadJSON('services.json');
      if (servicesData && servicesData.services) {
        // Map to Blue Marine journeys (3 currents in the ref structure)
        // Current 1: Music + Ghost
        const musicGhost = servicesData.services.find(s => s.id.includes('music') || s.id.includes('ghost'));
        if (musicGhost) {
          setText('.js-journey-title', musicGhost.title || 'Music Production & Ghost Production');
          // populate first modal/spotlight if present
          const modal = document.querySelector('#modal--sustainable-fisheries, .js-project-modal');
          if (modal) {
            setText('h2', musicGhost.title, modal);
            setText('p', musicGhost.description, modal);
            const stats = modal.querySelector('.gear, [class*="stats"]');
            if (stats && musicGhost.stats) stats.innerHTML = musicGhost.stats.map(s => `<div>${s}</div>`).join('');
          }
        }
        // Similar for other groups (Engineering+Submissions, Direction+Rentals)
        // The interactive "Dive In" and depth/HUD remain exactly as in the ref; content is data-driven.
        // Full list of 7 services can be injected into a "Key Statistics" or expanded modal section.
        const allServicesList = document.querySelector('.all-services, [data-populate="services"]');
        if (allServicesList) {
          populateList(allServicesList, servicesData.services, (svc) => {
            const div = document.createElement('div');
            div.innerHTML = `<strong>${svc.title}</strong><p>${svc.description}</p>`;
            return div;
          });
        }
        // Inquiry
        if (servicesData.inquiry) {
          setAttr('a[href*="mailto"]', 'href', `mailto:${servicesData.inquiry.email}?subject=${encodeURIComponent(servicesData.inquiry.subject)}`);
        }
        hydrateByDataKeys(document, servicesData);
      }
    }

    if (page === 'residencies') {
      const resData = await loadJSON('residencies.json');
      if (resData && resData.residencies) {
        // For Roku-style structure: populate the PROJECTS / spine / screen with video-focused residencies.
        // The 3D room, monumental type, spine, canvas, projects list remain identical to ref.
        // Each "project" card now represents a residency with video experience.
        const projectsContainer = document.querySelector('.projects, [data-populate="projects"], .js-projects');
        if (projectsContainer) {
          populateList(projectsContainer, resData.residencies, (r) => {
            const a = document.createElement('a');
            a.href = r.links ? r.links.book : '#';
            a.innerHTML = `
              <div class="thumb"><img src="${r.media.poster}" alt="${r.title}"></div>
              <div class="alt">${r.title} — ${r.nights}</div>
            `;
            // Attach video data for the cinema screen / player
            a.dataset.video = JSON.stringify(r.media);
            return a;
          });
        }
        // Spine / date compartments (use events data too)
        const spine = document.querySelector('.spine, [data-populate="spine"]');
        if (spine && resData.residencies) {
          // Simple population; real ref may have more complex vertical slats.
          spine.innerHTML = resData.residencies.map(r => `<div class="slat">${r.nights.split('•')[0].trim()} · ${r.title.split(' ')[0]}</div>`).join('');
        }
        // Main screen / hero video area
        const screen = document.querySelector('.screen, #cinema, [data-populate="screen"]');
        if (screen) {
          const first = resData.residencies[0];
          if (first && first.media) {
            screen.innerHTML = `<img src="${first.media.poster}" alt="${first.title}" style="width:100%;height:100%;object-fit:cover;">`;
            // If video available in real deploy: replace with <video src="..." poster="..." loop muted playsinline>
          }
        }
        hydrateByDataKeys(document, resData);
      }
      // Also load events for any calendar tie-in on the page
      const ev = await loadJSON('events.json');
      if (ev) hydrateByDataKeys(document, ev);
    }

    if (page === 'index' || page === 'landing') {
      // Landing (Syrup) already has modal_cards_content_map.json as data source.
      // Ensure the 40+ cards are all present and populated.
      // If the page uses JS to render modals from the map, nothing to do.
      // Otherwise, the map is the single source — do not duplicate content in HTML.
      const cardsData = await loadJSON('modal_cards_content_map.json'); // or inline
      if (cardsData && cardsData.cards) {
        // Example: if there is a releases grid or ticker driven by data
        console.log('[data-loader] Landing releases data loaded:', Object.keys(cardsData.cards).length, 'cards');
        // Hydrate any explicit data-key elements or known release sections.
        hydrateByDataKeys(document, cardsData);
      }
      // Nav / tabs already point to the correct pages (Residencies tab → video experience in Roku structure).
    }

    if (page === 'calendar' || page === 'agenda') {
      const ev = await loadJSON('events.json');
      if (ev) {
        // Phlntn structure: vertical spine + grid. Populate from recurring + note.
        const spine = document.querySelector('.spine, .date-spine');
        if (spine) {
          spine.innerHTML = (ev.recurring || []).map(r => `<div>${r.nights} — ${r.venue}</div>`).join('');
        }
        const note = document.querySelector('.sync-note, [data-populate="sync"]');
        if (note && ev.sync_note) note.textContent = ev.sync_note;
        hydrateByDataKeys(document, ev);
      }
    }

    // FOOWR / atmos page would load label-specific data if we add data/foowr.json.
    // Same pattern: keep exact ref HTML, populate from data.

    console.log('[data-loader] Content hydrated from data/ for page:', page, '. Structure remains identical to refs.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging / build tools
  window.OTEO_DATA_LOADER = { loadJSON, hydrateByDataKeys };
})();