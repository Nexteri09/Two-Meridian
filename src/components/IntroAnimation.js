// ============================================
// Two Meridian — Cinematic Intro Animation
// 8-stage GSAP + Three.js choreographed sequence
// ============================================

export class IntroAnimation {
  constructor(app) {
    this.app = app;
    this.overlay = document.getElementById('intro-overlay');
    this.particleCanvas = document.getElementById('particle-canvas');
    this.globeCanvas = document.getElementById('globe-canvas');
    this.shockwaveEl = document.getElementById('map-shockwave');

    // Three.js
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.globe = null;
    this.glowSprite = null;
    this.animationId = null;

    // Particles
    this.particleCtx = null;
    this.particles = [];
    this.particleAnimId = null;

    // State
    this.skipped = false;
    this.soundEnabled = false;
    this.audioCtx = null;

    // Bind skip handler
    this._onSkipInteraction = this._onSkipInteraction.bind(this);
  }

  async start() {
    // Read sound state
    this.soundEnabled = this.app.storage.get('soundEnabled') || false;

    // Check if returning user
    const hasSeenIntro = this.app.storage.get('hasSeenIntro');
    if (hasSeenIntro) {
      this._quickReveal();
      return;
    }

    // Preload assets in background (they should already be loaded by main.js,
    // but we ensure everything is ready)
    await this._preloadAssets();

    // Run the 8-stage cinematic
    this._runCinematic();
  }

  async _preloadAssets() {
    // Assets are already loaded by main.js init(), this is a safety net
    const promises = [];
    // Preload a few flag images for faster fact cards later
    const flagIds = ['us', 'gb', 'fr', 'de', 'jp', 'br', 'in', 'au'];
    flagIds.forEach(id => {
      const img = new Image();
      img.src = `https://flagcdn.com/w160/${id}.png`;
      promises.push(new Promise(r => { img.onload = r; img.onerror = r; }));
    });
    // Wait max 2 seconds for preload
    await Promise.race([
      Promise.all(promises),
      new Promise(r => setTimeout(r, 2000))
    ]);
  }

