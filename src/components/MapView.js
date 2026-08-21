// ==========================================================================
// Two Meridian — MapView
// Clean SVG map loading · country highlights · adaptive glow · island borders
// ==========================================================================

import { MapNavigator } from './MapNavigator.js';
import { ConfettiEngine } from '../utils/confetti.js';
import { CertificateGenerator } from '../utils/certificateGenerator.js';

export class MapView {
  constructor(app) {
    this.app       = app;
    this.wrapper   = document.getElementById('map-wrapper');
    this.container = document.getElementById('map-container');
    this.svgElement  = null;
    this.navigator   = null;
    this.confetti    = new ConfettiEngine();

    // Cache: country id → computed glow blur radius
    this._glowCache = new Map();
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Map loading
  // ════════════════════════════════════════════════════════════════════════

  async loadMap() {
    try {
      const resp    = await fetch('./src/assets/world-map.svg');
      const svgText = await resp.text();

      this.wrapper.innerHTML = svgText;
      this.svgElement = this.wrapper.querySelector('svg');

      if (!this.svgElement) return;

      this.svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      // ── Navigation (pure drag to pan & scroll wheel to zoom at pointer) ──
      this._setupNavigator();

      // ── SVG click handler (casual mode passive learning) ───────────────
      this.svgElement.addEventListener('click', (e) => {
        const target  = e.target.closest('path, circle.country-marker');
        if (!target) return;
        const elWithId = target.closest('[id], [data-id]');
        if (!elWithId) return;
        const id = elWithId.getAttribute('data-id') || elWithId.id;
        if (id && this.app.gameEngine) {
          this.app.gameEngine.handleMapClick(id);
        }
      });

      // ── Adaptive glow ────────────────────────────────
      requestAnimationFrame(() => {
        this._setupAdaptiveGlow();
      });

    } catch (e) {
      console.error('Failed to load SVG map:', e);
      this.wrapper.innerHTML =
        '<p style="color:var(--paper-faint);text-align:center;padding-top:40px;">Map loading failed. Please refresh.</p>';
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Navigation wiring (Drag to pan · scroll to zoom at pointer)
  // ════════════════════════════════════════════════════════════════════════

  _setupNavigator() {
    this.wrapper.style.transformOrigin = '0 0';

    this.navigator = new MapNavigator(
      this.container,
      this.wrapper,
      (zoomed) => this._onLODChange(zoomed)
    );

    const calibrateBtn = document.getElementById('map-calibrate-btn');
    if (calibrateBtn) {
      calibrateBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
      calibrateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.navigator?.resetMap();
      });
    }
  }

  _onLODChange(isZoomedIn) {
    if (!this.svgElement) return;
    this.svgElement.classList.toggle('lod-zoomed', isZoomedIn);
  }

  _setupAdaptiveGlow() {
    if (!this.svgElement) return;

    const MIN_BLUR = 1;
    const MAX_BLUR = 10;
    const els = Array.from(this.svgElement.querySelectorAll('path'));

    const areas = els.map(el => {
      try {
        const bb = el.getBBox();
        return bb.width * bb.height;
      } catch { return 0; }
    });

    const maxArea = Math.max(...areas.filter(a => a > 0), 1);
    const logMax  = Math.log(maxArea + 1);

    els.forEach((el, i) => {
      const area = areas[i];
      if (area <= 0) return;
      const norm = Math.log(area + 1) / logMax;
      const blur = MIN_BLUR + (MAX_BLUR - MIN_BLUR) * norm;
      const rounded = blur.toFixed(1);
      el.style.setProperty('--glow-blur', `${rounded}px`);
      const id = el.id || el.getAttribute('data-id');
      if (id) this._glowCache.set(id.toUpperCase(), rounded);
    });
  }

  removeIslandMarker(countryId) {
    // No-op (island markers follow normal country paths)
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Country Highlighting (Crisp & Vibrant Illumination, NO Auto-Zooming)
  // ════════════════════════════════════════════════════════════════════════

  highlightCountry(countryId, mode) {
    if (!this.svgElement) return;
    const lowerId = countryId.toLowerCase();

    const els = Array.from(
      this.svgElement.querySelectorAll(`[id="${lowerId}"], [data-id="${lowerId}"]`)
    );

    if (els.length === 0) {
      console.warn(`SVG path not found for: ${countryId}`);
      return;
    }

    els.forEach(el => {
      el.classList.remove('guessed-casual', 'guessed-speed', 'guessed-reverse', 'passive-active', 'just-discovered');
      el.classList.add(`guessed-${mode}`, 'just-discovered');

      setTimeout(() => {
        el.classList.remove('just-discovered');
      }, 1200);
    });

    // Remove the island border highlight
    this.removeIslandMarker(countryId);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Reverse Mode Highlighting
  // ════════════════════════════════════════════════════════════════════════

  setMode(mode) {
    if (this.container) {
      this.container.setAttribute('data-mode', mode);
      if (mode !== 'reverse') {
        this.setReverseActiveState(false);
      }
    }
  }

  setReverseActiveState(isActive) {
    if (!this.container) return;
    if (isActive) {
      this.container.setAttribute('data-reverse-active', 'true');
      this.container.classList.add('reverse-active-game');
    } else {
      this.container.removeAttribute('data-reverse-active');
      this.container.classList.remove('reverse-active-game');
    }
  }

  highlightForReverse(countryId) {
    if (!this.svgElement) return;
    this.clearReverseHighlight();

    const lowerId = countryId.toLowerCase();
    const els = Array.from(
      this.svgElement.querySelectorAll(`[id="${lowerId}"], [data-id="${lowerId}"]`)
    );
    els.forEach(el => {
      el.classList.remove('reverse-active');
      void el.offsetWidth; // Trigger reflow for one-shot animation
      el.classList.add('reverse-active');
    });
  }

  clearReverseHighlight() {
    if (!this.svgElement) return;
    this.svgElement.querySelectorAll('.reverse-active')
      .forEach(el => el.classList.remove('reverse-active'));
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Passive (Casual Click) Highlight
  // ════════════════════════════════════════════════════════════════════════

  highlightPassive(countryId) {
    if (!this.svgElement) return;
    this.clearPassiveHighlight();

    const lowerId = countryId.toLowerCase();
    const els = Array.from(
      this.svgElement.querySelectorAll(`[id="${lowerId}"], [data-id="${lowerId}"]`)
    );
    els.forEach(el => {
      if (!el.classList.contains('guessed-casual')) {
        el.classList.add('passive-active');
      }
    });
  }

  clearPassiveHighlight() {
    if (!this.svgElement) return;
    this.svgElement.querySelectorAll('.passive-active')
      .forEach(el => el.classList.remove('passive-active'));
  }

  // ════════════════════════════════════════════════════════════════════════
  //  Victory Celebrations
  // ════════════════════════════════════════════════════════════════════════

  triggerCasualCelebration() {
    this.app.playSound('victory');
    this.confetti.burstCasual();

    const overlay = document.createElement('div');
    overlay.className = 'victory-overlay fade-in';
    overlay.innerHTML = `
      <div class="victory-card casual-theme debrief-style">
        <span class="debrief-corner top-left" aria-hidden="true">◆</span>
        <span class="debrief-corner top-right" aria-hidden="true">◆</span>
        <span class="debrief-corner bottom-left" aria-hidden="true">◆</span>
        <span class="debrief-corner bottom-right" aria-hidden="true">◆</span>

        <div class="victory-header-group">
          <div class="victory-badge">◈ CASUAL SURVEY · 196 TARGETS</div>
          <h1 class="victory-title">Atlas Charting Complete</h1>
          <div class="victory-subtitle">All 196 sovereign nations identified across 6 continents.</div>
        </div>

        <div class="victory-distilled-telemetry">
          <div class="distilled-hero-stat">
            <span class="distilled-hero-val highlight">196 / 196</span>
            <span class="distilled-hero-lbl">GLOBAL COVERAGE · 100%</span>
          </div>
          <div class="distilled-meta-row">
            <div class="distilled-meta-cell">
              <span class="distilled-meta-val">6 / 6</span>
              <span class="distilled-meta-lbl">CONTINENTS</span>
            </div>
            <div class="distilled-meta-divider"></div>
            <div class="distilled-meta-cell">
              <span class="distilled-meta-val">Master</span>
              <span class="distilled-meta-lbl">RANK</span>
            </div>
          </div>
        </div>

        <div class="victory-creator-note">
          <div class="creator-note-header">
            <span class="note-glyph">◈</span>
            <span>DISPATCH FROM NEO</span>
          </div>
          <p class="creator-note-body">
            "ahh i see..i hope it was fun knowing new countries you werent aware of..you had your fun going through them but do you have the guts to spear through the speed mode? purely time based with no clicking countries to know their name..i guess you would need to rehearse quite more in casual mode haha...see you in speed mode soon."
          </p>
        </div>

        <div class="victory-actions">
          <button class="victory-next-btn" id="btn-victory-try-speed">Take On Speed Mode →</button>
          <button class="victory-close-btn" id="btn-victory-close">Keep Admiring Map</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btn-victory-try-speed')?.addEventListener('click', () => {
      overlay.remove();
      this.app.setMode('speed');
    });
    document.getElementById('btn-victory-close')?.addEventListener('click', () => {
      overlay.remove();
    });
  }

  triggerSpeedCelebration(timeMs = 0) {
    this.app.playSound('victory');
    this.confetti.burstSpeed();

    const mins = Math.floor(timeMs / 60000);
    const secs = Math.floor((timeMs % 60000) / 1000);
    const centis = Math.floor((timeMs % 1000) / 10);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
    const secPerCountry = timeMs > 0 ? (timeMs / 1000 / 196).toFixed(1) + 's' : '0.0s';

    const overlay = document.createElement('div');
    overlay.className = 'victory-overlay fade-in';
    overlay.innerHTML = `
      <div class="victory-card speed-theme debrief-style">
        <span class="debrief-corner top-left" aria-hidden="true">◆</span>
        <span class="debrief-corner top-right" aria-hidden="true">◆</span>
        <span class="debrief-corner bottom-left" aria-hidden="true">◆</span>
        <span class="debrief-corner bottom-right" aria-hidden="true">◆</span>

        <div class="victory-header-group">
          <div class="victory-badge">◈ SPEED CHRONOMETER · 196 TARGETS</div>
          <h1 class="victory-title">Speed Run Complete</h1>
          <div class="victory-subtitle">All 196 sovereign nations charted under timed chronometer pressure.</div>
        </div>

        <div class="victory-distilled-telemetry">
          <div class="distilled-hero-stat">
            <span class="distilled-hero-val highlight">${timeStr}</span>
            <span class="distilled-hero-lbl">FINAL CHRONOMETER TIME</span>
          </div>
          <div class="distilled-meta-row">
            <div class="distilled-meta-cell">
              <span class="distilled-meta-val">196 / 196</span>
              <span class="distilled-meta-lbl">TERRITORIES</span>
            </div>
            <div class="distilled-meta-divider"></div>
            <div class="distilled-meta-cell">
              <span class="distilled-meta-val">${secPerCountry}</span>
              <span class="distilled-meta-lbl">AVG PACE</span>
            </div>
            <div class="distilled-meta-divider"></div>
            <div class="distilled-meta-cell">
              <span class="distilled-meta-val">Active</span>
              <span class="distilled-meta-lbl">LEADERBOARD</span>
            </div>
          </div>
        </div>

        <div class="victory-creator-note">
          <div class="creator-note-header">
            <span class="note-glyph">◈</span>
            <span>DISPATCH FROM NEO</span>
          </div>
          <p class="creator-note-body">
            "oh wow..great speed and accuracy....try maintaining your streak from next time....you are not ready to experience and go through this reverse mode..like it takes a lot of brain power to map down countries ...keep playing casual and speed and then we will see if you are really ready to take on reverse mode..HAHAHA.."
          </p>
        </div>

        <div class="victory-actions">
          <button class="victory-next-btn" id="btn-victory-try-reverse">Try Reverse Mode →</button>
          <button class="victory-close-btn" id="btn-victory-close-speed">Inspect Map</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btn-victory-try-reverse')?.addEventListener('click', () => {
      overlay.remove();
      this.app.setMode('reverse');
    });
    document.getElementById('btn-victory-close-speed')?.addEventListener('click', () => {
      overlay.remove();
      this.app.gameEngine.resetAllProgress();
    });
  }

  triggerReverseCelebration(data = {}) {
    this.app.playSound('victory');
    this.confetti.burstReverse();

    const timeMs = data.elapsedMs || 0;
    const skipped = data.reverseSkipped || 0;
    const total = this.app.countriesData ? this.app.countriesData.length : 196;
    const accuracy = total > 0 ? Math.round((total / (total + skipped)) * 100) : 100;

    const mins = Math.floor(timeMs / 60000);
    const secs = Math.floor((timeMs % 60000) / 1000);
    const centis = Math.floor((timeMs % 1000) / 10);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
    const paceStr = timeMs > 0 ? (timeMs / 1000 / total).toFixed(1) + 's' : '0.0s';
    const streakStr = skipped === 0 ? '0 Skips' : `${skipped} Skips`;

    const overlay = document.createElement('div');
    overlay.className = 'victory-overlay fade-in';
    overlay.innerHTML = `
      <div class="victory-card reverse-theme debrief-style">
        <span class="debrief-corner top-left" aria-hidden="true">◆</span>
        <span class="debrief-corner top-right" aria-hidden="true">◆</span>
        <span class="debrief-corner bottom-left" aria-hidden="true">◆</span>
        <span class="debrief-corner bottom-right" aria-hidden="true">◆</span>

        <div class="victory-header-group">
          <div class="victory-badge">◈ PLANETARY REVERSE DEDUCTION · 100% COGNITION</div>
          <h1 class="victory-title">Planetary Cognition Complete</h1>
          <div class="victory-subtitle">196 of 196 sovereign territories deduced from isolated spatial geometry.</div>
        </div>

        <div class="victory-distilled-telemetry">
          <div class="distilled-hero-stat">
            <span class="distilled-hero-val highlight">${accuracy}%</span>
            <span class="distilled-hero-lbl">DEDUCTION ACCURACY</span>
          </div>
          <div class="distilled-meta-row">
            <div class="distilled-meta-cell">
              <span class="distilled-meta-val">${timeStr}</span>
              <span class="distilled-meta-lbl">CHRONOMETER</span>
            </div>
            <div class="distilled-meta-divider"></div>
            <div class="distilled-meta-cell">
              <span class="distilled-meta-val">${paceStr}</span>
              <span class="distilled-meta-lbl">PACE / TARGET</span>
            </div>
            <div class="distilled-meta-divider"></div>
            <div class="distilled-meta-cell">
              <span class="distilled-meta-val">${streakStr}</span>
              <span class="distilled-meta-lbl">STREAK LOG</span>
            </div>
          </div>
        </div>

        <div class="victory-creator-note">
          <div class="creator-note-header">
            <span class="note-glyph">◈</span>
            <span>DISPATCH FROM NEO</span>
          </div>
          <p class="creator-note-body">
            "oh MY goodnesss..you really did it..i hope you didnt cheat into this...this is an extraordinary feat to perform and you should be proud of yourself..like i am proud of you..."
          </p>
        </div>

        <div class="victory-actions">
          <button class="victory-next-btn" id="btn-victory-replay-reverse">New Expedition</button>
          <button class="victory-close-btn" id="btn-victory-inspect-reverse">Inspect Map</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btn-victory-replay-reverse')?.addEventListener('click', () => {
      overlay.remove();
      this.app.gameEngine.resetAllProgress();
    });

    document.getElementById('btn-victory-inspect-reverse')?.addEventListener('click', () => {
      overlay.remove();
    });
  }

  triggerExpeditionDebrief(data = {}) {
    this.app.playSound('victory');

    const mode = data.mode || 'casual';
    const score = data.score || 0;
    const total = data.total || 196;
    const timeMs = data.elapsedMs || 0;
    const pct = ((score / total) * 100).toFixed(1);

    let paceStr = '—';
    if (score > 0 && timeMs > 0) {
      const secPerTerritory = (timeMs / 1000 / score).toFixed(1);
      paceStr = `${secPerTerritory}s / territory`;
    } else if (score > 0) {
      paceStr = `${score} charted`;
    }

    const mins = Math.floor(timeMs / 60000);
    const secs = Math.floor((timeMs % 60000) / 1000);
    const centis = Math.floor((timeMs % 1000) / 10);
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;

    const modeTitles = {
      casual: 'Casual Field Survey',
      speed: 'Speed Chronometer Run',
      reverse: 'Reverse Radar Run'
    };

    const overlay = document.createElement('div');
    overlay.className = 'victory-overlay fade-in';
    overlay.id = 'expedition-debrief-overlay';
    overlay.innerHTML = `
      <div class="victory-card debrief-card" data-mode="${mode}">
        <span class="debrief-corner top-left" aria-hidden="true">◆</span>
        <span class="debrief-corner top-right" aria-hidden="true">◆</span>
        <span class="debrief-corner bottom-left" aria-hidden="true">◆</span>
        <span class="debrief-corner bottom-right" aria-hidden="true">◆</span>

        <div class="debrief-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;">
            <circle cx="12" cy="9" r="6"/>
            <path d="M12 6v6M9 9h6"/>
            <path d="M8.5 14.5L6.5 22l5.5-2.5 5.5 2.5-2-7.5"/>
          </svg>
          <span>Field Atlas Log</span>
        </div>

        <div class="debrief-compass-wrap">
          <svg class="debrief-compass-svg" width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <!-- Top suspension crown loop -->
            <circle cx="32" cy="4" r="3" stroke="var(--brass-500)" stroke-width="1.2" fill="none"/>
            <rect x="30.5" y="6.5" width="3" height="2" fill="var(--brass-500)"/>
            
            <!-- Outer casing rings -->
            <circle cx="32" cy="36" r="24.5" stroke="var(--brass-500)" stroke-width="1.5" fill="rgba(197, 155, 39, 0.03)"/>
            <circle cx="32" cy="36" r="22.5" stroke="var(--hairline)" stroke-width="0.8"/>
            
            <!-- Cardinal and Radial Dial Ticks -->
            <line x1="32" y1="13.5" x2="32" y2="17.5" stroke="var(--brass-400)" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="48" y1="20" x2="45" y2="23" stroke="var(--brass-500)" stroke-width="0.9" stroke-linecap="round" opacity="0.65"/>
            <line x1="54.5" y1="36" x2="50.5" y2="36" stroke="var(--brass-400)" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="48" y1="52" x2="45" y2="49" stroke="var(--brass-500)" stroke-width="0.9" stroke-linecap="round" opacity="0.65"/>
            <line x1="32" y1="58.5" x2="32" y2="54.5" stroke="var(--brass-400)" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="16" y1="52" x2="19" y2="49" stroke="var(--brass-500)" stroke-width="0.9" stroke-linecap="round" opacity="0.65"/>
            <line x1="9.5" y1="36" x2="13.5" y2="36" stroke="var(--brass-400)" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="16" y1="20" x2="19" y2="23" stroke="var(--brass-500)" stroke-width="0.9" stroke-linecap="round" opacity="0.65"/>

            <!-- Fine Cardinal Lettering -->
            <text x="32" y="23.5" font-family="var(--font-mono)" font-size="4.2" font-weight="700" fill="var(--brass-400)" text-anchor="middle">N</text>
            <text x="47" y="37.5" font-family="var(--font-mono)" font-size="3.8" font-weight="600" fill="var(--paper-faint)" text-anchor="middle">E</text>
            <text x="32" y="52" font-family="var(--font-mono)" font-size="3.8" font-weight="600" fill="var(--paper-faint)" text-anchor="middle">S</text>
            <text x="17" y="37.5" font-family="var(--font-mono)" font-size="3.8" font-weight="600" fill="var(--paper-faint)" text-anchor="middle">W</text>
            
            <!-- Two-tone North Needle (Brass) -->
            <polygon points="32,18 35.5,36 32,36" fill="var(--brass-400)"/>
            <polygon points="32,18 28.5,36 32,36" fill="var(--brass-600)"/>
            
            <!-- Two-tone South Needle (Paper Muted) -->
            <polygon points="32,54 35.5,36 32,36" fill="var(--paper-muted)" opacity="0.45"/>
            <polygon points="32,54 28.5,36 32,36" fill="var(--paper-faint)" opacity="0.25"/>
            
            <!-- Central pivot point -->
            <circle cx="32" cy="36" r="3.2" fill="var(--ink-900)" stroke="var(--brass-500)" stroke-width="1.4"/>
            <circle cx="32" cy="36" r="1.1" fill="var(--brass-400)"/>
          </svg>
        </div>

        <h1>Expedition Summary</h1>
        <div class="debrief-mode-tag">${modeTitles[mode] || mode}</div>
        
        <div class="debrief-ledger">
          <div class="debrief-ledger-row primary-stat">
            <span class="debrief-ledger-label">Territories Charted</span>
            <span class="debrief-ledger-dots" aria-hidden="true"></span>
            <span class="debrief-ledger-value">${score} <span class="debrief-ledger-total">/ ${total}</span></span>
          </div>
          <div class="debrief-ledger-row secondary-stat">
            <span class="debrief-ledger-label">Atlas Coverage</span>
            <span class="debrief-ledger-dots" aria-hidden="true"></span>
            <span class="debrief-ledger-value">${pct}%</span>
          </div>
          <div class="debrief-ledger-row secondary-stat">
            <span class="debrief-ledger-label">Time Elapsed</span>
            <span class="debrief-ledger-dots" aria-hidden="true"></span>
            <span class="debrief-ledger-value">${timeStr}</span>
          </div>
          <div class="debrief-ledger-row secondary-stat">
            <span class="debrief-ledger-label">Survey Pace</span>
            <span class="debrief-ledger-dots" aria-hidden="true"></span>
            <span class="debrief-ledger-value">${paceStr}</span>
          </div>
        </div>

        <div class="debrief-share-box">
          <div class="debrief-share-title">📜 Share Expedition Certificate</div>
          <div class="debrief-share-btns">
            <button class="debrief-share-btn" id="btn-share-text">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              <span>Copy Results Grid</span>
            </button>
            <button class="debrief-share-btn secondary" id="btn-share-image">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>Download Stamp Card</span>
            </button>
          </div>
        </div>

        <div class="debrief-actions">
          <button class="debrief-conclude-btn" id="btn-debrief-confirm-conclude">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;">
              <circle cx="12" cy="9" r="7"/>
              <polyline points="9 9 11 11 15 7"/>
              <path d="M8.5 15L6.5 22l5.5-2.5 5.5 2.5-2-7"/>
            </svg>
            <span>Conclude & Save to Stats</span>
          </button>
          <button class="debrief-resume-btn" id="btn-debrief-resume">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;">
              <line x1="4" y1="12" x2="20" y2="12"/>
              <polyline points="13 5 20 12 13 19"/>
            </svg>
            <span>Keep Charting</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Wire Share Handlers
    document.getElementById('btn-share-text')?.addEventListener('click', () => {
      const shareText = CertificateGenerator.generateTextShare({
        mode,
        score,
        total,
        elapsedMs: timeMs,
        streakCount: data.streakCount || 0,
        continentStats: data.continentStats
      });

      navigator.clipboard.writeText(shareText).then(() => {
        this.app.sidebar.showInputFeedback('Expedition grid copied to clipboard! 📋', 'correct');
      });
    });

    document.getElementById('btn-share-image')?.addEventListener('click', async () => {
      this.app.sidebar.showInputFeedback('Generating certificate stamp...', '');
      const dataUrl = await CertificateGenerator.generateCanvasImage({
        mode,
        score,
        total,
        elapsedMs: timeMs,
        streakCount: data.streakCount || 0,
        continentStats: data.continentStats
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `TwoMeridian-Certificate-${Date.now()}.png`;
      a.click();
      this.app.sidebar.showInputFeedback('Expedition stamp downloaded! 📜', 'correct');
    });

    document.getElementById('btn-debrief-confirm-conclude')?.addEventListener('click', () => {
      overlay.remove();
      this.app.gameEngine.finalizeExpedition();
    });

    document.getElementById('btn-debrief-resume')?.addEventListener('click', () => {
      overlay.remove();
      if (score < total && timeMs > 0) {
        this.app.gameEngine.startTimer();
      }
    });
  }
}
