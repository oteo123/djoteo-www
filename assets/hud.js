(function() {
  // 1. PATH PRESERVE & DETECT BASE
  const hasBase = document.querySelector('base') !== null;
  const prefix = hasBase ? '../../' : '';

  // Get current active page filename
  const path = window.location.pathname;
  // Get the last path segment (filtering out empty segments)
  const parts = path.split('/').filter(Boolean);
  let segment = parts.pop() || '';
  // Remove file extension if present
  segment = segment.replace(/\.html$/, '');

  // Helper to check active status
  const isActive = (targetName) => {
    if (targetName === 'home') {
      return (segment === '' || segment === 'index' || segment === 'index-oteo') ? 'active' : '';
    }
    if (targetName === 'bookings' && (segment === 'booking' || segment === 'bookings')) {
      return 'active';
    }
    if (segment === targetName) {
      return 'active';
    }
    return '';
  };

  // 2. INJECT SCANLINES & FLICKER CONTAINER
  const scanlines = document.createElement('div');
  scanlines.className = 'hud-scanlines';
  document.body.appendChild(scanlines);

  // 3. GENERATE HUD HEADER
  const header = document.createElement('header');
  header.className = 'hud-header';
  
  header.innerHTML = `
    <a href="/" class="hud-brand">
      OTE<span>O</span>
    </a>
    <nav class="hud-nav">
      <ul>
        <li><a href="/" class="${isActive('home')} js-hud-link" data-text="Home">Home</a></li>
        <li><a href="/residencies" class="${isActive('residencies')} js-hud-link" data-text="Residencies">Residencies</a></li>
        <li><a href="/booking" class="${isActive('bookings')} js-hud-link" data-text="Services">Services</a></li>
        <li><a href="/foowr" class="${isActive('foowr')} js-hud-link" data-text="Label">Label</a></li>
        <li><a href="/calendar" class="${isActive('calendar')} js-hud-link" data-text="Agenda">Agenda</a></li>
        <li><a href="/booking" class="hud-cta js-hud-link" data-text="Book OTEO">Book OTEO</a></li>
      </ul>
    </nav>
    <div class="hud-sysinfo">
      SYS.LOC // <span class="status-ok">ONLINE</span><br>
      <span class="hud-clock">00:00:00.000</span> EST
    </div>
    <button class="hud-burger" aria-label="Toggle Menu">
      <span></span>
      <span></span>
      <span></span>
    </button>
  `;
  document.body.appendChild(header);

  // 4. INJECT FLOATING COORDINATES PANEL
  const coordsPanel = document.createElement('div');
  coordsPanel.className = 'hud-panel-coords';
  coordsPanel.innerHTML = `
    <span class="dot"></span>
    <span>SYS.LOC: ORLANDO, FL // LAT: 28.5383° N | LON: 81.3792° W</span>
  `;
  document.body.appendChild(coordsPanel);

  // 5. RESPONSIVE MOBILE MENU
  const burger = header.querySelector('.hud-burger');
  const nav = header.querySelector('.hud-nav');
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    nav.classList.toggle('open');
  });

  // Close menu on link click
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('open');
      nav.classList.remove('open');
    });
  });

  // 6. SCROLL LISTENER FOR COMPACT HEADER
  const handleScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // 7. REALTIME ticking clock (EST time calculation)
  const clockEl = header.querySelector('.hud-clock');
  const updateClock = () => {
    const now = new Date();
    // Convert to EST (UTC-5) or EDT (UTC-4) depending on daylight savings.
    // For simplicity, we format directly using local client time since Alec resides in Eastern timezone (Orlando).
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    clockEl.textContent = `${hours}:${minutes}:${seconds}.${ms}`;
    requestAnimationFrame(updateClock);
  };
  requestAnimationFrame(updateClock);

  // 8. TEXT SCRAMBLE / DECODER ANIMATION EFFECT
  const scrambleChars = '01X$#@&%?_+=<>!*[]{}|';
  
  const scramble = (el) => {
    const originalText = el.getAttribute('data-text') || el.textContent;
    if (!originalText) return;
    
    let isRunning = el.getAttribute('data-scramble-running') === 'true';
    if (isRunning) return;
    
    el.setAttribute('data-scramble-running', 'true');
    let iteration = 0;
    const interval = setInterval(() => {
      el.textContent = originalText
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          if (index < iteration) {
            return originalText[index];
          }
          return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
        })
        .join('');
      
      if (iteration >= originalText.length) {
        clearInterval(interval);
        el.textContent = originalText;
        el.removeAttribute('data-scramble-running');
      }
      
      iteration += 1/3;
    }, 25);
  };

  // Wire up scramble animation on HUD links
  header.querySelectorAll('.js-hud-link').forEach(link => {
    // Ensure data-text is set
    if (!link.getAttribute('data-text')) {
      link.setAttribute('data-text', link.textContent);
    }
    link.addEventListener('mouseenter', () => scramble(link));
  });

  // Wire up scramble on other scramble-hover items on the page
  const wirePageScramblers = () => {
    document.querySelectorAll('.js-scramble-hover, .js-scramble-text').forEach(item => {
      if (!item.getAttribute('data-text') && !item.getAttribute('data-scramble-text')) {
        item.setAttribute('data-text', item.textContent);
      }
      
      const txt = item.getAttribute('data-text') || item.getAttribute('data-scramble-text') || item.textContent;
      item.setAttribute('data-text', txt);
      
      item.addEventListener('mouseenter', () => scramble(item));
    });
  };

  // Run on load and also periodic checks to catch dynamic contents
  wirePageScramblers();
  setTimeout(wirePageScramblers, 1000);
  setTimeout(wirePageScramblers, 3000);

  // 9. ADD CYBERNETIC CORNERS TO KEY COMPONENT CONTAINERS
  const addCorners = () => {
    // Add corners to residency cards, sections, buttons
    const selectors = [
      '.res-card',
      '.label-figure',
      '.photo img',
      '.svc-row',
      '.sec-title',
      '.btn--cutout',
      '.detail-card',
      '.roots-playlist button',
      '#parallax-titles',
      'h2.sec-title'
    ];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('hud-brackets');
      });
    });
  };
  addCorners();
  setTimeout(addCorners, 1500);

  // 10. DYNAMIC CSS CORRECTION TO PREVENT HEADER OVERLAP
  const style = document.createElement('style');
  style.innerHTML = `
    /* Prevent fixed HUD header from clipping top content */
    body {
      padding-top: 70px !important;
    }
    /* Disable padding correction for pages that use Locomotive absolute overlays */
    html.has-scroll-smooth body,
    .page-main,
    .main-scroll {
      padding-top: 0 !important;
    }
    /* Add extra space inside sections so text is readable */
    .section-header,
    .hero {
      margin-top: 0 !important;
    }
    /* Adjust specific elements in Residencies/Agenda refs */
    .ui-navi, #nav {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  // 11. INJECT VISOR CORNER BRACKETS & TELEMETRY
  const visorTL = document.createElement('div');
  visorTL.className = 'hud-corner-bracket top-left';
  const visorTR = document.createElement('div');
  visorTR.className = 'hud-corner-bracket top-right';
  const visorBL = document.createElement('div');
  visorBL.className = 'hud-corner-bracket bottom-left';
  const visorBR = document.createElement('div');
  visorBR.className = 'hud-corner-bracket bottom-right';
  
  const gridOverlay = document.createElement('div');
  gridOverlay.className = 'hud-grid-overlay';
  
  const telemetryL = document.createElement('div');
  telemetryL.className = 'hud-telemetry-left';
  telemetryL.textContent = 'SYS.GRID // RES.O4 // FPS: 60.0 // CALIB: OK';
  
  const telemetryR = document.createElement('div');
  telemetryR.className = 'hud-telemetry-right';
  telemetryR.textContent = 'SECURE.SSL // COMP.SYS // VER: 2026.06 // DATA: ENCRYPTED';
  
  document.body.appendChild(visorTL);
  document.body.appendChild(visorTR);
  document.body.appendChild(visorBL);
  document.body.appendChild(visorBR);
  document.body.appendChild(gridOverlay);
  document.body.appendChild(telemetryL);
  document.body.appendChild(telemetryR);

  // 12. INJECT SYSTEM LOG CONSOLE
  const consoleContainer = document.createElement('div');
  consoleContainer.className = 'hud-console collapsed';
  consoleContainer.innerHTML = `
    <div class="hud-console-header">
      <span>SYSTEM LOGS // DECK.01</span>
      <button class="hud-console-toggle">[EXPAND]</button>
    </div>
    <div class="hud-console-body">
      <div class="hud-console-lines"></div>
    </div>
  `;
  document.body.appendChild(consoleContainer);

  const consoleLines = [];
  const consoleLinesContainer = consoleContainer.querySelector('.hud-console-lines');
  
  const addLog = (text, type = 'SYS') => {
    const time = new Date().toTimeString().split(' ')[0] + '.' + String(Date.now() % 1000).padStart(3, '0');
    const logLineText = `[${time}] [${type}] ${text}`;
    consoleLines.push(logLineText);
    if (consoleLines.length > 25) consoleLines.shift();
    
    if (consoleLinesContainer) {
      const lineDiv = document.createElement('div');
      lineDiv.className = `console-line line-${type.toLowerCase()}`;
      lineDiv.textContent = logLineText;
      consoleLinesContainer.appendChild(lineDiv);
      // Auto-scroll parent
      consoleLinesContainer.parentElement.scrollTop = consoleLinesContainer.parentElement.scrollHeight;
    }
  };

  const consoleHeader = consoleContainer.querySelector('.hud-console-header');
  const consoleToggle = consoleContainer.querySelector('.hud-console-toggle');
  
  const toggleConsole = () => {
    consoleContainer.classList.toggle('collapsed');
    const isCollapsed = consoleContainer.classList.contains('collapsed');
    consoleToggle.textContent = isCollapsed ? '[EXPAND]' : '[COLLAPSE]';
    playBeep(800, 0.04);
    addLog(isCollapsed ? 'CONSOLE INTERFACE MINIMIZED' : 'CONSOLE INTERFACE EXPANDED', 'HUD');
  };
  
  consoleHeader.addEventListener('click', toggleConsole);

  // 13. INJECT AUDIO CONTROL DECK
  const deckContainer = document.createElement('div');
  deckContainer.className = 'hud-audio-deck';
  deckContainer.innerHTML = `
    <div class="hud-deck-header">
      <span>AUDIO ENGINE // OTEO.CORE</span>
      <span class="hud-deck-pulse"></span>
    </div>
    <div class="hud-deck-body">
      <div class="hud-deck-scope-container">
        <canvas class="hud-deck-scope" width="220" height="40"></canvas>
      </div>
      <div class="hud-deck-controls">
        <button class="hud-btn-play" aria-label="Play synth loop">[PLAY]</button>
        <div class="hud-deck-fader-container">
          <div class="hud-deck-fader-label">BPM: <span class="hud-bpm-val">124</span></div>
          <input type="range" class="hud-deck-slider" min="100" max="150" value="124" step="1">
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(deckContainer);

  const playBtn = deckContainer.querySelector('.hud-btn-play');
  const bpmSlider = deckContainer.querySelector('.hud-deck-slider');
  const bpmVal = deckContainer.querySelector('.hud-bpm-val');
  const canvas = deckContainer.querySelector('.hud-deck-scope');
  const canvasCtx = canvas.getContext('2d');
  
  let audioCtx = null;
  let synthInterval = null;
  let analyserNode = null;
  let currentStep = 0;
  let isPlaying = false;
  let tempoBpm = 124;

  const initAudio = () => {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.connect(audioCtx.destination);
  };

  const playBeep = (freq = 1200, duration = 0.05, type = 'sine') => {
    try {
      initAudio();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context blocked or failed:", e);
    }
  };

  const playKick = () => {
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(analyserNode);
      
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  };

  const playHat = () => {
    try {
      const bufferSize = audioCtx.sampleRate * 0.03;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(analyserNode);
      
      noise.start();
    } catch (e) {}
  };

  const playSynthNote = (freq) => {
    try {
      const osc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(analyserNode);
      
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch (e) {}
  };

  const startLoop = () => {
    if (synthInterval) clearInterval(synthInterval);
    const stepTime = (60 / tempoBpm) * 1000 / 4; // 16th notes
    synthInterval = setInterval(() => {
      const step = currentStep % 16;
      
      if (step === 0 || step === 4 || step === 8 || step === 12) {
        playKick();
      }
      if (step === 2 || step === 6 || step === 10 || step === 14) {
        playHat();
      }
      if (step === 3 || step === 7 || step === 11 || step === 15) {
        const notes = [110, 110, 130.81, 146.83, 164.81, 110];
        const freq = notes[Math.floor(step / 3) % notes.length];
        playSynthNote(freq);
      }
      
      currentStep++;
    }, stepTime);
  };

  const stopLoop = () => {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
  };

  playBtn.addEventListener('click', () => {
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    isPlaying = !isPlaying;
    if (isPlaying) {
      playBtn.classList.add('active');
      playBtn.textContent = '[STOP]';
      deckContainer.classList.add('playing');
      startLoop();
      playBeep(1000, 0.08);
      addLog('AUDIO SEQUENCER ENGAGED', 'AUDIO');
    } else {
      playBtn.classList.remove('active');
      playBtn.textContent = '[PLAY]';
      deckContainer.classList.remove('playing');
      stopLoop();
      playBeep(500, 0.08);
      addLog('AUDIO SEQUENCER SHUTDOWN', 'AUDIO');
    }
  });

  bpmSlider.addEventListener('input', (e) => {
    tempoBpm = parseInt(e.target.value, 10);
    bpmVal.textContent = tempoBpm;
    addLog(`TEMPO DRIFT: ${tempoBpm} BPM`, 'AUDIO');
    if (isPlaying) {
      startLoop();
    }
  });

  const drawScope = () => {
    requestAnimationFrame(drawScope);
    
    canvasCtx.fillStyle = 'rgba(5, 5, 5, 0.25)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    canvasCtx.lineWidth = 1.2;
    canvasCtx.strokeStyle = '#c8a96a';
    canvasCtx.beginPath();
    
    if (analyserNode && isPlaying) {
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteTimeDomainData(dataArray);
      
      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }
    } else {
      // Idle wave
      const sliceWidth = 2;
      let x = 0;
      const time = Date.now() * 0.003;
      canvasCtx.moveTo(0, canvas.height / 2);
      while (x < canvas.width) {
        const y = (canvas.height / 2) + Math.sin(x * 0.06 + time) * 5 * Math.sin(time * 0.12);
        canvasCtx.lineTo(x, y);
        x += sliceWidth;
      }
    }
    
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  };
  drawScope();

  // 14. HOVER CLICK SOUND EFFECTS AND DYNAMIC LOGS
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('a, button, .hud-btn-play');
    if (btn && !btn.classList.contains('hud-btn-play') && !btn.classList.contains('hud-console-toggle') && !e.target.closest('.hud-console-header')) {
      playBeep(900, 0.03);
      const label = btn.getAttribute('data-text') || btn.textContent.trim().substring(0, 15) || 'ELEMENT';
      addLog(`TRIGGERED -> "${label.toUpperCase().replace(/\s+/g, ' ')}"`, 'HUD');
    }
  }, { passive: true });

  let lastScrollTime = 0;
  window.addEventListener('scroll', () => {
    const now = Date.now();
    if (now - lastScrollTime > 1500) {
      addLog(`VIEWPORT ELEVATION: ${window.scrollY}PX`, 'NAV');
      lastScrollTime = now;
    }
  }, { passive: true });

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('a, button, .res-card, .svc-row');
    if (target) {
      if (target.classList.contains('js-hud-link') || target.tagName === 'BUTTON' || target.classList.contains('res-card')) {
        const name = target.getAttribute('data-text') || target.textContent.trim().substring(0, 18) || 'CONTROL';
        addLog(`FOCUS -> "${name.toUpperCase().replace(/\s+/g, ' ')}"`, 'HUD');
      }
    }
  }, { passive: true });

  // 15. DYNAMIC GLITCH CSS INJECTION & SETTING DATA-TEXT FOR KEY HEADINGS
  const addGlitches = () => {
    const headings = document.querySelectorAll('h1, h2.sec-title, .res-card h3, .svc-row h3');
    headings.forEach(heading => {
      if (!heading.classList.contains('hud-glitch-title') && heading.textContent.trim().length > 0) {
        heading.classList.add('hud-glitch-title');
        heading.setAttribute('data-text', heading.textContent.trim());
      }
    });
  };
  addGlitches();
  setTimeout(addGlitches, 1500);

  // STARTUP BOOT LOGS
  setTimeout(() => {
    addLog('SYSTEM INITIALIZATION COMPLETING...', 'SYS');
    addLog('VISOR OVERLAY MATRIX ARMED', 'SYS');
    addLog('OTEO CORE v4.8 STATUS: ONLINE', 'SYS');
    addLog('AUDIO DECK: READY FOR USER INTERACTION', 'SYS');
  }, 200);

  console.log("OTEO HUD MODULE INITIALIZED [ONLINE]");
})();