  _runCinematic() {
    const gsap = window.gsap;
    if (!gsap) {
      console.warn('GSAP not loaded, using quick reveal');
      this._quickReveal();
      return;
    }

    const THREE = window.THREE;
    if (!THREE) {
      console.warn('Three.js not loaded, using quick reveal');
      this._quickReveal();
      return;
    }

    // Master timeline
    const tl = gsap.timeline({
      onComplete: () => {
        this.app.storage.set('hasSeenIntro', true);
      }
    });

    // ========== STAGE 1: VOID (600ms) ==========
    // Pure black. Nothing renders. Builds anticipation.
    this.overlay.style.background = '#0a0a0f';
    this.particleCanvas.style.opacity = '0';
    this.globeCanvas.style.opacity = '0';

    tl.to({}, { duration: 0.6 });

    // After Stage 1, listen for skip
    tl.call(() => {
      document.addEventListener('keydown', this._onSkipInteraction);
      document.addEventListener('click', this._onSkipInteraction);
    });

    // ========== STAGE 2: PARTICLE FIELD (800ms) ==========
    tl.call(() => {
      if (this.skipped) return;
      this._initParticles();
      this._animateParticles();
    });

    tl.to(this.particleCanvas, {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out',
    });

    // ========== STAGE 3: GLOBE MATERIALIZES (1000ms) ==========
    tl.call(() => {
      if (this.skipped) return;
      this._initGlobe();
      this._startGlobeRender();
      // Sound: ambient hum
      if (this.soundEnabled) this._playAmbientHum();
    });

    tl.to(this.globeCanvas, {
      opacity: 1,
      duration: 1.0,
      ease: 'power2.out',
    });

    // ========== STAGE 4: ROTATION & ORIENTATION (1200ms) ==========
    // Globe rotates for 800ms then decelerates over 400ms
    tl.call(() => {
      if (this.skipped) return;
      this._rotationPhase = 'spinning';
    });

    tl.to({}, { duration: 0.8 });

    tl.call(() => {
      if (this.skipped) return;
      this._rotationPhase = 'decelerating';
      this._decelerateStart = performance.now();
    });

    tl.to({}, { duration: 0.4 });

    // Camera pulse — 2% closer then settle
    tl.call(() => {
      if (this.skipped || !this.camera) return;
      this._rotationPhase = 'locked';
      gsap.to(this.camera.position, {
        z: 2.94,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => {
          if (this.camera) {
            gsap.to(this.camera.position, {
              z: 3,
              duration: 0.25,
              ease: 'power2.out',
            });
          }
        }
      });
    });

    // ========== STAGE 5: GLOBE ZOOM — THE MONEY SHOT (900ms) ==========
    tl.call(() => {
      if (this.skipped) return;
      this._rotationPhase = 'zoom';
      // Sound: whoosh
      if (this.soundEnabled) this._playWhoosh();
    });

    // Globe scale 1→4 with opacity fade
    const globeZoomProxy = { scale: 1, opacity: 1 };
    tl.to(globeZoomProxy, {
      scale: 4,
      opacity: 0,
      duration: 0.9,
      ease: 'power2.in',
      onUpdate: () => {
        if (this.globeCanvas) {
          this.globeCanvas.style.transform = `translate(-50%, -50%) scale(${globeZoomProxy.scale})`;
          // Fade out starting at scale 3.5
          if (globeZoomProxy.scale > 2.5) {
            const fadeProgress = (globeZoomProxy.scale - 2.5) / 1.5;
            this.globeCanvas.style.opacity = String(1 - fadeProgress);
          }
        }
      }
    });

    // Simultaneously fade particles
    tl.to(this.particleCanvas, {
      opacity: 0,
      duration: 0.9,
      ease: 'power2.in',
    }, '<');

    // 80ms black flash at the end of zoom
    tl.call(() => {
      if (this.skipped) return;
      // Dispose Three.js — no longer needed
      this._disposeThreeJS();
      this._stopParticles();
      // Black flash
      this.overlay.style.background = '#000';
    });

    tl.to({}, { duration: 0.08 });

    // ========== STAGE 6: MAP SLAMS IN (700ms) ==========
    tl.call(() => {
      if (this.skipped) return;
      // Sound: thud/impact
      if (this.soundEnabled) this._playThud();
      // Hide overlay, reveal app
      this.overlay.style.display = 'none';
      const app = document.getElementById('app');
      app.classList.remove('hidden');
      app.style.opacity = '0';
      app.style.transform = 'scale(1.08)';
    });

    tl.to('#app', {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: 'power2.out',
    });

    // Radial shockwave from center
    tl.call(() => {
      if (this.skipped) return;
      this._triggerShockwave();
    }, null, '<');

    // ========== STAGE 7: ELEMENTS ASSEMBLE (800ms staggered) ==========
    // Continent badges
    tl.call(() => {
      if (this.skipped) return;
      // Sound: chime sequence
      if (this.soundEnabled) this._playChimeSequence();
    });

    tl.fromTo('.continent-label', {
      opacity: 0,
      y: 10,
    }, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'power2.out',
      stagger: 0.1,
    });

    // Sidebar slides in
    tl.fromTo('#sidebar', {
      opacity: 0,
      x: -20,
    }, {
      opacity: 1,
      x: 0,
      duration: 0.5,
      ease: 'power2.out',
    }, '<0.1');

