/*
  OTEO OTEO WebGL Calendar Slider
  Features a horizontal cylinder panel slider with vertical date spines.
  All rights reserved.
*/

import * as THREE from './ref-agenda/site/js/threejs/three.module.js';

const lerp = (a, b, n) => (1 - n) * a + n * b;


// Agenda is COMPUTED from the one true CURRENT residency: Debonair Supperclub,
// every Wednesday (+ select nights). Dates are the next real Wednesdays — never
// hardcoded, never stale, never invented. Past rooms live on /residencies, not on
// the upcoming agenda; the closing card turns intent into a booking.
function OTEO_buildAgenda() {
  const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const DAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const fmt = d => MONTHS[d.getMonth()] + " " + String(d.getDate()).padStart(2, "0");
  const next = (weekday, weeksAhead) => {
    const d = new Date();
    let add = (weekday - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + add + weeksAhead * 7);
    return d;
  };
  const debonair = (d) => ({
    id: "debonair_" + d.getTime(),
    date: fmt(d), dayName: DAYS[d.getDay()],
    venue: "DEBONAIR",
    colors: ["#0c0c0c", "#c8a96a"],
    image: "assets/debonair.jpg",
    text: "DEBONAIR SUPPERCLUB",
    genre: "HOUSE & TECH HOUSE",
    time: "EVENING / LATE",
    link: "/residencies#debonair"
  });
  const ev = [];
  for (let w = 0; w < 6; w++) ev.push(debonair(next(3, w))); // Wednesday = day 3
  ev.push({
    id: "book_oteo", date: "YOUR", dayName: "DATE",
    venue: "BOOK OTEO", colors: ["#0c0c0c", "#c8a96a"],
    image: "assets/debonair.jpg", text: "REQUEST A DATE",
    genre: "PRIVATE · CORPORATE · RESIDENCY", time: "ANY NIGHT",
    link: "/booking#book"
  });
  return ev;
}

class CalendarCarousel {
  activeIdx = 0;
  targetRotation = 0;
  currentRotation = 0;
  
  isDragging = false;
  startX = 0;
  startRotation = 0;

  constructor() {
    console.log("CalendarCarousel constructor called");
    if (window.SITE) {
      console.warn("CalendarCarousel already instantiated! Returning early.");
      return;
    }
    window.SITE = this;

    this.canvas = document.querySelector('canvas#scene');
    this.container = this.canvas.parentElement;

    // Agenda Data
    this.agendaEvents = OTEO_buildAgenda();

    try {
      // Scene & Renderer
      this.scene = new THREE.Scene();
      
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      // Camera
      this.camera = new THREE.PerspectiveCamera(35, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
      this.camera.position.set(0, 0, 32);

      this.isWebGLAvailable = true;
    } catch (e) {
      console.warn("WebGL initialization failed, using 2D fallback layout:", e);
      this.isWebGLAvailable = false;
      this.container.classList.add('no-webgl');
      this.initFallback();
      this.updateActiveInfo();
      return;
    }

    // Carousel Configuration
    this.radius = 16;
    this.thetaSpacing = 0.22; // spacing along the circle

    // Initialize meshes
    this.initCarousel();

    // Event Bindings
    window.addEventListener('resize', this.resize);
    
    this.container.addEventListener('mousedown', this.dragStart);
    this.container.addEventListener('mousemove', this.dragMove);
    window.addEventListener('mouseup', this.dragEnd);

    this.container.addEventListener('touchstart', this.dragStart, { passive: true });
    this.container.addEventListener('touchmove', this.dragMove, { passive: true });
    window.addEventListener('touchend', this.dragEnd);

    this.container.addEventListener('wheel', this.scrollMove, { passive: false });
    this.container.addEventListener('click', this.clickItem);

    // Initial positioning
    this.resize();
    this.updateActiveInfo();
    requestAnimationFrame(this.animate);
  }

  initFallback() {
    const cards = document.querySelectorAll('.fallback-card');
    cards.forEach((card, i) => {
      card.addEventListener('click', () => {
        this.activeIdx = i;
        this.updateActiveInfo();
        this.updateFallbackCards();
      });
    });
    this.updateFallbackCards();
  }

  updateFallbackCards() {
    const cards = document.querySelectorAll('.fallback-card');
    cards.forEach((card, i) => {
      if (i === this.activeIdx) {
        card.classList.add('is-active');
        card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        card.classList.remove('is-active');
      }
    });
  }

  // Generate canvas texture with vertical date spine on the side
  createCanvasTexture = (item) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 1. Solid background with a dark gradient wash
    const grad = ctx.createLinearGradient(0, 0, 512, 1024);
    grad.addColorStop(0, item.colors[0]);
    grad.addColorStop(0.4, '#080808');
    grad.addColorStop(1, item.colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 1024);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.LinearEncoding;

    // 2. Load background image asynchronously
    const img = new Image();
    img.src = item.image;
    img.onload = () => {
      // Draw image covering the right side
      const drawWidth = 320;
      const drawHeight = 1024;
      const aspect = img.width / img.height;
      
      let w = drawWidth;
      let h = drawWidth / aspect;
      if (h < drawHeight) {
        h = drawHeight;
        w = drawHeight * aspect;
      }

      ctx.save();
      // Clip to right portion
      ctx.beginPath();
      ctx.rect(192, 0, 320, 1024);
      ctx.clip();
      ctx.drawImage(img, 192 + (320 - w)/2, (1024 - h)/2, w, h);
      ctx.restore();

      // Smooth blend wash
      const wash = ctx.createLinearGradient(150, 0, 320, 0);
      wash.addColorStop(0, 'rgba(8, 8, 8, 1)');
      wash.addColorStop(1, 'rgba(8, 8, 8, 0)');
      ctx.fillStyle = wash;
      ctx.fillRect(150, 0, 170, 1024);

      // Redraw spine elements
      this.drawSpineElements(ctx, item);
      texture.needsUpdate = true;
    };

    this.drawSpineElements(ctx, item);
    texture.needsUpdate = true;

    return texture;
  }

