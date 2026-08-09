// ==========================================================================
// Two Meridian — "Field Atlas" Cartographic Landing Page
// Engraved typography, archival expedition dossiers & 3D globe linkage
// ==========================================================================

import { GlobeAnimation } from './GlobeAnimation.js';

export class LandingPage {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('page-landing');
    this._globe = null;
  }

  async init() {
    this._buildHTML();
    this._bindCTA();
    this._bindDossierInteractions();
    this._bindCoffeeTipOptions();
    this._bindThemeToggle();
    this._initGlobe();
    this._updateThemeIcon();
    await this._waitForAnime();
    this._animateHero();
    this._initScrollAnimations();
    this._detectUserCountry();
  }

  // ================================================================
  //  GLOBE INITIALIZATION
  // ================================================================
  _initGlobe() {
    const container = document.getElementById('landing-globe-bg');
    if (!container) return;
    this._globe = new GlobeAnimation(container);
    this._globe.init().catch(e => console.warn('GlobeAnimation init failed:', e));
  }

  _waitForAnime() {
    return new Promise(resolve => {
      const check = () => {
        if (window.anime) resolve(window.anime);
        else setTimeout(check, 30);
      };
      check();
    });
  }

  // ================================================================
  //  HTML ARCHITECTURE
  // ================================================================
  _buildHTML() {
    this.el.innerHTML = `
      <!-- Fixed 3D Globe Canvas Layer -->
      <div class="landing-globe-bg" id="landing-globe-bg"></div>

      <!-- Sticky Landing Header -->
      <header class="landing-header" id="landing-header">
        <div class="landing-logo">Two Meridian</div>
        <div class="landing-nav-actions">
          <button id="landing-leaderboard-btn" class="nav-icon-btn" title="Daily Leaderboards" aria-label="Leaderboards">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M8 21h8m-4-4v4m0-4V3m0 14a7 7 0 1 0 0-14 7 7 0 0 0 0 14z"/>
            </svg>
          </button>
          
          <button id="landing-theme-toggle" class="nav-icon-btn landing-theme-toggle" title="Toggle light/dark mode" aria-label="Toggle theme">
            <svg class="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <line x1="12" y1="2" x2="12" y2="5"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
              <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
              <line x1="2" y1="12" x2="5" y2="12"/>
              <line x1="19" y1="12" x2="22" y2="12"/>
              <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
              <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
            </svg>
            <svg class="theme-icon-moon hidden" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>

          <!-- Auth Controls for Landing Page -->
          <button id="landing-auth-btn" class="nav-link auth-btn">Sign In</button>
          <div id="landing-auth-user" class="auth-user-menu hidden">
            <span id="landing-auth-alias" class="auth-alias">Alias</span>
            <button id="landing-auth-logout" class="nav-icon-btn" title="Sign Out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- ── SECTION 1: HERO ────────────────────────────────────── -->
      <section class="landing-hero" id="landing-hero">
        <div class="hero-content">
          <h2 class="hero-headline" id="hero-headline">
            The World Is Yours <span class="hero-italic">to Master</span>
          </h2>
          <div class="hero-divider-rule"></div>
          <p class="hero-sub" id="hero-sub">
            A precision cartographic study of sovereign borders, political territories, and rapid global recall.
          </p>

          <div class="hero-actions" id="hero-actions">
            <button class="hero-cta" id="landing-cta" data-mode="casual">
              <span>Explore the Atlas</span>
              <span class="cta-arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ── SECTION 2: CORE DISCIPLINES ────────────────────────── -->
      <section class="landing-features" id="landing-features">
        <div class="section-header" id="features-header">
          <div class="header-badge">
            <span class="badge-glyph">◈</span>
            <span>THREE MAIN DISCIPLINES</span>
          </div>
          <h2 class="section-title">Master the World Your Way</h2>
          <p class="section-desc">
            Three handcrafted disciplines tailored for relaxed discovery, lightning-fast typing streaks, or reverse deduction.
          </p>
        </div>

        <div class="features-grid">
          <!-- Discipline 01: Casual -->
          <div class="feature-panel" data-mode="casual" role="button" tabindex="0">
            <div class="panel-top-rule"></div>
            <div class="panel-header">
              <span class="panel-num">01 // UNTIMED</span>
              <span class="panel-badge">CASUAL STUDY</span>
            </div>
            <h3 class="panel-title">Casual Mode</h3>
            <p class="panel-desc">
              Explore every sovereign boundary at your own pace. Filter by continent, zoom seamlessly, and watch each territory illuminate as you type.
            </p>
            <div class="panel-meta-mono">NO TIME LIMIT · 6 CONTINENTS · AMBER CHARTS</div>
            <div class="panel-footer">
              <span class="panel-link">Launch Casual Map</span>
              <span class="panel-arrow">→</span>
            </div>
          </div>

          <!-- Discipline 02: Speed Run -->
          <div class="feature-panel" data-mode="speed" role="button" tabindex="0">
            <div class="panel-top-rule"></div>
            <div class="panel-header">
              <span class="panel-num">02 // TIMED</span>
              <span class="panel-badge">SPEED RUN</span>
            </div>
            <h3 class="panel-title">Speed Run</h3>
            <p class="panel-desc">
              Race against the horological countdown. Build combo streaks, rack up score multipliers, and see how many nations you can name before zero.
            </p>
            <div class="panel-meta-mono">STOPWATCH READOUT · STREAK MULTIPLIERS · INSTRUMENT ACCENTS</div>
            <div class="panel-footer">
              <span class="panel-link">Enter Speed Run</span>
              <span class="panel-arrow">→</span>
            </div>
          </div>

          <!-- Discipline 03: Reverse Mode -->
          <div class="feature-panel" data-mode="reverse" role="button" tabindex="0">
            <div class="panel-top-rule"></div>
            <div class="panel-header">
              <span class="panel-num">03 // INFERENCE</span>
              <span class="panel-badge">REVERSE DEDUCTION</span>
            </div>
            <h3 class="panel-title">Reverse Mode</h3>
            <p class="panel-desc">
              The map isolates a mystery border and provides geographic telemetry. Deduce the territory, enter the sovereign name, and test deep spatial recall.
            </p>
            <div class="panel-meta-mono">BORDER HIGHLIGHTS · GEOGRAPHIC CLUES · SPATIAL RECALL</div>
            <div class="panel-footer">
              <span class="panel-link">Play Reverse Mode</span>
              <span class="panel-arrow">→</span>
            </div>
          </div>
        </div>

        <!-- Secondary Modes Ribbon -->
        <div class="secondary-modes-bar">
          <span class="secondary-label">Additional Cartographic Trials:</span>
          <button class="secondary-pill" data-page="capitals">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="20" width="20" height="2" rx="0.5"/>
              <rect x="5" y="10" width="2" height="10"/>
              <rect x="11" y="10" width="2" height="10"/>
              <rect x="17" y="10" width="2" height="10"/>
              <path d="M1 10h22M12 3l10 7H2z"/>
            </svg>
            <span>Administrative Capitals [196]</span>
          </button>
          <button class="secondary-pill" data-page="flags">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>
            </svg>
            <span>Sovereign Standards & Flags [196]</span>
          </button>
        </div>
      </section>

      <!-- ── SECTION 3: FLANKING FIELD STUDY ────────────────────── -->
      <section class="landing-dossiers" id="landing-dossiers">
        <div class="section-header" id="dossiers-header">
          <div class="header-badge">
            <span class="badge-glyph">⌖</span>
            <span>GLOBAL FIELD STUDY // 6 SOVEREIGN REALMS</span>
          </div>
          <h2 class="section-title">Cartography Beyond the Ordinary</h2>
          <p class="section-desc">
            Hover any dossier to smoothly rotate the globe and focus on its exact cartographic marker.
          </p>
        </div>

        <div class="dossier-wings-container">
          <!-- Left Wing: 3 Slim Cards -->
          <div class="dossier-wing wing-left" id="wing-left">
            ${this._renderDossierCard({
              num: '01',
              name: 'Vatican City',
              iso: 'VA',
              coords: '41°54′ N · 12°27′ E',
              lon: 12.45,
              lat: 41.90,
              tagline: 'Smallest Independent State on Earth',
              desc: 'Encompasses 0.49 km² inside Rome with ~800 citizens and historic St. Peter’s Basilica.',
              stats: [
                { k: 'AREA', v: '0.49 km²' },
                { k: 'SEAT', v: 'Holy See' },
                { k: 'POP', v: '~800' }
              ]
            })}

            ${this._renderDossierCard({
              num: '02',
              name: 'Tuvalu',
              iso: 'TV',
              coords: '8°31′ S · 179°11′ E',
              lon: 179.19,
              lat: -8.52,
              tagline: 'Pacific Atoll of Virtual Sovereignty',
              desc: 'Nine reef islands under 4.6m elevation. Leasing its .tv domain powers key national revenue.',
              stats: [
                { k: 'MAX ELEV', v: '4.6 m' },
                { k: 'TLD', v: '.tv' },
                { k: 'POP', v: '~11.2k' }
              ]
            })}

            ${this._renderDossierCard({
              num: '03',
              name: 'Lesotho',
              iso: 'LS',
              coords: '29°35′ S · 28°14′ E',
              lon: 28.23,
              lat: -29.58,
              tagline: 'The Kingdom in the Sky',
              desc: 'A high-altitude enclave entirely surrounded by South Africa, with its lowest point at 1,400 meters.',
              stats: [
                { k: 'BASE ELEV', v: '1,400 m' },
                { k: 'TYPE', v: 'Enclave' },
                { k: 'CAPITAL', v: 'Maseru' }
              ]
            })}
          </div>

          <!-- Right Wing: 3 Slim Cards -->
          <div class="dossier-wing wing-right" id="wing-right">
            ${this._renderDossierCard({
              num: '04',
              name: 'St. Vincent & Grenadines',
              iso: 'VC',
              coords: '13°15′ N · 61°12′ W',
              lon: -61.20,
              lat: 13.25,
              tagline: 'Volcanic Island Archipelago',
              desc: 'Comprises a volcanic main island (St. Vincent) and a chain of 32 smaller islands in the Caribbean Sea.',
              stats: [
                { k: 'ISLANDS', v: '32' },
                { k: 'VOLCANO', v: 'La Soufrière' },
                { k: 'CAPITAL', v: 'Kingstown' }
              ]
            })}

            ${this._renderDossierCard({
              num: '05',
              name: 'Nauru',
              iso: 'NR',
              coords: '0°32′ S · 166°55′ E',
              lon: 166.93,
              lat: -0.52,
              tagline: 'Republic Without an Official Capital',
              desc: 'At 21 km², Nauru is the world’s smallest island republic. Governance convenes in Yaren District.',
              stats: [
                { k: 'AREA', v: '21 km²' },
                { k: 'POP', v: '~10.8k' },
                { k: 'YEAR', v: '1968' }
              ]
            })}

            ${this._renderDossierCard({
              num: '06',
              name: 'Bhutan',
              iso: 'BT',
              coords: '27°30′ N · 90°30′ E',
              lon: 90.50,
              lat: 27.50,
              tagline: 'Carbon Negative Kingdom',
              desc: 'A Himalayan nation that measures Gross National Happiness and absorbs more carbon than it emits.',
              stats: [
                { k: 'PHILOSOPHY', v: 'GNH' },
                { k: 'FORESTS', v: '71%' },
                { k: 'CAPITAL', v: 'Thimphu' }
              ]
            })}
          </div>
        </div>
      </section>

      <!-- ── SECTION 4: PHILOSOPHY / "BUILT FOR THE CURIOUS MIND" ── -->
      <section class="landing-about" id="landing-about">
        <div class="section-header">
          <div class="header-badge">
            <span class="badge-glyph">✦</span>
            <span>PHILOSOPHY // CRAFT & INTEGRITY</span>
          </div>
          <h2 class="section-title">Built for the Curious Mind</h2>
          <p class="section-desc">
            Two Meridian was created as a clean, respectful digital atlas. No algorithmic clutter, no subscription walls.
          </p>
        </div>

        <div class="about-grid">
          <div class="about-card">
            <div class="about-top-rule"></div>
            <div class="about-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
              </svg>
            </div>
            <h3 class="about-card-title">Pure Cartographic Focus</h3>
            <p class="about-card-desc">
              Zero advertisements, zero user tracking, and no required accounts. Just an uninterrupted canvas for geographic exploration and spatial practice.
            </p>
          </div>

          <div class="about-card">
            <div class="about-top-rule"></div>
            <div class="about-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2v20M12 5l-7 14M12 5l7 14M7 15h10M12 2l-3 4h6z"/>
              </svg>
            </div>
            <h3 class="about-card-title">196 Sovereign Borders</h3>
            <p class="about-card-desc">
              Every nation is drafted through hand-curated, vector-optimized SVG geometry conforming to recognized sovereign state standards.
            </p>
          </div>

          <div class="about-card">
            <div class="about-top-rule"></div>
            <div class="about-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="13" r="8"/>
                <path d="M12 9v4l2.5 2.5M12 5V2M10 2h4"/>
              </svg>
            </div>
            <h3 class="about-card-title">Active Spatial Recall</h3>
            <p class="about-card-desc">
              Engineered with cognitive retrieval techniques — combining instant interactive typing, spatial feedback, and speed trials.
            </p>
          </div>
        </div>
      </section>

      <!-- ── SECTION 5: EXPEDITION SUPPORT (Archival Ledger) ─────── -->
      <section class="landing-support" id="landing-support">
        <div class="ledger-card">
          <div class="ledger-header">
            <div class="ledger-stamp">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10" stroke-dasharray="2 2"/>
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <span class="ledger-eyebrow">EXPEDITION LOG // ARCHIVAL SUPPORT</span>
            <h2 class="ledger-title">Fuel the Cartography Expedition</h2>
            <p class="ledger-desc">
              Two Meridian is an independent, ad-free cartography archive. Support ongoing chart maintenance, territory telemetry, and future releases with an expedition ration.
            </p>
          </div>

          <!-- Archival Ledger Table with Dotted Leaders -->
          <div class="ledger-table" id="tip-options">
            <div class="ledger-row tip-btn" data-amt="3" role="button" tabindex="0">
              <span class="ledger-item">Cartographer’s Espresso</span>
              <span class="ledger-dots"></span>
              <span class="ledger-price">$3.00</span>
            </div>
            <div class="ledger-row tip-btn active" data-amt="5" role="button" tabindex="0">
              <span class="ledger-item">Field Officer’s Cortado</span>
              <span class="ledger-dots"></span>
              <span class="ledger-price">$5.00</span>
            </div>
            <div class="ledger-row tip-btn" data-amt="10" role="button" tabindex="0">
              <span class="ledger-item">Master Navigator’s Roast</span>
              <span class="ledger-dots"></span>
              <span class="ledger-price">$10.00</span>
            </div>
          </div>

          <div class="ledger-actions">
            <a href="https://buymeacoffee.com" target="_blank" rel="noopener noreferrer" class="ledger-cta-btn" id="coffee-cta-btn">
              <span>Fuel the Atlas Expedition</span>
              <span class="cta-arrow">↗</span>
            </a>
          </div>
        </div>
      </section>

      <!-- ── SECTION 6: FINALE / EXPEDITION LAUNCH ──────────────── -->
      <section class="landing-finale" id="landing-finale">
        <div class="finale-card">
          <div class="finale-header">
            <span class="finale-mono">PRIME MERIDIAN // SYSTEM READY</span>
            <h2 class="finale-title">Every Border, Coastline, and Territory.</h2>
            <p class="finale-desc">
              Ready to test your geography? Select a discipline below to launch into the interactive map engine.
            </p>
          </div>

          <div class="finale-mode-select">
            <button class="finale-mode-btn" data-mode="casual">
              <span class="btn-label">Casual Study</span>
              <span class="btn-sub">Untimed Exploration</span>
            </button>
            <button class="finale-mode-btn" data-mode="speed">
              <span class="btn-label">Speed Run</span>
              <span class="btn-sub">Beat the Clock</span>
            </button>
            <button class="finale-mode-btn" data-mode="reverse">
              <span class="btn-label">Reverse Mode</span>
              <span class="btn-sub">Deduce the Nation</span>
            </button>
          </div>
        </div>
      </section>
    `;
  }

  // ================================================================
  //  SLIM DOSSIER CARD (Archival Field Index Layout)
  // ================================================================
  _renderDossierCard(d) {
    return `
      <article class="dossier-card"
               data-lon="${d.lon}"
               data-lat="${d.lat}"
               data-iso="${d.iso}"
               data-name="${d.name}"
               tabindex="0"
               role="button"
               aria-label="View dossier for ${d.name}">
        <div class="dossier-top">
          <span class="dossier-num">${d.num} // ${d.iso}</span>
          <span class="dossier-coords">${d.coords}</span>
        </div>

        <div class="dossier-main">
          <h3 class="dossier-name">${d.name}</h3>
          <p class="dossier-tagline">${d.tagline}</p>
          <p class="dossier-desc">${d.desc}</p>
        </div>

        <div class="dossier-metrics">
          ${d.stats.map(s => `
            <div class="dossier-metric">
              <span class="metric-k">${s.k}</span>
              <span class="metric-v" title="${s.v}">${s.v}</span>
            </div>
          `).join('')}
        </div>

        <div class="dossier-footer">
          <span class="focus-hint">⌖ Center on Globe</span>
          <span class="focus-arrow">→</span>
        </div>
      </article>
    `;
  }

  // ================================================================
  //  INTERACTIVE DOSSIER BINDINGS (Link to 3D Globe + Telemetry)
  // ================================================================
  _bindDossierInteractions() {
    setTimeout(() => {
      const cards = document.querySelectorAll('.dossier-card');
      let hoverTimer = null;

      cards.forEach(card => {
        const lon = parseFloat(card.dataset.lon);
        const lat = parseFloat(card.dataset.lat);
        const iso = card.dataset.iso;
        const name = card.dataset.name;

        const triggerFocus = () => {
          cards.forEach(c => c.classList.remove('active-focus'));
          card.classList.add('active-focus');
          if (this._globe && !isNaN(lon) && !isNaN(lat)) {
            this._globe.focusLocation(lon, lat, iso, name);
          }
        };

        const onMouseEnter = () => {
          clearTimeout(hoverTimer);
          // 120ms intent delay: ignores rapid mouse sweeps across cards
          hoverTimer = setTimeout(() => {
            triggerFocus();
          }, 120);
        };

        const onMouseLeave = () => {
          clearTimeout(hoverTimer);
          card.classList.remove('active-focus');
          if (this._globe) {
            this._globe.releaseFocus();
          }
        };

        card.addEventListener('mouseenter', onMouseEnter);
        card.addEventListener('mouseleave', onMouseLeave);
        card.addEventListener('focus', triggerFocus);
        card.addEventListener('blur', onMouseLeave);
        card.addEventListener('click', triggerFocus);
      });
    }, 0);
  }

  // ================================================================
  //  EXPEDITION LEDGER RATION SELECTION
  // ================================================================
  _bindCoffeeTipOptions() {
    setTimeout(() => {
      const tipBtns = document.querySelectorAll('.tip-btn');
      tipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          tipBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    }, 0);
  }

  _bindCTA() {
    // Bind Hero CTA
    const cta = this.el.querySelector('#landing-cta');
    if (cta) {
      cta.addEventListener('click', () => {
        this.app.startMode('casual');
      });
    }

    // Bind Feature Panels
    const panels = this.el.querySelectorAll('.feature-panel');
    panels.forEach(p => {
      p.addEventListener('click', () => {
        const mode = p.getAttribute('data-mode');
        this.app.startMode(mode);
      });
      p.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const mode = p.getAttribute('data-mode');
          this.app.startMode(mode);
        }
      });
    });

    // Bind Secondary Mode Pills
    const pills = this.el.querySelectorAll('.secondary-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const page = pill.getAttribute('data-page');
        if (page) this.app.startMode(page);
      });
    });
  }

  _bindThemeToggle() {
    const themeBtn = this.el.querySelector('#landing-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', (e) => {
        if (this.app.themeManager) {
          this.app.themeManager.toggle(e);
          this._updateThemeIcon();
        }
      });
    }
  }

  _updateThemeIcon() {
    const btn = this.el.querySelector('#landing-theme-toggle');
    if (!btn || !this.app.themeManager) return;
    
    const sun = btn.querySelector('.theme-icon-sun');
    const moon = btn.querySelector('.theme-icon-moon');
    if (this.app.themeManager.isDark()) {
      sun.classList.remove('hidden');
      moon.classList.add('hidden');
    } else {
      sun.classList.add('hidden');
      moon.classList.remove('hidden');
    }
  }

  // ================================================================
  //  HERO REVEAL ANIMATIONS
  // ================================================================
  _animateHero() {
    const anime = window.anime;
    if (!anime) return;

    anime({
      targets: '#hero-headline',
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 750,
      delay: 200,
      easing: 'easeOutCubic'
    });

    anime({
      targets: ['.hero-divider-rule', '#hero-sub', '#hero-actions'],
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 600,
      delay: anime.stagger(120, { start: 350 }),
      easing: 'easeOutCubic'
    });
  }

  // ================================================================
  //  SCROLL REVEAL ANIMATIONS
  // ================================================================
  _initScrollAnimations() {
    const landing = document.getElementById('page-landing');
    const header = document.getElementById('landing-header');
    
    if (landing && header) {
      landing.addEventListener('scroll', () => {
        if (landing.scrollTop > 20) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      });
    }

    const anime = window.anime;
    if (!anime) return;

    const landing = document.getElementById('page-landing');
    const observe = (selector, fn, threshold = 0.10) => {
      const els = Array.from(document.querySelectorAll(selector));
      if (!els.length) return;
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { fn(entry.target); io.unobserve(entry.target); }
        });
      }, { root: landing, threshold });
      els.forEach(el => io.observe(el));
    };

    observe('#features-header', el => {
      anime({ targets: el, opacity: [0, 1], translateY: [20, 0], duration: 700, easing: 'easeOutCubic' });
    });

    observe('.feature-panel', () => {
      anime({
        targets: '.feature-panel',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: anime.stagger(100),
        easing: 'easeOutCubic'
      });
    }, 0.08);

    observe('#dossiers-header', el => {
      anime({ targets: el, opacity: [0, 1], translateY: [20, 0], duration: 700, easing: 'easeOutCubic' });
    });

    observe('#wing-left', el => {
      anime({
        targets: el.querySelectorAll('.dossier-card'),
        opacity: [0, 1],
        translateX: [-30, 0],
        duration: 600,
        delay: anime.stagger(80),
        easing: 'easeOutCubic'
      });
    }, 0.05);

    observe('#wing-right', el => {
      anime({
        targets: el.querySelectorAll('.dossier-card'),
        opacity: [0, 1],
        translateX: [30, 0],
        duration: 600,
        delay: anime.stagger(80),
        easing: 'easeOutCubic'
      });
    }, 0.05);

    observe('.landing-about', el => {
      anime({ targets: el.querySelectorAll('.about-card'), opacity: [0, 1], translateY: [25, 0], duration: 600, delay: anime.stagger(120), easing: 'easeOutCubic' });
    }, 0.1);

    observe('.ledger-card', el => {
      anime({ targets: el, opacity: [0, 1], translateY: [24, 0], duration: 700, easing: 'easeOutCubic' });
    }, 0.15);

    observe('.finale-card', el => {
      anime({ targets: el, opacity: [0, 1], translateY: [24, 0], duration: 750, easing: 'easeOutCubic' });
    }, 0.2);
  }

  // ================================================================
  //  GEOLOCATION
  // ================================================================
  _detectUserCountry() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await resp.json();
          const code = data?.address?.country_code?.toUpperCase();
          if (code && this._globe) {
            // Optional ambient highlight
          }
        } catch (_) {}
      },
      () => {}
    );
  }

  // ================================================================
  //  CTA & GAME MODE ROUTING
  // ================================================================
  _bindCTA() {
    const launchGame = (mode = 'casual', page = 'world') => {
      const anime = window.anime;
      if (anime) {
        anime({
          targets: '#page-landing',
          opacity: [1, 0],
          duration: 380,
          easing: 'easeInCubic',
          complete: () => this._revealGame(mode, page)
        });
      } else {
        this._revealGame(mode, page);
      }
    };

    setTimeout(() => {
      // Hero CTA
      document.getElementById('landing-cta')?.addEventListener('click', () => launchGame('casual', 'world'));

      // Feature panels (Casual, Speed, Reverse)
      document.querySelectorAll('.feature-panel[data-mode]').forEach(panel => {
        panel.addEventListener('click', () => launchGame(panel.dataset.mode, 'world'));
        panel.addEventListener('keydown', e => { if (e.key === 'Enter') launchGame(panel.dataset.mode, 'world'); });
      });

      // Secondary mode pills (Capitals, Flags)
      document.querySelectorAll('.secondary-pill[data-page]').forEach(pill => {
        pill.addEventListener('click', () => launchGame('casual', pill.dataset.page));
      });

      // Finale mode buttons
      document.querySelectorAll('.finale-mode-btn[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => launchGame(btn.dataset.mode, 'world'));
      });
    }, 0);
  }

  _revealGame(mode = 'casual', page = 'world') {
    if (this._globe) {
      this._globe.resetToTop();
    }

    const landing = document.getElementById('page-landing');
    landing.classList.add('hidden');

    const appEl = document.getElementById('app');
    appEl.classList.remove('hidden');
    appEl.style.opacity = '0';

    const anime = window.anime;
    if (anime) {
      anime({ targets: '#app', opacity: [0, 1], duration: 400, easing: 'easeOutCubic' });
    } else {
      appEl.style.opacity = '1';
    }

    this.app.storage.set('hasSeenIntro', true);

    if (this.app.setMode) {
      this.app.setMode(mode);
    }

    if (this.app.navigation && page !== 'world') {
      this.app.navigation.navigateTo(page);
    }

    setTimeout(() => document.getElementById('country-input')?.focus(), 450);
  }
}