    // Nav fades in from top
    tl.fromTo('#top-nav', {
      opacity: 0,
      y: -10,
    }, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'power2.out',
    }, '<0.1');

    // Logo glow pulse (once)
    tl.call(() => {
      if (this.skipped) return;
      const brandName = document.querySelector('.brand-name');
      if (brandName) {
        gsap.fromTo(brandName, {
          textShadow: '0 0 0px transparent',
        }, {
          textShadow: '0 0 20px rgba(0, 180, 216, 0.6), 0 0 40px rgba(0, 180, 216, 0.3)',
          duration: 0.4,
          ease: 'power2.in',
          onComplete: () => {
            gsap.to(brandName, {
              textShadow: '0 0 0px transparent',
              duration: 0.6,
              ease: 'power2.out',
            });
          }
        });
      }
    }, null, '<0.2');

    // Input auto-focus (appears last)
    tl.call(() => {
      if (this.skipped) return;
      const input = document.getElementById('country-input');
      if (input) {
        input.focus();
      }
    });

    // ========== STAGE 8: SETTLE (400ms) ==========
    tl.to({}, { duration: 0.4 });

    tl.call(() => {
      if (this.skipped) return;
      this._addVignette();
      // Remove skip listeners
      document.removeEventListener('keydown', this._onSkipInteraction);
      document.removeEventListener('click', this._onSkipInteraction);
      // Stop ambient sound
      this._fadeOutAmbient();
    });

    this._masterTimeline = tl;
  }

  // ====== SKIP LOGIC ======
  _onSkipInteraction(e) {
    if (this.skipped) return;
    // Ignore if it's on the sound toggle
    if (e.target && e.target.closest('#sound-toggle')) return;
    this.skipped = true;

    document.removeEventListener('keydown', this._onSkipInteraction);
    document.removeEventListener('click', this._onSkipInteraction);

    // Kill master timeline
    if (this._masterTimeline) {
      this._masterTimeline.kill();
    }

    // Cleanup
    this._disposeThreeJS();
    this._stopParticles();
    this._fadeOutAmbient();

    // Quick skip to final state
    const gsap = window.gsap;
    this.overlay.style.display = 'none';

    const app = document.getElementById('app');
    app.classList.remove('hidden');

    if (gsap) {
      gsap.fromTo(app, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      // Also ensure all elements are visible
      gsap.set('.continent-label', { opacity: 1, y: 0 });
      gsap.set('#sidebar', { opacity: 1, x: 0 });
      gsap.set('#top-nav', { opacity: 1, y: 0 });
    } else {
      app.style.opacity = '1';
    }

    this._addVignette();
    this.app.storage.set('hasSeenIntro', true);

    setTimeout(() => {
      const input = document.getElementById('country-input');
      if (input) input.focus();
    }, 100);
  }

  _quickReveal() {
    // For returning users — skip to elements assembling with 400ms fade
    const gsap = window.gsap;
    this.overlay.style.display = 'none';

    const app = document.getElementById('app');
    app.classList.remove('hidden');

    if (gsap) {
      // Set initial hidden states
      gsap.set(app, { opacity: 0 });
      gsap.set('.continent-label', { opacity: 0, y: 6 });
      gsap.set('#sidebar', { opacity: 0, x: -10 });
      gsap.set('#top-nav', { opacity: 0, y: -6 });

      const tl = gsap.timeline();

      tl.to(app, { opacity: 1, duration: 0.3, ease: 'power2.out' });

      tl.to('#top-nav', { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, '<');
      tl.to('#sidebar', { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }, '<0.05');
      tl.to('.continent-label', {
        opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', stagger: 0.05
      }, '<0.1');

      tl.call(() => {
        this._addVignette();
        const input = document.getElementById('country-input');
        if (input) input.focus();
      });
    } else {
      app.style.opacity = '1';
      app.classList.add('app-reveal');
      setTimeout(() => {
        const input = document.getElementById('country-input');
        if (input) input.focus();
      }, 400);
    }
  }

  // ====== PARTICLE FIELD ======
  _initParticles() {
    const canvas = this.particleCanvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.particleCtx = canvas.getContext('2d');

    this.particles = [];
    for (let i = 0; i < 200; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        opacity: 0,
        targetOpacity: (Math.random() * 0.1 + 0.15), // 15-25%
        driftX: (Math.random() - 0.5) * 0.15,
        driftY: (Math.random() - 0.5) * 0.1,
        fadeDelay: i * 3, // stagger — ~0.003s per particle
        fadeStarted: false,
      });
    }
  }

  _animateParticles() {
    if (this.skipped) return;
    const ctx = this.particleCtx;
    const canvas = this.particleCanvas;
    if (!ctx || !canvas) return;

    const startTime = performance.now();

    const draw = () => {
      if (this.skipped) return;
      const elapsed = performance.now() - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of this.particles) {
        // Staggered fade-in
        if (elapsed > p.fadeDelay) {
          const fadeElapsed = elapsed - p.fadeDelay;
          p.opacity = Math.min(p.targetOpacity, p.targetOpacity * (fadeElapsed / 600));
        }

        // Drift
        p.x += p.driftX;
        p.y += p.driftY;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      }

      this.particleAnimId = requestAnimationFrame(draw);
    };

    draw();
  }

  _stopParticles() {
    if (this.particleAnimId) {
      cancelAnimationFrame(this.particleAnimId);
      this.particleAnimId = null;
    }
  }

  // ====== THREE.JS GLOBE ======
  _initGlobe() {
    const THREE = window.THREE;
    const canvas = this.globeCanvas;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    this.camera.position.set(0, 0, 3);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    // Globe radius
    const globeRadius = (h * 0.55 / 2) / (h / 2 / Math.tan((45 * Math.PI / 180) / 2) / 3);
    const actualRadius = Math.min(globeRadius, 1.1);

    // Globe base geometry
    const geometry = new THREE.SphereGeometry(actualRadius, 32, 32);

    // Custom shader for dark glowing Earth
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0x0b1325) },
        uBorderColor: { value: new THREE.Color(0x1c2a4a) },
        uGlowColor: { value: new THREE.Color(0x00b4d8) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-worldPos.xyz);
          gl_Position = projectionMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform vec3 uBorderColor;
        uniform vec3 uGlowColor;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;

        void main() {
          // Latitude / Longitude subtle grid
          float gridX = abs(sin(vUv.x * 36.0 * 3.14159));
          float gridY = abs(sin(vUv.y * 18.0 * 3.14159));
          float grid = smoothstep(0.96, 1.0, max(gridX, gridY));

          vec3 color = uColor;
          color = mix(color, uBorderColor, grid * 0.4);

          // Atmospheric rim glow
          float rimFactor = 1.0 - max(dot(vNormal, vViewDir), 0.0);
          float rim = pow(rimFactor, 2.5) * 0.45;
          color += uGlowColor * rim;

          gl_FragColor = vec4(color, 0.95);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
    });

    this.globe = new THREE.Mesh(geometry, material);
    this.scene.add(this.globe);

    // 🌍 Add Geographically Accurate Continent Landmass Dots
    this._addLandmassPoints(actualRadius * 1.008);

    // ✨ Add Orbital Particle Ring
    this._addOrbitalRings(actualRadius * 1.3);

    // Start facing Europe/Atlantic
    this.globe.rotation.y = Math.PI * 0.83;

    // Rotation state
    this._rotationPhase = 'spinning';
    this._rotationSpeed = 0.003;
    this._decelerateStart = 0;
  }

  // 🗺️ Geographically Accurate Continent Dots Generator
  _addLandmassPoints(radius) {
    const THREE = window.THREE;
    const positions = [];
    const colors = [];
    const baseColor = new THREE.Color(0x00f5d4);

    // Continent lat/lon bounding clusters (lat: -90 to 90, lon: -180 to 180)
    const continentBoxes = [
      // North America
      { minLat: 15, maxLat: 70, minLon: -165, maxLon: -50, density: 450 },
      // South America
      { minLat: -55, maxLat: 12, minLon: -80, maxLon: -35, density: 350 },
      // Europe
      { minLat: 35, maxLat: 70, minLon: -10, maxLon: 40, density: 300 },
      // Africa
      { minLat: -34, maxLat: 37, minLon: -17, maxLon: 51, density: 500 },
      // Asia
      { minLat: 8, maxLat: 70, minLon: 40, maxLon: 145, density: 750 },
      // Australia / Oceania
      { minLat: -42, maxLat: -10, minLon: 110, maxLon: 155, density: 250 },
    ];

    continentBoxes.forEach(box => {
      for (let i = 0; i < box.density; i++) {
        // Random spherical coordinates within continent boxes
        const lat = box.minLat + Math.random() * (box.maxLat - box.minLat);
        const lon = box.minLon + Math.random() * (box.maxLon - box.minLon);

        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = (radius * Math.sin(phi) * Math.sin(theta));
        const y = (radius * Math.cos(phi));

        positions.push(x, y, z);
        colors.push(baseColor.r, baseColor.g, baseColor.b);
      }
    });

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    this.landPoints = new THREE.Points(pGeo, pMat);
    this.globe.add(this.landPoints);
  }

  // ✨ Orbital Ring Particles
  _addOrbitalRings(radius) {
    const THREE = window.THREE;
    const count = 120;
    const positions = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * 0.1;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = (Math.random() - 0.5) * 0.15;
      positions.push(x, y, z);
    }

    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const ringMat = new THREE.PointsMaterial({
      color: 0x00b4d8,
      size: 0.03,
      transparent: true,
      opacity: 0.6,
    });

    this.orbitalRing = new THREE.Points(ringGeo, ringMat);
    this.orbitalRing.rotation.x = Math.PI * 0.15;
    this.scene.add(this.orbitalRing);
  }

  _startGlobeRender() {
    const renderLoop = () => {
      if (!this.renderer || !this.scene || !this.camera) return;
      this.animationId = requestAnimationFrame(renderLoop);

      // Update uniforms & orbital ring
      if (this.globe && this.globe.material.uniforms) {
        this.globe.material.uniforms.uTime.value = performance.now() * 0.001;
      }
      if (this.orbitalRing) {
        this.orbitalRing.rotation.y += 0.002;
      }

      // Rotation logic
      if (this.globe) {
        if (this._rotationPhase === 'spinning') {
          this.globe.rotation.y += 0.0035;
        } else if (this._rotationPhase === 'decelerating') {
          const elapsed = performance.now() - this._decelerateStart;
          const progress = Math.min(elapsed / 400, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const speed = 0.0035 * (1 - eased);
          this.globe.rotation.y += speed;
        }
      }

      this.renderer.render(this.scene, this.camera);
    };

    renderLoop();
  }

  _disposeThreeJS() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer = null;
    }
    if (this.globe) {
      if (this.globe.geometry) this.globe.geometry.dispose();
      if (this.globe.material) this.globe.material.dispose();
      this.globe = null;
    }
    if (this.scene) {
      this.scene.clear();
      this.scene = null;
    }
    this.camera = null;
  }

  // ====== SHOCKWAVE ======
  _triggerShockwave() {
    // The shockwave is triggered on a div inside the map container
    // We create a temporary radial pulse
    const app = document.getElementById('app');
    const pulse = document.createElement('div');
    pulse.className = 'intro-shockwave-pulse';
    app.appendChild(pulse);

    const gsap = window.gsap;
    if (gsap) {
      gsap.fromTo(pulse, {
        opacity: 0.2,
        scale: 0,
      }, {
        opacity: 0,
        scale: 3,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => pulse.remove(),
      });
    } else {
      setTimeout(() => pulse.remove(), 700);
    }
  }

  // ====== VIGNETTE ======
  _addVignette() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer || mapContainer.querySelector('.intro-vignette')) return;
    const vignette = document.createElement('div');
    vignette.className = 'intro-vignette';
    mapContainer.appendChild(vignette);
  }

  // ====== SOUND (Web Audio API synthesized) ======
  _getAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioCtx;
  }

  _playAmbientHum() {
    try {
      const ctx = this._getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, ctx.currentTime); // Low A1
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);

      osc.start(ctx.currentTime);
      this._ambientOsc = osc;
      this._ambientGain = gain;
    } catch (e) { /* silent fail */ }
  }

  _fadeOutAmbient() {
    try {
      if (this._ambientGain && this._ambientOsc) {
        const ctx = this._getAudioContext();
        this._ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
        this._ambientOsc.stop(ctx.currentTime + 0.6);
        this._ambientOsc = null;
        this._ambientGain = null;
      }
    } catch (e) { /* silent fail */ }
  }

  _playWhoosh() {
    try {
      const ctx = this._getAudioContext();
      // White noise burst with filter sweep
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.2);
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);
      filter.Q.setValueAtTime(1, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(ctx.currentTime);
    } catch (e) { /* silent fail */ }
  }

  _playThud() {
    try {
      const ctx = this._getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) { /* silent fail */ }
  }

  _playChimeSequence() {
    try {
      const ctx = this._getAudioContext();
      // 3 ascending notes: C5, E5, G5 — subtle
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + i * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);

        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.5);
      });
    } catch (e) { /* silent fail */ }
  }
}
