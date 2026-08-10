// ==========================================================================
// Two Meridian — MapNavigator
// Smooth GIS-quality zoom · pan · inertia · pinch · auto-focus · telemetry
// ==========================================================================

export class MapNavigator {
  /**
   * @param {HTMLElement} container  – #map-container: clips content, receives events
   * @param {HTMLElement} panLayer   – #map-wrapper: receives CSS transform
   * @param {Function}    onLODChange – callback(isZoomedIn: boolean)
   */
  constructor(container, panLayer, onLODChange) {
    this.container = container;
    this.panLayer = panLayer;
    this.onLODChange = onLODChange;

    // ── Transform state ──────────────────────────────────────────────────
    this.scale = 1.0;
    this.tx = 0;
    this.ty = 0;

    // ── Zoom limits ───────────────────────────────────────────────────────
    this.MIN_SCALE = 1.0;
    this.MAX_SCALE = 20.0;
    this.ZOOM_SPEED = 0.0012;   // < smaller = gentler wheel zoom
    this.LOD_THRESHOLD = 3.0;    // 3× min triggers LOD (island fade-in)
    this._dpr = window.devicePixelRatio || 1;

    // ── Pan state ─────────────────────────────────────────────────────────
    this.isPanning = false;
    this.panPointerId = null;
    this.panStartX = 0;
    this.panStartY = 0;
    this.panStartTx = 0;
    this.panStartTy = 0;

    // ── Inertia ───────────────────────────────────────────────────────────
    this.velX = 0;
    this.velY = 0;
    this.lastPanX = 0;
    this.lastPanY = 0;
    this.lastPanMs = 0;
    this.inertiaId = null;

    // ── Pinch ─────────────────────────────────────────────────────────────
    this.isPinching = false;
    this.activePointers = new Map(); // pointerId → {x, y}
    this._lastPinchDist = 0;

    // ── LOD ───────────────────────────────────────────────────────────────
    this.lodActive = false;

    // ── Cached container rect ─────────────────────────────────────────────
    this.cRect = container.getBoundingClientRect();
    this._resizeObs = new ResizeObserver(() => {
      this.cRect = this.container.getBoundingClientRect();
    });
    this._resizeObs.observe(container);

    // ── Cleanup handle ────────────────────────────────────────────────────
    this._abortCtrl = new AbortController();
    this._bind();
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Lifecycle
  // ════════════════════════════════════════════════════════════════════════

  destroy() {
    this._abortCtrl.abort();
    this._resizeObs.disconnect();
    if (this.inertiaId) cancelAnimationFrame(this.inertiaId);
    if (this._wheelAnimId) cancelAnimationFrame(this._wheelAnimId);
    if (this._panRafId) cancelAnimationFrame(this._panRafId);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Event binding
  // ════════════════════════════════════════════════════════════════════════

  _bind() {
    const s = { signal: this._abortCtrl.signal };
    const sp = { ...s, passive: false };
    const c = this.container;

    c.addEventListener('contextmenu', e => e.preventDefault(), s);
    c.addEventListener('wheel', e => this._onWheel(e), sp);
    c.addEventListener('pointerdown', e => this._onDown(e), s);
    c.addEventListener('pointermove', e => this._onMove(e), s);
    c.addEventListener('pointerup', e => this._onUp(e), s);
    c.addEventListener('pointercancel', e => this._onUp(e), s);
    c.addEventListener('dblclick', (e) => {
      if (e.target === c || e.target === this.panLayer || e.target.tagName.toLowerCase() === 'svg') {
        this.resetMap();
      }
    }, s);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Mouse wheel — sub-frame micro-glide momentum engine (Figma/Google Maps style)
  // ════════════════════════════════════════════════════════════════════════

  _onWheel(e) {
    e.preventDefault();

    const cx = e.clientX - this.cRect.left;
    const cy = e.clientY - this.cRect.top;

    if (this.inertiaId) {
      cancelAnimationFrame(this.inertiaId);
      this.inertiaId = null;
    }

    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 20;       // lines mode (Firefox)
    else if (e.deltaMode === 2) dy *= 400; // pages mode

    // If glide loop is not running, anchor target scale to current live scale
    if (!this._wheelAnimId) {
      this._wheelTargetScale = this.scale;
    }

    this._wheelCx = cx;
    this._wheelCy = cy;

    // Natural zoom delta (~18% per notch, stacks smoothly on fast spin)
    const factor = Math.exp(-dy * 0.0016);
    this._wheelTargetScale = this._clampScale(this._wheelTargetScale * factor);

    if (!this._wheelAnimId) {
      this._runWheelGlide();
    }
  }

  _runWheelGlide() {
    // Frame-rate-independent exponential decay: reaches 99% of target in ~200ms
    // at 60fps. DECAY is per-frame coefficient = 1 - e^(-16.67/TAU)
    // TAU = 80ms  → smooth but responsive
    const TAU = 80;
    let lastTime = performance.now();

    const tick = (now) => {
      const dt = Math.min(now - lastTime, 64); // cap at 64ms to avoid jump after tab switch
      lastTime = now;
      const alpha = 1 - Math.exp(-dt / TAU);
      const diff = this._wheelTargetScale - this.scale;

      if (Math.abs(diff) < 0.0004) {
        this.scale = this._wheelTargetScale;
        this._zoomToward(this._wheelCx, this._wheelCy, this.scale);
        this._wheelAnimId = null;
        this._setWillChange(false);
        return;
      }

      const nextScale = this.scale + diff * alpha;
      this._zoomToward(this._wheelCx, this._wheelCy, nextScale);

      this._wheelAnimId = requestAnimationFrame(tick);
    };

    this._setWillChange(true);
    this._wheelAnimId = requestAnimationFrame(tick);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Pointer down — left-click drag to pan (desktop) or touch pan
  // ════════════════════════════════════════════════════════════════════════

  _onDown(e) {
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Two fingers: start pinch-zoom
    if (this.activePointers.size >= 2) {
      this.isPinching = true;
      this.isPanning = false;
      this._pendingPan = false;
      this._lastPinchDist = this._pinchDist();
      return;
    }

    // Single pointer: prepare for potential pan
    const isMouse = e.pointerType === 'mouse';
    const canPan = isMouse ? e.button === 0 : true;

    if (!canPan) return;

    this._pendingPan = true;
    this._didDrag = false;
    this.panPointerId = e.pointerId;
    this.panStartX = e.clientX;
    this.panStartY = e.clientY;
    this.panStartTx = this.tx;
    this.panStartTy = this.ty;
    this.velX = 0;
    this.velY = 0;
    this.lastPanX = e.clientX;
    this.lastPanY = e.clientY;
    this.lastPanMs = performance.now();

    if (this.inertiaId) {
      cancelAnimationFrame(this.inertiaId);
      this.inertiaId = null;
    }
    if (this._wheelAnimId) {
      cancelAnimationFrame(this._wheelAnimId);
      this._wheelAnimId = null;
    }
  }

  _onMove(e) {
    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Pinch-zoom in progress
    if (this.isPinching && this.activePointers.size >= 2) {
      const dist = this._pinchDist();
      if (this._lastPinchDist > 0 && dist > 0) {
        const factor = dist / this._lastPinchDist;
        const newScale = this._clampScale(this.scale * factor);
        const center = this._pinchCenter();
        const cx = center.x - this.cRect.left;
        const cy = center.y - this.cRect.top;
        this._zoomToward(cx, cy, newScale);
      }
      this._lastPinchDist = dist;
      return;
    }

    if (!this._pendingPan && !this.isPanning) return;
    if (e.pointerId !== this.panPointerId) return;

    const dx = e.clientX - this.panStartX;
    const dy = e.clientY - this.panStartY;

    if (!this.isPanning) {
      const DRAG_THRESHOLD = 3;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      this.isPanning = true;
      this._pendingPan = false;
      this._didDrag = true;
      try {
        this.container.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    const now = performance.now();
    const dt = Math.max(1, now - this.lastPanMs);
    this.velX = (e.clientX - this.lastPanX) / dt * 16.67;
    this.velY = (e.clientY - this.lastPanY) / dt * 16.67;
    this.lastPanX = e.clientX;
    this.lastPanY = e.clientY;
    this.lastPanMs = now;

    this._targetPanTx = this.panStartTx + dx;
    this._targetPanTy = this.panStartTy + dy;

    if (!this._panRafId) {
      this._panRafId = requestAnimationFrame(() => {
        this._panRafId = null;
        this._applyTransform(this.scale, this._targetPanTx, this._targetPanTy);
      });
    }
  }

  _onUp(e) {
    this.activePointers.delete(e.pointerId);

    if (this.isPinching) {
      if (this.activePointers.size < 2) {
        this.isPinching = false;
        this._lastPinchDist = 0;
      }
      return;
    }

    if (e.pointerId !== this.panPointerId) return;

    this._pendingPan = false;
    const wasPanning = this.isPanning;
    this.isPanning = false;
    this.panPointerId = null;

    if (wasPanning) {
      try {
        this.container.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    if (Math.hypot(this.velX, this.velY) > 0.3) {
      this._runInertia();
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Public Navigation API (Zoom in, Zoom out, Reset, Focus)
  // ════════════════════════════════════════════════════════════════════════

  resetMap() {
    this._animateZoom(this.cRect.width / 2, this.cRect.height / 2, this.MIN_SCALE, 380);
  }

  zoomIn() {
    const cx = this.cRect.width / 2;
    const cy = this.cRect.height / 2;
    const targetScale = this._clampScale(this.scale * 1.6);
    this._animateZoom(cx, cy, targetScale, 300);
  }

  zoomOut() {
    const cx = this.cRect.width / 2;
    const cy = this.cRect.height / 2;
    const targetScale = this._clampScale(this.scale / 1.6);
    this._animateZoom(cx, cy, targetScale, 300);
  }

  /**
   * Smoothly focus/glide map onto an SVG path or circle element
   * @param {SVGElement} el 
   * @param {number} targetScale 
   * @param {number} duration 
   */
  focusElement(el, targetScale = 3.2, duration = 480) {
    if (!el) return;

    let centerSvgX, centerSvgY;

    if (el.tagName.toLowerCase() === 'circle') {
      centerSvgX = parseFloat(el.getAttribute('cx')) || 0;
      centerSvgY = parseFloat(el.getAttribute('cy')) || 0;
    } else {
      try {
        const bb = el.getBBox();
        centerSvgX = bb.x + bb.width / 2;
        centerSvgY = bb.y + bb.height / 2;
      } catch (e) {
        return;
      }
    }

    const svg = this.panLayer.querySelector('svg');
    if (!svg) return;

    const vb = svg.viewBox ? svg.viewBox.baseVal : null;
    const vbX = (vb && vb.width) ? vb.x : 10;
    const vbY = (vb && vb.height) ? vb.y : 248;
    const vbW = (vb && vb.width) ? vb.width : 850;
    const vbH = (vb && vb.height) ? vb.height : 455;

    const normX = (centerSvgX - vbX) / vbW;
    const normY = (centerSvgY - vbY) / vbH;

    const { width: cW, height: cH } = this.cRect;
    const finalScale = this._clampScale(targetScale);

    // Calculate target translation to center this coordinate
    const targetTx = (cW / 2) - finalScale * (normX * cW);
    const targetTy = (cH / 2) - finalScale * (normY * cH);

    this._animateToTransform(finalScale, targetTx, targetTy, duration);
  }

  /**
   * Convert clientX, clientY into approximated Lat/Long degrees
   */
  getCoordinates(clientX, clientY) {
    const rect = this.panLayer.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { lat: 0, lon: 0 };

    const normX = (clientX - rect.left) / rect.width;
    const normY = (clientY - rect.top) / rect.height;

    // Approximated Equirectangular projection coordinates
    const lon = (normX * 360) - 180;
    const lat = 90 - (normY * 180);

    return {
      lat: Math.max(-90, Math.min(90, lat)),
      lon: Math.max(-180, Math.min(180, lon))
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Animation Helpers
  // ════════════════════════════════════════════════════════════════════════

  _animateToTransform(targetScale, targetTx, targetTy, duration) {
    const t0 = performance.now();
    const sc0 = this.scale;
    const tx0 = this.tx;
    const ty0 = this.ty;

    this._setWillChange(true);

    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - p, 3); // cubic ease-out
      this._applyTransform(
        sc0 + (targetScale - sc0) * ease,
        tx0 + (targetTx - tx0) * ease,
        ty0 + (targetTy - ty0) * ease
      );
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        this._setWillChange(false);
      }
    };

    requestAnimationFrame(tick);
  }

  _animateZoom(cx, cy, targetScale, duration) {
    const t0 = performance.now();
    const sc0 = this.scale;
    const tx0 = this.tx;
    const ty0 = this.ty;
    const ratio = targetScale / sc0;
    let tx1 = cx - ratio * (cx - tx0);
    let ty1 = cy - ratio * (cy - ty0);

    if (targetScale <= this.MIN_SCALE + 0.01) {
      tx1 = 0;
      ty1 = 0;
    }

    this._setWillChange(true);

    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      this._applyTransform(
        sc0 + (targetScale - sc0) * ease,
        tx0 + (tx1 - tx0) * ease,
        ty0 + (ty1 - ty0) * ease
      );
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        this._setWillChange(false);
      }
    };

    requestAnimationFrame(tick);
  }

  _zoomToward(cx, cy, newScale) {
    const factor = newScale / this.scale;
    this._applyTransform(
      newScale,
      cx - factor * (cx - this.tx),
      cy - factor * (cy - this.ty)
    );
  }

  _applyTransform(scale, tx, ty) {
    const { width: cW, height: cH } = this.cRect;
    const scaledW = cW * scale;
    const scaledH = cH * scale;

    if (scale <= this.MIN_SCALE + 0.0001) {
      tx = 0;
      ty = 0;
    } else {
      // Smooth continuous clamping:
      const excessW = Math.max(0, scaledW - cW);
      const excessH = Math.max(0, scaledH - cH);
      const marginX = Math.min(100, excessW * 0.35);
      const marginY = Math.min(100, excessH * 0.35);

      const minTx = -excessW - marginX;
      const maxTx = marginX;
      const minTy = -excessH - marginY;
      const maxTy = marginY;

      tx = Math.min(maxTx, Math.max(minTx, tx));
      ty = Math.min(maxTy, Math.max(minTy, ty));
    }

    this.scale = scale;
    this.tx = tx;
    this.ty = ty;

    this.panLayer.style.transform =
      `translate3d(${tx.toFixed(3)}px, ${ty.toFixed(3)}px, 0) scale(${scale.toFixed(5)})`;

    // Update telemetry display if present
    const scaleEl = document.getElementById('map-scale-readout');
    if (scaleEl) {
      scaleEl.textContent = `${scale.toFixed(1)}×`;
    }

    const zoomed = scale >= this.MIN_SCALE * this.LOD_THRESHOLD;
    if (zoomed !== this.lodActive) {
      this.lodActive = zoomed;
      this.onLODChange?.(zoomed);
    }
  }

  _runInertia() {
    const FRICTION = 0.88;
    const MIN_SPEED = 0.25;

    const tick = () => {
      this.velX *= FRICTION;
      this.velY *= FRICTION;

      if (Math.hypot(this.velX, this.velY) < MIN_SPEED) {
        this.inertiaId = null;
        this._setWillChange(false);
        return;
      }

      this._applyTransform(this.scale, this.tx + this.velX, this.ty + this.velY);
      this.inertiaId = requestAnimationFrame(tick);
    };

    this.inertiaId = requestAnimationFrame(tick);
  }

  _clampScale(s) {
    return Math.min(this.MAX_SCALE, Math.max(this.MIN_SCALE, s));
  }

  _setWillChange(active) {
    // Keep willChange unset for SVG rendering so the browser's vector rasterizer
    // calculates sharp geometry at native display resolution rather than scaling a low-res GPU texture
    this.panLayer.style.willChange = '';
  }

  _pinchDist() {
    const [a, b] = [...this.activePointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  _pinchCenter() {
    const [a, b] = [...this.activePointers.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
}
