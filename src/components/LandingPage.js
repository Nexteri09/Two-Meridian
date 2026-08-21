// ==========================================================================
// ==========================================================================
// Two Meridian — "Field Atlas" Cartographic Landing Page
// Engraved typography, archival expedition dossiers & 3D globe linkage
// ==========================================================================

import { GlobeAnimation } from './GlobeAnimation.js';

const FEATURED_DOSSIERS = [
  {
    num: '01', name: 'Vatican City', iso: 'VA', coords: '41°54′ N · 12°27′ E', lon: 12.45, lat: 41.90,
    tagline: 'The Sovereign Enclave',
    desc: 'Smaller than a golf course, it mints its own euros, runs its own post office, and guards centuries of archival history behind stone walls.',
    curio: '0.49 km² · 825 Residents'
  },
  {
    num: '02', name: 'Tuvalu', iso: 'TV', coords: '8°31′ S · 179°11′ E', lon: 179.19, lat: -8.52,
    tagline: 'The Coral Atoll Republic',
    desc: 'Nine low-lying coral atolls in the South Pacific that fund much of their national infrastructure by licensing the lucrative .tv web domain.',
    curio: '9 Coral Atolls · Max Elev. 4.6m'
  },
  {
    num: '03', name: 'Lesotho', iso: 'LS', coords: '29°35′ S · 28°14′ E', lon: 28.23, lat: -29.58,
    tagline: 'The Alpine Sky Kingdom',
    desc: 'The only sovereign state on Earth situated entirely above 1,000 meters altitude, completely encircled by snowy South African mountain passes.',
    curio: 'Enclave · 1,400m Base Altitude'
  },
  {
    num: '04', name: 'St. Vincent & Grenadines', iso: 'VC', coords: '13°15′ N · 61°12′ W', lon: -61.20, lat: 13.25,
    tagline: 'The Volcanic Windward Chain',
    desc: 'A dramatic Caribbean archipelago crowned by an active volcano, spanning 32 secluded islands, pirate coves, and black sand shorelines.',
    curio: '32 Islands · Active Volcano'
  },
  {
    num: '05', name: 'Nauru', iso: 'NR', coords: '0°32′ S · 166°55′ E', lon: 166.93, lat: -0.52,
    tagline: 'The Solitary Island Republic',
    desc: 'An isolated Pacific island with no official capital city. You can drive around the entire country along its coastal ring road in thirty minutes.',
    curio: '21 km² · No Official Capital'
  },
  {
    num: '06', name: 'Bhutan', iso: 'BT', coords: '27°30′ N · 90°30′ E', lon: 90.50, lat: 27.50,
    tagline: 'The Carbon-Negative Kingdom',
    desc: 'Perched in the Himalayas with zero traffic lights, it legally mandates 60 percent forest cover and absorbs more carbon than it emits.',
    curio: '71% Forest Cover · Carbon Negative'
  }
];

export class LandingPage {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('page-landing');

    this.featuredDossiers = FEATURED_DOSSIERS;