  drawSpineElements = (ctx, item) => {
    // Vertical spine divider
    ctx.fillStyle = item.colors[0];
    ctx.fillRect(192, 0, 4, 1024);

    // Spine date details drawn vertically
    ctx.save();
    ctx.translate(96, 512);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Day indicator
    ctx.font = '900 68px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(item.date, 0, -20);
    
    // Shorthand venue
    ctx.font = '600 24px Geist, sans-serif';
    ctx.fillStyle = item.colors[1];
    ctx.letterSpacing = '0.2em';
    ctx.fillText(item.venue.toUpperCase(), 0, 50);

    ctx.restore();
  }

  initCarousel = () => {
    this.carouselGroup = new THREE.Group();
    this.scene.add(this.carouselGroup);

    // Panel curved vertex shader & basic styling fragment shader
    const vertexShader = `
      varying vec2 vUv;
      uniform float uActive;
      void main() {
        vUv = uv;
        // Curved paper roll effect
        float curve = sin(uv.x * 3.14159) * 0.18 * (1.0 - uActive * 0.7);
        vec3 pos = vec3(position.x, position.y, position.z + curve);
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      uniform sampler2D uTex;
      uniform float uActive;
      void main() {
        vec4 tex = texture2D(uTex, vUv);
        // Dim inactive cards
        float dim = mix(0.45, 1.0, uActive);
        gl_FragColor = vec4(tex.rgb * dim, 1.0);
      }
    `;

    this.meshes = [];
    const geometry = new THREE.PlaneGeometry(3.2, 6.4, 32, 32);

    this.agendaEvents.forEach((item, i) => {
      const texture = this.createCanvasTexture(item);
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTex: { value: texture },
          uActive: { value: 0.0 }
        },
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { index: i };
      this.carouselGroup.add(mesh);
      this.meshes.push(mesh);
    });
  }

  animate = (t) => {
    if (!this.isWebGLAvailable) return;
    this.uTime = t * 0.001;

    // Smooth carousel rotation interpolation
    this.currentRotation = lerp(this.currentRotation, this.targetRotation, 0.1);

    // Arrange panels along a circular/cylinder carousel path
    this.meshes.forEach((mesh, i) => {
      const angle = (i * this.thetaSpacing) + this.currentRotation;
      
      const x = this.radius * Math.sin(angle);
      const z = this.radius * (Math.cos(angle) - 1.0);
      
      mesh.position.set(x, 0, z);
      mesh.rotation.y = angle; // Tangent rotation to face the camera

      // Calculate how close the item is to the center focus point (angle = 0)
      const absAngle = Math.abs(angle);
      let activeVal = 0.0;

      if (absAngle < 0.15) {
        activeVal = 1.0 - (absAngle / 0.15);
        if (i !== this.activeIdx) {
          this.activeIdx = i;
          this.updateActiveInfo();
        }
      }

      // Smooth active card scaling & displacement focus
      mesh.material.uniforms.uActive.value = activeVal;
      const scale = 1.0 + activeVal * 0.2;
      mesh.scale.set(scale, scale, 1.0);
      mesh.position.z += activeVal * 1.5;
    });

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }

  updateActiveInfo = () => {
    const activeItem = this.agendaEvents[this.activeIdx];
    if (!activeItem) return;

    // 1. Dynamic Watermark Background text update
    const watermarkWord = document.querySelector('.bg-title-word');
    if (watermarkWord && watermarkWord.textContent !== activeItem.venue) {
      watermarkWord.style.opacity = 0;
      setTimeout(() => {
        watermarkWord.textContent = activeItem.venue;
        watermarkWord.style.opacity = 1;
      }, 200);
    }

    // 2. Aristide-style Top Progress update
    const currentNum = document.querySelector('.current-index-val');
    if (currentNum) {
      currentNum.textContent = String(this.activeIdx + 1).padStart(2, '0');
    }

    // 3. Details Overlay update
    const dateVal = document.querySelector('.event-date-val');
    const venueVal = document.querySelector('.event-venue-val');
    const genreVal = document.querySelector('.event-genre-val');
    const timeVal = document.querySelector('.event-time-val');
    const linkBtn = document.querySelector('.event-link-val');

    if (dateVal) dateVal.textContent = activeItem.date + " // " + activeItem.dayName;
    if (venueVal) venueVal.textContent = activeItem.venue;
    if (genreVal) genreVal.textContent = activeItem.genre;
    if (timeVal) timeVal.textContent = activeItem.time;
    if (linkBtn) linkBtn.href = activeItem.link;
  }

  // Drag Interactions
  dragStart = (e) => {
    if (!this.isWebGLAvailable) return;
    this.isDragging = true;
    this.startX = e.clientX || (e.touches && e.touches[0].clientX);
    this.startRotation = this.targetRotation;
  }

  dragMove = (e) => {
    if (!this.isWebGLAvailable) return;
    if (!this.isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const deltaX = clientX - this.startX;
    
    // Scale drag speed
    this.targetRotation = this.startRotation + deltaX * 0.003;
  }

  dragEnd = () => {
    if (!this.isWebGLAvailable) return;
    this.isDragging = false;
    
    // Snap to nearest item slot
    const itemIndex = Math.round(-this.targetRotation / this.thetaSpacing);
    const clampedIndex = Math.max(0, Math.min(this.agendaEvents.length - 1, itemIndex));
    this.targetRotation = -clampedIndex * this.thetaSpacing;
  }

  scrollMove = (e) => {
    if (!this.isWebGLAvailable) return;
    e.preventDefault();
    this.targetRotation -= e.deltaX * 0.0006 + e.deltaY * 0.0006;
    
    // Keep within boundaries
    const maxRotation = 0.5;
    const minRotation = -((this.agendaEvents.length - 1) * this.thetaSpacing) - 0.5;
    this.targetRotation = Math.max(minRotation, Math.min(maxRotation, this.targetRotation));
    
    // Snap after a brief delay is handled by animation frame
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      const itemIndex = Math.round(-this.targetRotation / this.thetaSpacing);
      const clampedIndex = Math.max(0, Math.min(this.agendaEvents.length - 1, itemIndex));
      this.targetRotation = -clampedIndex * this.thetaSpacing;
    }, 250);
  }

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  clickItem = (e) => {
    if (!this.isWebGLAvailable) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.meshes);

    if (intersects.length > 0) {
      const idx = intersects[0].object.userData.index;
      // Focus carousel rotation to selected clicked item index
      this.targetRotation = -idx * this.thetaSpacing;
    }
  }

  resize = () => {
    if (!this.isWebGLAvailable) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(w, h);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.SITE = new CalendarCarousel();
});
