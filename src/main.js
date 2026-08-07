// ============================================
// Two Meridian — Main Entry Point
// ============================================

import { GameEngine } from './components/GameEngine.js';
import { MapView } from './components/MapView.js';
import { Sidebar } from './components/Sidebar.js';
import { Navigation } from './components/Navigation.js';
import { LandingPage } from './components/LandingPage.js';
import { Storage } from './utils/storage.js';

class App {
  constructor() {
    this.storage = new Storage();
    this.currentPage = 'world';
    this.currentMode = 'casual';
    this.countriesData = null;
    this.gameEngine = null;
    this.mapView = null;
    this.sidebar = null;
    this.navigation = null;
    this.landingPage = null;
    this.soundEnabled = false;
  }

  async init() {
    // 1. Start landing page IMMEDIATELY — it needs nothing from the game
    this.landingPage = new LandingPage(this);
    this.landingPage.init();

    // 2. Load game data & components in the background
    //    By the time the user finishes reading the landing page and clicks Begin,
    //    all of this will already be ready.
    try {
      const resp = await fetch('./src/data/countries.json');
      this.countriesData = await resp.json();
    } catch (e) {
      console.error('Failed to load country data:', e);
      return;
    }

    // Initialize game components
    this.navigation = new Navigation(this);
    this.mapView = new MapView(this);
    this.sidebar = new Sidebar(this);
    this.gameEngine = new GameEngine(this);

    // Load SVG map
    await this.mapView.loadMap();

    // Set up sound toggle
    this.setupSoundToggle();

    // Restore saved state
    this.restoreState();
  }

  revealApp() {
    const app = document.getElementById('app');
    app.classList.remove('hidden');
    app.classList.add('app-reveal');
    // Focus input after reveal
    setTimeout(() => {
      const input = document.getElementById('country-input');
      if (input) input.focus();
    }, 400);
  }

  setupSoundToggle() {
    const btn = document.getElementById('sound-toggle');
    this.soundEnabled = this.storage.get('soundEnabled') || false;
    this.updateSoundIcon();
    btn.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      this.storage.set('soundEnabled', this.soundEnabled);
      this.updateSoundIcon();
    });
  }

  updateSoundIcon() {
    const waves = document.querySelector('.sound-on-waves');
    const lines = document.querySelectorAll('.sound-off-line');
    if (this.soundEnabled) {
      waves.classList.remove('hidden');
      lines.forEach(l => l.classList.add('hidden'));
    } else {
      waves.classList.add('hidden');
      lines.forEach(l => l.classList.remove('hidden'));
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    this.sidebar.setMode(mode);
    this.mapView.setMode(mode);
    this.gameEngine.setMode(mode);

    // Update CSS custom properties for active highlight
    const root = document.documentElement;
    const colors = {
      casual: { h: '--casual-highlight', hl: '--casual-highlight-light', g: '--casual-glow', gs: '--casual-glow-subtle' },
      speed: { h: '--speed-highlight', hl: '--speed-highlight-light', g: '--speed-glow', gs: '--speed-glow-subtle' },
      reverse: { h: '--reverse-highlight', hl: '--reverse-highlight-light', g: '--reverse-glow', gs: '--reverse-glow-subtle' }
    };
    const c = colors[mode];
    root.style.setProperty('--active-highlight', `var(${c.h})`);
    root.style.setProperty('--active-highlight-light', `var(${c.hl})`);
    root.style.setProperty('--active-glow', `var(${c.g})`);
    root.style.setProperty('--active-glow-subtle', `var(${c.gs})`);
  }

  restoreState() {
    const savedMode = this.storage.get('currentMode') || 'casual';
    this.setMode(savedMode);
    this.gameEngine.restoreProgress();
  }

  playSound(type) {
    if (!this.soundEnabled) return;
    // Simple audio feedback using Web Audio API
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'wrong') {
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    }
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
