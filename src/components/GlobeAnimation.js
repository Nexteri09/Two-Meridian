/**
 * GlobeAnimation.js
 * Two Meridian — "Field Atlas" Cartographic Globe & WebGL Morph Engine
 *
 * FEATURES:
 *  1. Deep ink backgrounds, restrained brass accents, engraved hairline graticules.
 *  2. Continuous ambient multi-country glowing in Brass (Casual), Cobalt (Speed), Terra Cotta (Reverse).
 *  3. Prime Meridian (0°) & Equator graticule rings for authentic cartographic depth.
 *  4. Telephoto narrow FOV (26°) eliminates egg/oval corner distortion.
 *  5. True polar latitude distribution (prevents Greenland/Russia stretching).
 *  6. Smooth, steady rotation when hovering fact cards (luxurious cinematic glide).
 */

// ─────────────────────────────────────────────────────────────────────────────
//  SHADERS
// ─────────────────────────────────────────────────────────────────────────────

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  uniform float uProgress;    // 0 = Flat Map, 1 = 3D Sphere

  #define PI 3.1415926535897932384626433832795

  // Pseudo-random hash for sharp faceted origami folds
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // 2D Faceted Noise for physical paper scrunching
  float facetedNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vUv = uv;

    // ── 1. FLAT WIDESCREEN RECTANGULAR MAP ────────────────────────────────
    float flatW = 3.6;
    float flatH = 1.8;
    vec3 flatPos = vec3(
      (uv.x - 0.5) * flatW,
      (uv.y - 0.5) * flatH,
      0.0
    );
    vec3 flatNormal = vec3(0.0, 0.0, 1.0);

    // ── 2. TRUE SPHERE WITH BALANCED POLAR LATITUDES ──────────────────────
    float R = 0.765; // Reduced globe size by 15% from 0.90
    // Map SVG vertical span (-62° to +82°) to natural spherical latitude
    float lat = mix(-1.08, 1.43, uv.y);
    float phi = PI * 0.5 - lat;
    float theta = uv.x * 2.0 * PI - PI * 0.5;

    vec3 spherePos = vec3(
      -R * sin(phi) * cos(theta),
       R * cos(phi),
       R * sin(phi) * sin(theta)
    );
    vec3 sphereNormal = normalize(spherePos);

    // ── 3. PURE SCROLL-DRIVEN FACETED PAPER SCRUNCH ────────────────────────
    float crumpleFactor = sin(uProgress * PI);

    float crease1 = facetedNoise(uv * 7.0) * 2.0 - 1.0;
    float crease2 = facetedNoise(uv * 18.0) * 2.0 - 1.0;
    float crease3 = facetedNoise(uv * 38.0) * 2.0 - 1.0;
    float combinedCreases = crease1 * 0.55 + crease2 * 0.32 + crease3 * 0.13;

    vec2 centerDir = uv - vec2(0.5, 0.5);
    float bunch = sin(length(centerDir) * 14.0 - uProgress * 6.0) * crumpleFactor * 0.08;

    float zDisp = combinedCreases * crumpleFactor * 0.38;

    vec3 mixedPos = mix(flatPos, spherePos, uProgress);
    mixedPos += flatNormal * zDisp;
    mixedPos.xy += centerDir * bunch;

    vec3 mixedNormal = normalize(mix(flatNormal, sphereNormal, uProgress));

    vNormal = normalize(normalMatrix * mixedNormal);
    vec4 worldPos = modelMatrix * vec4(mixedPos, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  uniform sampler2D uMap;
  uniform float     uProgress; // 0 = flat, 1 = sphere

  void main() {
    vec4 mapColor = texture2D(uMap, vUv);

    // Feathered edge dissolve for Hero flat map
    float edgeDistX = min(vUv.x, 1.0 - vUv.x);
    float edgeDistY = min(vUv.y, 1.0 - vUv.y);
    float edgeX = smoothstep(0.0, 0.035, edgeDistX);
    float edgeY = smoothstep(0.0, 0.035, edgeDistY);
    float edgeMask = edgeX * edgeY;

    float vignette = mix(edgeMask, 1.0, uProgress);

    // Subtle directional lighting for 3D sphere
    vec3 lightDir = normalize(vec3(0.3, 0.6, 1.0));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.90;
    float lighting = mix(1.0, ambient + diff * 0.18, uProgress);

    vec3 finalRgb = mapColor.rgb * lighting;
    float finalAlpha = mapColor.a * vignette;

    gl_FragColor = vec4(finalRgb, finalAlpha);
  }
`;

// Restrained cartographic brass rim
const atmosphereVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3  vNormal;
  uniform float uProgress;
  void main() {
    float rim   = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
    rim         = pow(clamp(rim, 0.0, 1.0), 4.5);
    float alpha = rim * clamp((uProgress - 0.7) / 0.3, 0.0, 1.0) * 0.09;
    gl_FragColor = vec4(0.77, 0.61, 0.15, alpha);
  }
`;

// Pulse colors moved to dynamic theme palette

// Curated diverse pool of countries across all world regions
const PULSE_COUNTRY_POOL = [
  'BR', 'FR', 'JP', 'AU', 'EG', 'IN', 'US', 'ZA', 'CA', 'DE',
  'AR', 'NO', 'MX', 'NZ', 'KE', 'CL', 'TH', 'ES', 'IS', 'ID',
  'IT', 'VN', 'GR', 'PE', 'KR', 'MA', 'FI', 'SE', 'CO', 'TR',
  'DZ', 'MN', 'KZ', 'SA', 'GL', 'MG', 'NG', 'TZ', 'PH', 'GB'
];

// ─────────────────────────────────────────────────────────────────────────────
//  CLASS
// ─────────────────────────────────────────────────────────────────────────────
export class GlobeAnimation {

  constructor(container, svgUrl = './src/assets/world-map.svg', getThemePalette = null) {
    this.container = container;
    this.svgUrl    = svgUrl;
    this.getThemePalette = getThemePalette;

    // Three.js objects
    this.scene      = null;
    this.camera     = null;
    this.renderer   = null;
    this.mesh       = null;
    this.atmosMesh  = null;
    this.uniforms   = null;

    // State
    this.progress       = 0;
    this.targetProgress = 0;
    this.scrollRotY     = 0;
    this.currentRotY    = 0;
    this.currentRotX    = 0;
    this.focusRotY      = null;
    this.focusRotX      = null;
    this.isFocused      = false;
    this._rafId         = null;

    // Texture + telemetry beacon + SVG circles
    this.mapCanvas       = null;
    this.texture         = null;
    this.svgImage        = null;
    this.svgPaths        = [];
    this.svgCircles      = [];
    this.isoPathMap      = new Map();
    this.isoCircleMap    = new Map();

    // Continuous Ambient Multi-Country Glow Engine
    this.activePulses    = [];
    this._lastSpawnTime  = 0;
    this._colorIdx       = 0;
    this._countryPoolIdx = 0;

    this._activeBeacon   = null;
    this._currentHighlights = [];
    this.svgBounds = { svgX: 10, svgY: 248, svgW: 850, svgH: 455 };

    // Bound handlers
    this._onScroll = this._onScroll.bind(this);
    this._onResize = this._onResize.bind(this);
    this._loop     = this._loop.bind(this);
    this._onThemeChange = this._onThemeChange.bind(this);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  async init() {
    await this._ensureThree();
    await this._buildTexture();
    this._setupScene();
    this._setupGlobeMesh();
    this._setupAtmosphere();
    this._bindEvents();
    this._onScroll();
    this._rafId = requestAnimationFrame(this._loop);

    // Listen for theme changes to rebuild the globe texture
    window.addEventListener('themechange', this._onThemeChange);
  }

  _onThemeChange() {
    // Rebuild SVG texture with new palette, then update Three.js texture
    this._rebuildTextureForTheme();
  }

  async _rebuildTextureForTheme() {
    // Re-apply style overrides to clean SVG and redraw
    await this._applyThemeToSvg();
    this._redrawMap(this._currentHighlights, this._activeBeacon);
    if (this.texture) this.texture.needsUpdate = true;
  }

  async _ensureThree() {
    if (window.THREE) return window.THREE;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => resolve(window.THREE);
      script.onerror = () => reject(new Error('Failed to load Three.js'));
      document.head.appendChild(script);
    });
  }

  /**
   * Focuses the globe smoothly onto a country / microstate coordinates.
   * Tilts both X and Y axes precisely to bring the location to the exact center of the screen.
   */
  focusLocation(lon, lat, iso = null, name = '') {
    this.isFocused = true;
    const upperIso = iso ? iso.toUpperCase() : null;

    let cx = null, cy = null;
    if (upperIso && this.isoCircleMap.has(upperIso)) {
      const circleData = this.isoCircleMap.get(upperIso);
      cx = circleData.cx;
      cy = circleData.cy;
    } else if (upperIso && this.isoPathMap.has(upperIso)) {
      const pathIdx = this.isoPathMap.get(upperIso);
      const pathData = this.svgPaths[pathIdx];
      if (pathData && pathData.cx !== undefined) {
        cx = pathData.cx;
        cy = pathData.cy;
      }
    }

    this._activeBeacon = { lon, lat, iso: upperIso, name, cx, cy };

    const { svgW, svgH, svgX, svgY } = this.svgBounds;

    if (cx !== null && cy !== null) {
      const u = (cx - svgX) / svgW;
      const vNorm = (cy - svgY) / svgH;
      const shaderUvY = 1.0 - vNorm;
      const latInShader = -1.08 + (1.43 - (-1.08)) * shaderUvY;

      this.focusRotY = (0.5 - u) * 2.0 * Math.PI;
      // Cap X rotation so it tilts naturally but doesn't spin wildly vertically
      this.focusRotX = Math.max(-0.35, Math.min(0.35, latInShader)); 
    } else {
      // Map SVG Equirectangular bounds: Lon -169.11 to 190.89, Lat -55.68 to 83.62
      const u = (lon - (-169.11)) / 360.0;
      const shaderUvY = (lat - (-55.68)) / (83.62 - (-55.68));
      this.focusRotY = (0.5 - u) * 2.0 * Math.PI;
      this.focusRotX = Math.max(-0.35, Math.min(0.35, (shaderUvY - 0.5) * Math.PI));
    }

    const highlights = [];
    if (upperIso) {
      if (this.isoPathMap.has(upperIso)) {
        const pathIdx = this.isoPathMap.get(upperIso);
        highlights.push({
          type: 'path',
          pathIdx,
          color: { fill: 'rgba(255, 204, 0, 0.9)', stroke: 'rgba(255, 215, 0, 0.5)' },
          alpha: 1.0
        });
      } else if (this.isoCircleMap.has(upperIso)) {
        const circleData = this.isoCircleMap.get(upperIso);
        highlights.push({
          type: 'circle',
          cx: circleData.cx,
          cy: circleData.cy,
          color: { fill: '#ffffff', stroke: '#FFD700' },
          alpha: 1.0,
          radius: 3.5
        });
      } else if (lon !== undefined && lat !== undefined) {
        // Fallback for missing microstates (Tuvalu, Nauru)
        const u = (lon - (-169.11)) / 360.0;
        const shaderUvY = (lat - (-55.68)) / (83.62 - (-55.68));
        const vNorm = 1.0 - shaderUvY;
        const cx = u * svgW + svgX;
        const cy = vNorm * svgH + svgY;
        
        highlights.push({
          type: 'circle',
          cx, cy,
          color: { fill: '#ffffff', stroke: '#FFD700' },
          alpha: 1.0,
          radius: 4.0
        });
      }
    }

    this._currentHighlights = highlights;
    this._redrawMap(this._currentHighlights, this._activeBeacon);
  }

  /** Releases country focus and smoothly returns to scroll-based rotation */
  releaseFocus() {
    this.isFocused = false;
    this._activeBeacon = null;
    this._currentHighlights = [];
    this._redrawMap();
  }

  /**
   * Resets globe rotation and mesh position to pristine initial state (at hero top)
   * Prevents backward rotation when returning from game after scrolling to bottom.
   */
  resetToTop() {
    this.progress       = 0;
    this.targetProgress = 0;
    this.scrollRotY     = 0;
    this.currentRotY    = 0;
    this.currentRotX    = 0;
    this.focusRotY      = null;
    this.focusRotX      = null;
    this.isFocused      = false;
    this._activeBeacon  = null;
    this._currentHighlights = [];

    if (this.uniforms) {
      this.uniforms.uProgress.value = 0;
    }
    if (this.mesh) {
      this.mesh.rotation.y = 0;
      this.mesh.rotation.x = 0;
    }
    if (this.atmosMesh && this.mesh) {
      this.atmosMesh.position.copy(this.mesh.position);
    }
    this._redrawMap();
  }

  destroy() {
    cancelAnimationFrame(this._rafId);
    window.removeEventListener('themechange', this._onThemeChange);
    const canvas = this.renderer?.domElement;
    if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
    this.renderer?.dispose();
    this.texture?.dispose();
    const landing = document.getElementById('page-landing');
    landing?.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('resize', this._onResize);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  TEXTURE BUILDING — SVG → 2048×1024 canvas
  // ─────────────────────────────────────────────────────────────────────────

  _getPalette() {
    if (this.getThemePalette) return this.getThemePalette();
    // Fallback: read data-theme from html element directly
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    return isDark ? {
      background: '#0b0e12',
      pathFill:   'rgba(25,30,37,0.96)',
      pathStroke: 'rgba(238, 206, 126, 1.0)',
      circleFill: 'none',
      circleStroke: 'rgba(238, 206, 126, 1.0)',
      graticule: 'rgba(197, 155, 39, 0.12)',
      markerStroke: 'rgba(197, 155, 39, 0.42)',
      svgBackground: '#0b0e12',
      beaconCore: '#c59b27',
      beaconStroke: 'rgba(197, 155, 39, 0.60)',
      pointer: '#E26D5C',
      text: '#DFB755',
      pulses: [
        { name: 'casual', fillRgb: '197, 155, 39', stroke: '#deb648', glow: '#c59b27' },
        { name: 'speed', fillRgb: '45, 127, 103', stroke: '#5bb898', glow: '#2d7f67' },
        { name: 'reverse', fillRgb: '201, 74, 58', stroke: '#e07667', glow: '#c94a3a' }
      ]
    } : {
      background: '#EBE4D5',
      pathFill:   'rgba(210,198,178,0.97)',
      pathStroke: '#866d4d',
      circleFill: 'none',
      circleStroke: '#866d4d',
      graticule: 'rgba(100, 78, 48, 0.14)',
      markerStroke: 'rgba(100, 78, 48, 0.45)',
      svgBackground: '#EBE4D5',
      beaconCore: '#644e30',
      beaconStroke: 'rgba(100, 78, 48, 0.60)',
      pointer: '#8B2C24',
      text: '#1C160E',
      pulses: [
        { name: 'casual', fillRgb: '194, 139, 30', stroke: '#C28B1E', glow: '#AD7813' },
        { name: 'speed', fillRgb: '42, 104, 140', stroke: '#2A688C', glow: '#215473' },
        { name: 'reverse', fillRgb: '204, 64, 48', stroke: '#CC4030', glow: '#B33729' }
      ]
    };
  }

  _extractMapData() {
    this.isoPathMap = new Map();
    this.isoCircleMap = new Map();
    this.svgPaths = [];
    this.svgCircles = [];

    // Temporarily mount the SVG to the DOM to calculate exact bounding boxes for paths
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.visibility = 'hidden';
    container.style.width = '0';
    container.style.height = '0';
    container.style.pointerEvents = 'none';
    container.innerHTML = this.mapSvgString;
    document.body.appendChild(container);

    const doc = container.querySelector('svg');
    if (!doc) {
      document.body.removeChild(container);
      return;
    }

    doc.querySelectorAll('path').forEach(p => {
      const id = (p.getAttribute('id') || p.getAttribute('data-id') || '').toUpperCase();
      const d = p.getAttribute('d');
      if (d) {
        let cx = 0, cy = 0;
        try {
          const bbox = p.getBBox();
          cx = bbox.x + bbox.width / 2;
          cy = bbox.y + bbox.height / 2;
        } catch (e) {}

        this.svgPaths.push({ id, d, cx, cy, color: this._parseColor(p) });
        if (id && id.length === 2) {
          this.isoPathMap.set(id, this.svgPaths.length - 1);
        }
      }
    });

    doc.querySelectorAll('circle').forEach(c => {
      const id = (c.getAttribute('id') || c.getAttribute('data-id') || '').toUpperCase();
      const cx = parseFloat(c.getAttribute('cx') || '0');
      const cy = parseFloat(c.getAttribute('cy') || '0');
      if (id && id.length === 2) {
        this.isoCircleMap.set(id, { cx, cy });
      } else {
        this.svgCircles.push({ cx, cy });
      }
    });

    document.body.removeChild(container);
  }

  async _buildTexture() {
    const svgText = await fetch(this.svgUrl).then(r => r.text());
    this._rawSvgText = svgText; // cache for theme rebuilds
    await this._applyThemeToSvg();

    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.width  = 2048;
    this.mapCanvas.height = 1024;
    this._redrawMap();

    this.texture = new THREE.CanvasTexture(this.mapCanvas);
    if (THREE.sRGBEncoding) this.texture.encoding = THREE.sRGBEncoding;
    if (THREE.SRGBColorSpace) this.texture.colorSpace = THREE.SRGBColorSpace;
  }

  async _applyThemeToSvg() {
    const svgText = this._rawSvgText;
    const palette = this._getPalette();

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (svgEl && svgEl.hasAttribute('viewBox')) {
      const vb = svgEl.getAttribute('viewBox').trim().split(/\s+/).map(Number);
      if (vb.length === 4 && !vb.some(isNaN)) {
        this.svgBounds = { svgX: vb[0], svgY: vb[1], svgW: vb[2], svgH: vb[3] };
      }
    }
    const pathEls = doc.querySelectorAll('path');
    const circleEls = doc.querySelectorAll('circle');

    this.svgPaths = [];
    this.svgCircles = [];
    this.isoPathMap.clear();
    this.isoCircleMap.clear();

    pathEls.forEach((p, idx) => {
      const d = p.getAttribute('d');
      const id = (p.getAttribute('id') || p.getAttribute('data-id') || '').toUpperCase();
      if (d) {
        this.svgPaths.push({ id, d });
        if (id) this.isoPathMap.set(id, idx);
      }
    });

    circleEls.forEach((c) => {
      const id = (c.getAttribute('id') || c.getAttribute('data-id') || '').toUpperCase();
      const cx = parseFloat(c.getAttribute('cx'));
      const cy = parseFloat(c.getAttribute('cy'));
      const r = parseFloat(c.getAttribute('r') || '1.5');
      if (!isNaN(cx) && !isNaN(cy)) {
        this.svgCircles.push({ id, cx, cy, r });
        if (id) this.isoCircleMap.set(id, { cx, cy, r });
      }
    });

    let cleanSvg = svgText.replace(/<!DOCTYPE[\s\S]*?>/i, '');

    // Apply theme-aware palette
    cleanSvg = cleanSvg
      .replace(/<svg\b([^>]*)>/i, `<svg $1 style="background:${palette.svgBackground};">`)
      .replace(/<path\b/gi,
        `<path style="fill:${palette.pathFill};stroke:${palette.pathStroke};stroke-width:0.70;stroke-linejoin:round;" `
      )
      .replace(/<circle\b/gi,
        `<circle style="fill:${palette.circleFill};stroke:${palette.circleStroke};stroke-width:0.75;" `
      );

    const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);

    await new Promise((resolve, reject) => {
      const img  = new Image();
      img.onload = () => { this.svgImage = img; URL.revokeObjectURL(url); resolve(); };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  CONTINUOUS AMBIENT PULSE ENGINE (Brass / Cobalt / Terra Cotta)
  // ─────────────────────────────────────────────────────────────────────────

  _updateAmbientPulses(now) {
    if (this.isFocused) return;

    if (now - this._lastSpawnTime > 400 && this.activePulses.length < 6) {
      this._lastSpawnTime = now;

      const iso = PULSE_COUNTRY_POOL[this._countryPoolIdx % PULSE_COUNTRY_POOL.length];
      this._countryPoolIdx++;

      const palette = this._getPalette();
      const colorScheme = palette.pulses[this._colorIdx % palette.pulses.length];
      this._colorIdx++;

      if (this.isoPathMap.has(iso)) {
        const pathIdx = this.isoPathMap.get(iso);
        this.activePulses.push({
          type: 'path',
          pathIdx,
          color: colorScheme,
          startTime: now,
          duration: 1400
        });
      } else if (this.isoCircleMap.has(iso)) {
        const circleData = this.isoCircleMap.get(iso);
        this.activePulses.push({
          type: 'circle',
          cx: circleData.cx,
          cy: circleData.cy,
          color: colorScheme,
          startTime: now,
          duration: 1400
        });
      }
    }

    const alivePulses = [];
    const highlights = [];

    for (const p of this.activePulses) {
      const elapsed = now - p.startTime;
      const progress = elapsed / p.duration;

      if (progress < 1.0) {
        alivePulses.push(p);
        const alpha = Math.sin(progress * Math.PI);

        highlights.push({
          type: p.type,
          pathIdx: p.pathIdx,
          cx: p.cx,
          cy: p.cy,
          color: {
            fill: `rgba(${p.color.fillRgb}, ${0.85 * alpha})`,
            stroke: p.color.stroke,
            glow: p.color.glow
          },
          alpha
        });
      }
    }

    this.activePulses = alivePulses;
    this._redrawMap(highlights);
  }

  _redrawMap(highlights = [], beacon = null) {
    if (!this.mapCanvas) return;
    const ctx = this.mapCanvas.getContext('2d');
    const W = 2048, H = 1024;
    const { svgW, svgH, svgX, svgY } = this.svgBounds;
    const scaleX = W / svgW, scaleY = H / svgH;
    const palette = this._getPalette();

    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, W, H);

    // Draw base cartography
    if (this.svgImage) {
      if (beacon) {
        // Dim the base map when a dossier is hovered
        ctx.globalAlpha = 0.35;
      }
      ctx.drawImage(this.svgImage, 0, 0, W, H);
      ctx.globalAlpha = 1.0;
    }

    // Draw Field Atlas Hairline Graticules (Equator, Prime Meridian)
    ctx.save();
    ctx.strokeStyle = palette.graticule;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);

    // Equator
    const eqY = (470.9 - svgY) * scaleY;
    ctx.beginPath();
    ctx.moveTo(0, eqY);
    ctx.lineTo(W, eqY);
    ctx.stroke();

    // Prime Meridian
    const pmX = (442.5 - svgX) * scaleX;
    ctx.beginPath();
    ctx.moveTo(pmX, 0);
    ctx.lineTo(pmX, H);
    ctx.stroke();
    ctx.restore();

    // 1. Draw base SVG Microstate Circle Markers
    if (this.svgCircles.length) {
      this.svgCircles.forEach(({ cx, cy }) => {
        const mx = (cx - svgX) * scaleX;
        const my = (cy - svgY) * scaleY;

        ctx.beginPath();
        ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = palette.markerStroke;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      });
    }

    // 2. Draw glowing country highlights
    if (highlights.length) {
      highlights.forEach((h) => {
        const alpha = h.alpha !== undefined ? h.alpha : 1.0;
        if (alpha <= 0.01) return;

        if (h.type === 'circle' || (h.cx !== undefined && h.cy !== undefined)) {
          const mx = (h.cx - svgX) * scaleX;
          const my = (h.cy - svgY) * scaleY;

          const radius = h.radius || 3.5;

          ctx.save();
          // Hairline outer ring
          ctx.beginPath();
          ctx.arc(mx, my, radius * 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = h.color?.stroke || '#FFD700';
          ctx.lineWidth = 2.0 * alpha;
          ctx.stroke();

          // Radiant brass/white core
          ctx.beginPath();
          ctx.arc(mx, my, radius, 0, Math.PI * 2);
          ctx.fillStyle = h.color?.fill || '#ffffff';
          ctx.fill();
          ctx.restore();
        } else if (h.pathIdx !== undefined && this.svgPaths[h.pathIdx]) {
          const item = this.svgPaths[h.pathIdx];
          if (item && item.d) {
            ctx.save();
            ctx.translate(-svgX * scaleX, -svgY * scaleY);
            ctx.scale(scaleX, scaleY);

            const path2d = new Path2D(item.d);
            ctx.fillStyle = h.color?.fill || 'rgba(255, 204, 0, 0.9)';
            ctx.fill(path2d);
            ctx.strokeStyle = h.color?.stroke || 'rgba(255, 215, 0, 0.5)';
            ctx.lineWidth = (0.8 * alpha) / scaleX;
            ctx.stroke(path2d);
            ctx.restore();
          }
        }
      });
    }

    // No explicit pointer marker needed - the highlighted SVG path/circle
    // serves as the perfectly accurate visual indicator.

    if (this.texture) {
      this.texture.needsUpdate = true;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  THREE.JS SCENE SETUP
  // ─────────────────────────────────────────────────────────────────────────

  _setupScene() {
    this.scene = new THREE.Scene();

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(26, w / h, 0.1, 100);
    this.camera.position.set(0, 0, 4.40);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0b0e12, 0);

    const canvas = this.renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';

    this.container.appendChild(canvas);
  }

  _setupGlobeMesh() {
    const geo = new THREE.PlaneGeometry(1, 1, 128, 128);

    this.uniforms = {
      uProgress: { value: 0.0 },
      uMap:      { value: this.texture }
    };

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms:   this.uniforms,
      side:       THREE.DoubleSide,
      transparent: true
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(0, 0, 0);
    this.scene.add(this.mesh);
  }

  _setupAtmosphere() {
    // Atmosphere radius reduced by 15% from 0.93
    const geo = new THREE.SphereGeometry(0.79, 48, 48);
    const mat = new THREE.ShaderMaterial({
      vertexShader:   atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms:       { uProgress: this.uniforms.uProgress },
      side:           THREE.BackSide,
      transparent:    true,
      blending:       THREE.AdditiveBlending,
      depthWrite:     false
    });

    this.atmosMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.atmosMesh);
  }

  _bindEvents() {
    const landing = document.getElementById('page-landing');
    if (landing) landing.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onResize);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  SCROLL HANDLER
  // ─────────────────────────────────────────────────────────────────────────

  _onScroll() {
    const landing = document.getElementById('page-landing');
    const scrollY = landing ? landing.scrollTop : window.scrollY;
    const heroH   = window.innerHeight;

    const morphProgress = Math.min(Math.max(scrollY / (heroH * 0.90), 0), 1.0);
    this.targetProgress = morphProgress;
    this.scrollRotY = scrollY * 0.0028;
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  ANIMATION LOOP
  // ─────────────────────────────────────────────────────────────────────────

  _loop() {
    this._rafId = requestAnimationFrame(this._loop);

    const now = performance.now();

    // 1. Update and render continuous ambient country glows
    this._updateAmbientPulses(now);

    // 2. Smooth progress and camera
    this.progress += (this.targetProgress - this.progress) * 0.08;
    if (this.uniforms) {
      this.uniforms.uProgress.value = this.progress;
    }

    this.camera.position.set(0, 0, 4.40);
    this.camera.lookAt(0, 0, 0);

    if (this.mesh) {
      const targetY = (this.isFocused && this.focusRotY !== null) ? this.focusRotY : this.scrollRotY;
      const targetX = (this.isFocused && this.focusRotX !== null) ? this.focusRotX : 0.0;

      // 1. Shortest angular distance for Y rotation (prevents full 360 spins)
      let diffY = (targetY - this.currentRotY) % (Math.PI * 2);
      if (diffY > Math.PI) diffY -= Math.PI * 2;
      if (diffY < -Math.PI) diffY += Math.PI * 2;

      // 2. Velocity clamping: smooth, calm, gentle glide (max 0.024 rad/frame)
      const maxSpeedY = 0.024;
      const stepY = Math.sign(diffY) * Math.min(Math.abs(diffY * 0.035), maxSpeedY);
      this.currentRotY += stepY;

      // 3. Smooth latitude tilt (X rotation) with speed limit
      let diffX = targetX - this.currentRotX;
      const maxSpeedX = 0.018;
      const stepX = Math.sign(diffX) * Math.min(Math.abs(diffX * 0.035), maxSpeedX);
      this.currentRotX += stepX;

      this.mesh.rotation.y = this.currentRotY * this.progress;
      this.mesh.rotation.x = this.currentRotX * this.progress;

      if (this.atmosMesh) {
        this.atmosMesh.position.copy(this.mesh.position);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