    this._globe = null;
    this._observers = []; // Track observers for cleanup
  }

  async init() {
    this._buildHTML();
    this._bindCTA();
    this._bindDossierInteractions();
    this._bindThemeToggle();
    this._bindLeaderboardTabs();
    this._bindFAQs();
    this._initLeaderboard('speed');
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
        <div class="nav-brand" style="cursor: pointer;">
          <svg class="brand-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--brass-500);">
            <circle cx="12" cy="12" r="9.5" stroke-dasharray="1.5 2"/>
            <polygon points="12,2 14.5,9.5 22,12 14.5,14.5 12,22 9.5,14.5 2,12 9.5,9.5" fill="none"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
          </svg>
          <span class="brand-name">Two Meridian</span>
        </div>
        <div class="landing-nav-actions">
          
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

          <!-- Auth Controls for Landing Page (Only shows when signed in) -->
          <div id="landing-auth-user" class="auth-user-menu hidden">
            <span id="landing-auth-alias" class="auth-alias" title="Click to edit alias">Alias</span>
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
        <div class="hero-directory">
          <nav class="directory-nav">
            <a href="#landing-dossiers" class="dir-link">01 / Field Dossiers</a>
            <a href="#landing-features" class="dir-link">02 / Game Modes</a>
            <a href="#landing-sync" class="dir-link">03 / Cloud Sync</a>
            <a href="#landing-about" class="dir-link">04 / About the Atlas</a>
          </nav>
        </div>

        <div class="hero-layout-grid">
          <!-- LEFT COLUMN: Note -->
          <div class="hero-note-column">
            <div class="hero-creator-note" id="creator-note-block">
              <div class="note-visible-content" id="creator-note-trigger" title="Read the full dispatch...">
                <p class="note-text">
                  Hey, I'm NEO. <em>my codename apparently;</em><br><br>
                  I built Two Meridian because I got genuinely obsessed with geography and couldn't find anything that actually challenged me. No multiple choice, no hand holding, no hints. just you and a spinning globe trying to name every country on earth from memory. turns out that's harder than it sounds.
                  <span class="note-expand-prompt">Read more...</span>
                </p>
              </div>

              <div class="note-expanded-content" id="creator-note-expanded">
                <p class="note-text">
                  <br>
                  I'm a solo dev, no team, no funding, no ads. Just me building this in my free time because I think the world deserves a geography tool that respects your intelligence.<br>
                  every feedback and donation goes straight back into keeping this thing alive. server costs, map data, new features. I'm working on historical borders, a capitals mode, and some stuff I'm not ready to talk about yet. <em>(not like it costs me much but saying it for a dramatic effect to feel like a actual underpaid dev)</em><br><br>
                  If two Meridian made you feel like you actually learned something today, even one country you didn't know before, that genuinely means everything to me.<br><br>
                  Feedback is always respected and worked upon.
                </p>
              </div>

              <div class="note-footer">
                <button type="button" class="note-feedback-link" id="landing-feedback-btn">Send Feedback →</button>
                <span class="note-sig">- NEO</span>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Main Headline -->
          <div class="hero-content">
            <h2 class="hero-headline" id="hero-headline">
              The World Is Yours to <span class="hero-highlight">Master</span>
            </h2>

            <div class="hero-actions" id="hero-actions">
              <button class="hero-cta" id="landing-cta" data-mode="casual">
                <span>Explore the Atlas</span>
                <span class="cta-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── SECTION 2: FLANKING FIELD STUDY (Pinned Stage) ──────── -->
      <div class="dossiers-pin-stage" id="dossiers-pin-stage">
        <section class="landing-dossiers" id="landing-dossiers">
          <div class="section-header" id="dossiers-header">
            <h2 class="section-title">Curiosities of the <span class="hero-highlight">World</span></h2>
            <p class="section-desc">
              6 unusual sovereign nations. Hover to locate them on the globe.
            </p>
          </div>

          <div class="dossier-wings-container">
            <!-- Left Wing: 3 Slim Cards -->
            <div class="dossier-wing wing-left" id="wing-left">
              ${this.featuredDossiers.slice(0, 3).map(d => this._renderDossierCard(d)).join('')}
            </div>

            <!-- Right Wing: 3 Slim Cards -->
            <div class="dossier-wing wing-right" id="wing-right">
              ${this.featuredDossiers.slice(3, 6).map(d => this._renderDossierCard(d)).join('')}
            </div>
          </div>
        </section>
      </div>

      <!-- ── SECTION 3: GAME MODES ────────────────────────────── -->
      <section class="landing-features" id="landing-features">
        <div class="section-header" id="features-header">
          <h2 class="section-title">Three Ways to <span class="hero-highlight">Play</span></h2>
          <p class="section-desc">
            Whether you want a relaxed study session, a fast-paced typing challenge, or pure spatial deduction.
          </p>
        </div>

        <div class="features-grid">
          <!-- Mode 01: Casual -->
          <div class="feature-panel" data-mode="casual" role="button" tabindex="0">
            <div class="panel-top-rule"></div>
            <div class="panel-header">
              <span class="panel-num">01</span>
              <span class="panel-badge">UNTIMED</span>
            </div>
            <h3 class="panel-title">Casual Mode</h3>
            <p class="panel-desc">
              Explore every border at your own pace. Type country names from memory, learn interesting facts about each one, and watch the map light up as you go.
            </p>
            <div class="panel-meta-mono">NO TIME LIMIT · 196 COUNTRIES · FACTS & TRIVIA</div>
            <div class="panel-footer">
              <span class="panel-link">Play Casual Mode</span>
              <span class="panel-arrow">→</span>
            </div>
          </div>

          <!-- Mode 02: Speed Run -->
          <div class="feature-panel" data-mode="speed" role="button" tabindex="0">
            <div class="panel-top-rule"></div>
            <div class="panel-header">
              <span class="panel-num">02</span>
              <span class="panel-badge">TIMED CHALLENGE</span>
            </div>
            <h3 class="panel-title">Speed Run</h3>
            <p class="panel-desc">
              Race the clock to name as many countries as you can. Build streaks, keep your pace up, and see where your typing speed ranks on the daily leaderboard.
            </p>
            <div class="panel-meta-mono">STOPWATCH TIMER · STREAKS · DAILY LEADERBOARD</div>
            <div class="panel-footer">
              <span class="panel-link">Enter Speed Run</span>
              <span class="panel-arrow">→</span>
            </div>
          </div>

          <!-- Mode 03: Reverse Mode -->
          <div class="feature-panel" data-mode="reverse" role="button" tabindex="0">
            <div class="panel-top-rule"></div>
            <div class="panel-header">
              <span class="panel-num">03</span>
              <span class="panel-badge">SHAPE GUESSING</span>
            </div>
            <h3 class="panel-title">Reverse Mode</h3>
            <p class="panel-desc">
              A mystery country glows on the globe with no name. Deduce which nation it is purely from its coastline, borders, and position on Earth.
            </p>
            <div class="panel-meta-mono">RANDOM GLOWING TARGETS · SHAPE RECALL · PURE DEDUCTION</div>
            <div class="panel-footer">
              <span class="panel-link">Play Reverse Mode</span>
              <span class="panel-arrow">→</span>
            </div>
          </div>
        </div>

        <!-- Secondary Modes Ribbon -->
        <div class="secondary-modes-bar">
          <span class="secondary-label">More Geography Challenges:</span>
          <button class="secondary-pill" data-page="capitals">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="20" width="20" height="2" rx="0.5"/>
              <rect x="5" y="10" width="2" height="10"/>
              <rect x="11" y="10" width="2" height="10"/>
              <rect x="17" y="10" width="2" height="10"/>
              <path d="M1 10h22M12 3l10 7H2z"/>
            </svg>
            <span>World Capitals [196]</span>
          </button>
          <button class="secondary-pill" data-page="flags">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>
            </svg>
            <span>Country Flags [196]</span>
          </button>
        </div>
      </section>

      <!-- ── SECTION 4: CLOUD SYNC & LOCAL STORAGE ──────────────── -->
      <section class="landing-sync left-aligned-section" id="landing-sync">
        <div class="sync-container">
          <div class="corner-bracket bracket-tl"></div>
          <div class="corner-bracket bracket-tr"></div>
          <div class="corner-bracket bracket-bl"></div>
          <div class="corner-bracket bracket-br"></div>

          <div class="sync-header">
            <span class="sync-eyebrow">DATA STORAGE // CONTINUITY & BACKUP</span>
            <h2 class="sync-title">Do you need an account to play? <span class="sync-title-sub">(Probably not)</span></h2>
            <p class="sync-intro">
              Two Meridian is built with zero barriers to entry. You never need to sign up, verify an email, or create a password to explore the atlas.
            </p>
          </div>

          <div class="sync-grid">
            <!-- Left Card: Default Local Storage -->
            <div class="sync-card-block">
              <div class="sync-card-header">
                <span class="sync-pill-tag tag-default">DEFAULT · ON DEVICE</span>
                <h3 class="sync-card-title">Browser Local Storage</h3>
              </div>
              <p class="sync-card-text">
                Your mapped territories, personal chronometer times, and deduction accuracy are saved automatically into your browser persistent storage on this computer.
              </p>
              <ul class="sync-feature-list">
                <li class="sync-feature-item">
                  <span class="sync-glyph">◈</span>
                  <div class="sync-item-content">
                    <strong>Instant & Offline Capable</strong>
                    <span>Works immediately with zero server latency or network delay.</span>
                  </div>
                </li>
                <li class="sync-feature-item">
                  <span class="sync-glyph">◈</span>
                  <div class="sync-item-content">
                    <strong>Completely Private</strong>
                    <span>Your keystrokes and game telemetry never leave this device.</span>
                  </div>
                </li>
                <li class="sync-feature-item">
                  <span class="sync-glyph">◈</span>
                  <div class="sync-item-content">
                    <strong>Zero Friction</strong>
                    <span>No registration, passwords, or email confirmation needed.</span>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Right Card: Optional Cloud Sync -->
            <div class="sync-card-block">
              <div class="sync-card-header">
                <span class="sync-pill-tag tag-optional">OPTIONAL · MULTI-DEVICE</span>
                <h3 class="sync-card-title">Google Cloud Sync</h3>
              </div>
              <p class="sync-card-text">
                Only needed if you want your progress to carry over across different screens or want safeguard protection against browser cache and cookie resets.
              </p>
              <ul class="sync-feature-list">
                <li class="sync-feature-item">
                  <span class="sync-glyph glyph-brass">◈</span>
                  <div class="sync-item-content">
                    <strong>Multi-Device Continuity</strong>
                    <span>Switch freely between your laptop, phone, and tablet without losing progress.</span>
                  </div>
                </li>
                <li class="sync-feature-item">
                  <span class="sync-glyph glyph-brass">◈</span>
                  <div class="sync-item-content">
                    <strong>Cache Reset Protection</strong>
                    <span>Prevents accidental score loss when clearing browser history or site cookies.</span>
                  </div>
                </li>
                <li class="sync-feature-item">
                  <span class="sync-glyph glyph-brass">◈</span>
                  <div class="sync-item-content">
                    <strong>Permanent Record</strong>
                    <span>Keeps your personal best records and Reverse Mode milestones permanently safe.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- Advisory Footnote Bar -->
          <div class="sync-advisory-bar">
            <span class="sync-advisory-icon">◈</span>
            <span class="sync-advisory-text"><strong>Local Storage Advisory:</strong> Progress saved locally can be erased if you clear browser cookies/site data, play in Incognito/Private tabs, or switch between different browsers.</span>
          </div>

          <!-- Bottom Action & Trust Strip -->
          <div class="sync-action-area">
            <div id="sync-section-logged-out" class="sync-logged-out-box">
              <button type="button" id="sync-section-login-btn" class="sync-login-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/>
                </svg>
                <span>Sign In with Google</span>
                <span class="cta-arrow">→</span>
              </button>
              <p class="sync-privacy-sub">
                Optional cloud backup. We never send marketing emails or share your profile. Your login is only used to sync your personal quiz achievements.
              </p>
            </div>

            <div id="sync-section-logged-in" class="sync-logged-in-box hidden">
              <div class="sync-user-status">
                <span class="sync-badge-active">
                  <span>◈ Cloud Sync Active</span>
                  <span>·</span>
                  <span id="sync-section-alias" class="sync-alias-name auth-alias" title="Click to edit alias">Explorer</span>
                </span>
                <button type="button" id="sync-section-logout-btn" class="sync-logout-btn">Sign Out</button>
              </div>
              <p class="sync-privacy-sub">
                Your mapped countries, chronometer times, and accuracy are continuously syncing. Click your alias anytime to change your cartographer name.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ── SECTION DIVIDER 2 ── -->
      <div class="atlas-section-divider left-aligned-section">
        <span class="divider-line"></span>
      </div>

      <!-- ── SECTION 5: ABOUT & FAQ (Atlas Foreword) ──────────────────────── -->
      <section class="landing-about left-aligned-section" id="landing-about">
        <div class="about-foreword-container">
          <div class="about-header">
            <span class="about-eyebrow">ATLAS DIRECTIVE // MISSION STATEMENT</span>
            <h2 class="about-title">About Two Meridian</h2>
            <div class="about-editorial-intro">
              <p class="editorial-p">
                Two Meridian is a geography game that asks one simple question: can you name every country in the world? No multiple choice. No hints. Just a blank interactive map and your knowledge. Type a country, watch it light up, and learn something genuinely interesting about it along the way. Whether you're studying for a geography test, brushing up before a trip, or just curious how many of the 196 countries you actually know, this is the place.
              </p>
            </div>
          </div>

          <div class="faq-accordion">
            <div class="faq-item">
              <button class="faq-question">
                <span class="faq-num">01</span>
                <span class="faq-text">What is Two Meridian?</span>
                <span class="faq-icon">+</span>
              </button>
              <div class="faq-answer"><p>Two Meridian is a free geography game where you type country names to fill in an interactive map. No multiple choice, no hints, just you and a map. It's built for anyone who wants to genuinely learn every country in the world, not just recognize them from a list.</p></div>
            </div>
            <div class="faq-item">
              <button class="faq-question">
                <span class="faq-num">02</span>
                <span class="faq-text">How does the scoring work?</span>
                <span class="faq-icon">+</span>
              </button>
              <div class="faq-answer"><p>In Speed Run mode, your score combines three things: how fast you type (time), how accurately you spell (keystrokes), and how long you keep your streak going without pausing. Clean, fast, uninterrupted runs score highest. In Casual mode, there's no scoring, just exploration.</p></div>
            </div>
            <div class="faq-item">
              <button class="faq-question">
                <span class="faq-num">03</span>
                <span class="faq-text">Can I learn capitals and flags too?</span>
                <span class="faq-icon">+</span>
              </button>
              <div class="faq-answer"><p>Yes. Beyond the main country quiz, there are dedicated modes for all 196 world capitals and sovereign flags. Each one has its own progress tracker so you can see which ones you've mastered and which still trip you up.</p></div>
            </div>
            <div class="faq-item">
              <button class="faq-question">
                <span class="faq-num">04</span>
                <span class="faq-text">Which countries are included?</span>
                <span class="faq-icon">+</span>
              </button>
              <div class="faq-answer"><p>All 196 sovereign nations, the 193 UN member states plus Kosovo, Taiwan, and Vatican City. We don't include dependent territories like Puerto Rico or Greenland, but every internationally recognized independent country is here.</p></div>
            </div>
            <div class="faq-item">
              <button class="faq-question">
                <span class="faq-num">05</span>
                <span class="faq-text">Does it work on mobile?</span>
                <span class="faq-icon">+</span>
              </button>
              <div class="faq-answer"><p>Two Meridian works on any modern browser: Chrome, Firefox, Safari, Edge on desktop and mobile. The interactive map and all game modes are fully responsive. For the best experience, we recommend a screen wider than 768px.</p></div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── SECTION DIVIDER 3 ── -->
      <div class="atlas-section-divider left-aligned-section">
        <span class="divider-line"></span>
      </div>


      <!-- ── SECTION DIVIDER 4 ── -->
      <div class="atlas-section-divider left-aligned-section">
        <span class="divider-line"></span>
      </div>

      <!-- ── SECTION 7: LAUNCH EXPEDITION ────────────────────────── -->
      <section class="landing-finale left-aligned-section" id="landing-finale">
        <div class="finale-header">
          <span class="finale-mono">START PLAYING</span>
          <h2 class="finale-title">Ready to test what you know?</h2>
          <p class="finale-desc">
            No tutorials or sign-up needed. Choose a mode below and jump straight into the map.
          </p>
        </div>

        <div class="finale-slabs-container">
          <button class="finale-slab-btn mode-casual" data-mode="casual">
            <div class="slab-left">
              <div class="slab-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="9" stroke-dasharray="2 2"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <div class="slab-titles">
                <span class="slab-label">Casual Mode</span>
                <span class="slab-sub">Untimed · Type all 196 countries at your own pace</span>
              </div>
            </div>
            <span class="slab-arrow">→</span>
          </button>

          <button class="finale-slab-btn mode-speed" data-mode="speed">
            <div class="slab-left">
              <div class="slab-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="13" r="8"/>
                  <path d="M12 9v4l2.5 2.5"/>
                  <path d="M10 2h4"/>
                </svg>
              </div>
              <div class="slab-titles">
                <span class="slab-label">Speed Run</span>
                <span class="slab-sub">Race against the clock · Test your typing speed</span>
              </div>
            </div>
            <span class="slab-arrow">→</span>
          </button>

          <button class="finale-slab-btn mode-reverse" data-mode="reverse">
            <div class="slab-left">
              <div class="slab-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="11" cy="11" r="7"/>
                  <path d="M16 16l4.5 4.5"/>
                </svg>
              </div>
              <div class="slab-titles">
                <span class="slab-label">Reverse Mode</span>
                <span class="slab-sub">Guess glowing countries purely by shape and location</span>
              </div>
            </div>
            <span class="slab-arrow">→</span>
          </button>
        </div>
      </section>

      <!-- ── FOOTER ──────────────────────────────────────────────── -->
      <footer class="landing-page-footer left-aligned-section">
        <div class="footer-meridian-coords">0° 0' 0" N · 0° 0' 0" E - GREENWICH PRIME MERIDIAN</div>
        <div class="footer-links-row">
          <span class="landing-footer-copy">&copy; 2026 Two Meridian</span>
          <span class="landing-footer-sep">·</span>
          <a href="/privacy.html" class="landing-footer-link" target="_blank" rel="noopener">Privacy Policy</a>
        </div>
      </footer>
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
          <span class="dossier-num">${d.iso}</span>
          <span class="dossier-coords">${d.coords}</span>
        </div>

        <div class="dossier-main">
          <h3 class="dossier-name">${d.name}</h3>
          <p class="dossier-tagline">${d.tagline}</p>
          <p class="dossier-desc">${d.desc}</p>
        </div>

        <div class="dossier-curio-tag">
          <span class="curio-glyph">◈</span>
          <span class="curio-text">${d.curio}</span>
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

  // ================================================================
  //  V2: INLINE LEADERBOARD & FAQ
  // ================================================================
  _bindLeaderboardTabs() {
    const tabs = this.el.querySelectorAll('.lb-tab');
    const slider = this.el.querySelector('#lb-tab-slider');
    if (!slider || tabs.length === 0) return;

    const updateSlider = (activeTab) => {
      if (!slider || !activeTab) return;
      const rect = activeTab.getBoundingClientRect();
      const parentRect = activeTab.parentElement.getBoundingClientRect();
      slider.style.width = `${rect.width}px`;
      slider.style.transform = `translateX(${rect.left - parentRect.left}px)`;
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        updateSlider(tab);
        this._initLeaderboard(tab.dataset.mode);
      });
    });

    const activeTab = this.el.querySelector('.lb-tab.active');
    if (activeTab) setTimeout(() => updateSlider(activeTab), 50);
  }

  async _initLeaderboard(mode = 'speed') {
    const tbody = this.el.querySelector('#landing-lb-body');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" class="lb-loading">Fetching telemetry...</td></tr>`;

    try {
      let entries = [];
      if (this.app.leaderboardManager) {
        entries = await this.app.leaderboardManager.fetchLeaderboard(mode);
      }
      
      let top10 = entries.slice(0, 10);
      
      // Temporary fallback data if empty or disconnected
      if (top10.length === 0) {
        top10 = [
          { alias: "MAGELLAN", final_score: mode === 'speed' ? 14500 : 95, accuracy: "98%", time: "1m 45s" },
          { alias: "PTOLEMY", final_score: mode === 'speed' ? 12200 : 88, accuracy: "94%", time: "1m 52s" },
          { alias: "VESPUCCI", final_score: mode === 'speed' ? 11850 : 82, accuracy: "91%", time: "1m 58s" },
          { alias: "MERCATOR", final_score: mode === 'speed' ? 9400 : 70, accuracy: "89%", time: "2m 10s" },
          { alias: "ERATOSTHENES", final_score: mode === 'speed' ? 8900 : 65, accuracy: "85%", time: "2m 15s" },
          { alias: "AL-IDRISI", final_score: mode === 'speed' ? 8100 : 60, accuracy: "83%", time: "2m 30s" },
          { alias: "IBN_BATTUTA", final_score: mode === 'speed' ? 7600 : 55, accuracy: "79%", time: "2m 45s" },
          { alias: "ZHENG_HE", final_score: mode === 'speed' ? 7200 : 51, accuracy: "76%", time: "3m 01s" },
          { alias: "COLUMBUS", final_score: mode === 'speed' ? 6800 : 45, accuracy: "72%", time: "3m 10s" },
          { alias: "COOK", final_score: mode === 'speed' ? 6100 : 40, accuracy: "68%", time: "3m 25s" }
        ];
      }

      // DOM-safe injection with podium rank styling (#1-#3)
      tbody.innerHTML = ''; 
      top10.forEach((entry, idx) => {
        const tr = document.createElement('tr');
        if (idx < 3) tr.classList.add('row-podium', `row-rank-${idx + 1}`);

        const tdRank = document.createElement('td');
        tdRank.className = 'col-rank';
        if (idx === 0) {
          tdRank.innerHTML = `<span class="rank-badge rank-1"><span class="rank-icon">⌖</span> 01</span>`;
        } else if (idx === 1) {
          tdRank.innerHTML = `<span class="rank-badge rank-2">02</span>`;
        } else if (idx === 2) {
          tdRank.innerHTML = `<span class="rank-badge rank-3">03</span>`;
        } else {
          tdRank.textContent = String(idx + 1).padStart(2, '0');
        }

        const tdAlias = document.createElement('td');
        tdAlias.className = 'col-alias';
        tdAlias.textContent = entry.alias || 'Anonymous';
        
        const tdAcc = document.createElement('td');
        tdAcc.className = 'col-acc';
        tdAcc.textContent = entry.accuracy || '---';

        const tdTime = document.createElement('td');
        tdTime.className = 'col-time';
        tdTime.textContent = entry.time || '---';

        const tdScore = document.createElement('td');
        tdScore.className = 'col-score';
        tdScore.textContent = Number(entry.final_score).toLocaleString();
        
        tr.appendChild(tdRank);
        tr.appendChild(tdAlias);
        tr.appendChild(tdAcc);
        tr.appendChild(tdTime);
        tr.appendChild(tdScore);
        tbody.appendChild(tr);
      });
      
      // Update timer
      const timerEl = this.el.querySelector('#landing-timer');
      if (timerEl) {
        this._updateResetTimer(timerEl);
        if (this._lbTimerInt) clearInterval(this._lbTimerInt);
        this._lbTimerInt = setInterval(() => this._updateResetTimer(timerEl), 1000);
      }
      
    } catch (err) {
      console.warn("Failed to fetch landing leaderboard:", err);
    }
  }

  _updateResetTimer(el) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0); // Midnight UTC
    const diff = tomorrow - now;
    
    if (diff <= 0) {
      el.innerHTML = `<span class="flip-unit">00</span>:<span class="flip-unit">00</span>:<span class="flip-unit">00</span>`;
      return;
    }
    
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    
    const hs = h.toString().padStart(2, '0');
    const ms = m.toString().padStart(2, '0');
    const ss = s.toString().padStart(2, '0');

    el.innerHTML = `
      <span class="flip-cell">${hs[0]}</span><span class="flip-cell">${hs[1]}</span>
      <span class="flip-sep">:</span>
      <span class="flip-cell">${ms[0]}</span><span class="flip-cell">${ms[1]}</span>
      <span class="flip-sep">:</span>
      <span class="flip-cell">${ss[0]}</span><span class="flip-cell">${ss[1]}</span>
    `;
  }

  _bindFAQs() {
    const items = this.el.querySelectorAll('.faq-item');
    items.forEach(item => {
      const btn = item.querySelector('.faq-question');
      btn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        items.forEach(i => i.classList.remove('active'));
        if (!isActive) item.classList.add('active');
      });
    });
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
      targets: '#hero-actions',
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 600,
      delay: 350,
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

    const observe = (selector, fn, threshold = 0.10) => {
      const els = Array.from(document.querySelectorAll(selector));
      if (!els.length) return;
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { fn(entry.target); io.unobserve(entry.target); }
        });
      }, { root: landing, threshold });
      
      if (!this._observers) this._observers = [];
      this._observers.push(io);
      
      els.forEach(el => io.observe(el));
    };

    observe('#features-header', el => {
      anime({ targets: el, opacity: [0, 1], translateY: [28, 0], duration: 800, easing: 'easeOutCubic' });
    }, 0.05);

    observe('.features-grid', el => {
      anime({
        targets: el.querySelectorAll('.feature-panel'),
        opacity: [0, 1],
        translateY: [36, 0],
        duration: 750,
        delay: anime.stagger(120),
        easing: 'easeOutCubic'
      });
    }, 0.05);

    observe('.secondary-modes-bar', el => {
      anime({ targets: el, opacity: [0, 1], translateY: [20, 0], duration: 700, delay: 200, easing: 'easeOutCubic' });
    }, 0.05);

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

    observe('.atlas-section-divider', el => {
      anime({ targets: el, opacity: [0, 1], scaleX: [0.8, 1], duration: 600, easing: 'easeOutCubic' });
    }, 0.1);

    observe('#landing-leaderboard', el => {
      anime({ targets: el.querySelectorAll('.ledger-manifest-container'), opacity: [0, 1], translateY: [24, 0], duration: 650, easing: 'easeOutCubic' });
    }, 0.1);

    observe('#landing-about', el => {
      anime({ targets: el.querySelectorAll('.about-foreword-container'), opacity: [0, 1], translateY: [24, 0], duration: 650, easing: 'easeOutCubic' });
    }, 0.1);


    observe('#landing-finale', el => {
      anime({ targets: el.querySelectorAll('.finale-slab-btn'), opacity: [0, 1], translateY: [20, 0], duration: 550, delay: anime.stagger(90), easing: 'easeOutCubic' });
    }, 0.1);
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

      // Finale mode slabs
      document.querySelectorAll('.finale-slab-btn[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => launchGame(btn.dataset.mode, 'world'));
      });

      // Feedback Modal Trigger
      document.getElementById('landing-feedback-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.app.feedbackModal?.open('General');
      });

      // Creator Note Accordion Toggle
      const noteBlock = document.getElementById('creator-note-block');
      const noteTrigger = document.getElementById('creator-note-trigger');
      
      if (noteBlock && noteTrigger) {
        const collapseNote = () => {
          if (noteBlock.classList.contains('expanded')) {
            noteBlock.classList.remove('expanded');
            document.body.classList.remove('globe-dimmed');
          }
        };

        noteTrigger.addEventListener('click', (e) => {
          e.stopPropagation();
          noteBlock.classList.toggle('expanded');
          
          if (noteBlock.classList.contains('expanded')) {
            document.body.classList.add('globe-dimmed');
          } else {
            document.body.classList.remove('globe-dimmed');
          }
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
          if (noteBlock.classList.contains('expanded') && !noteBlock.contains(e.target)) {
            collapseNote();
          }
        });

        // Auto-collapse and remove background dimming when scrolled out of view
        const landing = document.getElementById('page-landing');
        const handleScrollCollapse = () => {
          if (noteBlock.classList.contains('expanded')) {
            const rect = noteBlock.getBoundingClientRect();
            // If the note has scrolled completely out of the viewport
            if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
              collapseNote();
            }
          }
        };

        if (landing) landing.addEventListener('scroll', handleScrollCollapse, { passive: true });
        window.addEventListener('scroll', handleScrollCollapse, { passive: true });
      }
    }, 0);
  }

  _revealGame(mode = 'casual', page = 'world') {
    document.body.classList.remove('globe-dimmed');
    if (this._globe) {
      this._globe.resetToTop();
    }

    if (this._observers && this._observers.length > 0) {
      this._observers.forEach(io => io.disconnect());
      this._observers = [];
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
