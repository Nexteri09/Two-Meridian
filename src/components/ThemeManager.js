// ==========================================================================
// Two Meridian — ThemeManager
// Handles light / dark "Antique Atlas" mode toggling.
// Applies data-theme="light"|"dark" to <html>, persists via Storage.
// ==========================================================================

export class ThemeManager {
  constructor(storage) {
    this.storage = storage;
    this.current = storage.get('theme') || 'dark';
    // Apply immediately (no animation) on first load to avoid flash
    this._applyImmediate(this.current);
    this._bindToggle();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  isDark() {
    return this.current === 'dark';
  }

  toggle(e) {
    const newTheme = this.current === 'dark' ? 'light' : 'dark';

    // If View Transitions API is not supported or no click event, fallback to standard CSS crossfade
    if (!document.startViewTransition || !e) {
      this._apply(newTheme);
      return;
    }

    // Calculate transition origin from the button itself
    let x = window.innerWidth - 50;
    let y = 50;
    
    // Attempt to get exact coordinates from the button
    const btn = e && e.currentTarget ? e.currentTarget : null;
    if (btn && btn.getBoundingClientRect) {
      const rect = btn.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else if (e && e.clientX) {
      x = e.clientX;
      y = e.clientY;
    }
    
    // Convert to percentages to fix browser zoom bugs with view-transition clip-paths
    const xPct = (x / window.innerWidth) * 100;
    const yPct = (y / window.innerHeight) * 100;
    
    // Calculate maximum radius to ensure the circle covers the entire viewport
    const right = window.innerWidth - x;
    const bottom = window.innerHeight - y;
    const maxRadius = Math.hypot(Math.max(x, right), Math.max(y, bottom));

    // Pass coordinates and radius to CSS
    document.documentElement.style.setProperty('--theme-x', `${xPct}%`);
    document.documentElement.style.setProperty('--theme-y', `${yPct}%`);
    document.documentElement.style.setProperty('--theme-r', `${maxRadius}px`);

    // Trigger the view transition
    document.startViewTransition(() => {
      this._applyImmediate(newTheme);
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
    });
  }

  // Call this from the globe when it needs to know what palette to use
  getGlobePalette() {
    if (this.isDark()) {
      return {
        background: '#0a0908',
        pathFill:   'rgba(22,20,18,0.96)',
        pathStroke: 'rgba(197,155,39,0.85)',
        circleFill: 'none',
        circleStroke: 'rgba(197,155,39,0.80)',
        graticule: 'rgba(197, 155, 39, 0.12)',
        markerStroke: 'rgba(197, 155, 39, 0.42)',
        svgBackground: '#0a0908',
      };
    } else {
      return {
        background: '#EBE4D5',
        pathFill:   'rgba(210,198,178,0.97)',
        pathStroke: 'rgba(100,78,48,0.80)',
        circleFill: 'none',
        circleStroke: 'rgba(100,78,48,0.75)',
        graticule: 'rgba(100, 78, 48, 0.14)',
        markerStroke: 'rgba(100, 78, 48, 0.45)',
        svgBackground: '#EBE4D5',
      };
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _applyImmediate(theme) {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this._updateIcon(theme);
    this.storage.set('theme', theme);
  }

  _apply(theme) {
    // Add transitioning class for smooth CSS color transitions
    document.documentElement.classList.add('theme-transitioning');
    this._applyImmediate(theme);

    // Dispatch event so the globe can rebuild its texture
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));

    // Remove class after transitions complete
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 350);
  }

  _bindToggle() {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', (e) => this.toggle(e));
  }

  _updateIcon(theme) {
    const sun  = document.getElementById('theme-icon-sun');
    const moon = document.getElementById('theme-icon-moon');
    if (!sun || !moon) return;
    if (theme === 'dark') {
      sun.classList.remove('hidden');
      moon.classList.add('hidden');
    } else {
      sun.classList.add('hidden');
      moon.classList.remove('hidden');
    }
  }
}
