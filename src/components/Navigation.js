import { FlagsPage } from '../pages/FlagsPage.js';
import { CapitalsPage } from '../pages/CapitalsPage.js';
import { DonatePage } from '../pages/DonatePage.js';
import { StatsPage } from '../pages/StatsPage.js';

export class Navigation {
  constructor(app) {
    this.app = app;
    this.links = document.querySelectorAll('.nav-link[data-page]');
    this.pages = document.querySelectorAll('.page');
    this.components = {};
    this._bindBrandLogo();
    this.bind();
  }

  // ── Logo click — return to landing page ─────────────────────────────
  _bindBrandLogo() {
    const brand = document.getElementById('nav-brand');
    if (!brand) return;

    const goHome = () => {
      // Cleanly reset globe rotation/mesh before transition
      if (this.app.landingPage?._globe) {
        this.app.landingPage._globe.resetToTop();
      }

      const anime = window.anime;
      if (anime) {
        anime({
          targets: '#app',
          opacity: [1, 0],
          scale: [1, 0.98],
          duration: 350,
          easing: 'easeInCubic',
          complete: () => {
            document.getElementById('app').classList.add('hidden');
            document.getElementById('app').style.opacity = '';

            const landing = document.getElementById('page-landing');
            landing.classList.remove('hidden');
            landing.style.opacity = '0';
            // Reset landing page scroll
            landing.scrollTo({ top: 0, behavior: 'instant' });
            if (this.app.landingPage?._globe) {
              this.app.landingPage._globe.resetToTop();
            }

            if (anime) {
              anime({ targets: '#page-landing', opacity: [0, 1], duration: 400, easing: 'easeOutCubic' });
            } else {
              landing.style.opacity = '1';
            }
          }
        });
      } else {
        document.getElementById('app').classList.add('hidden');
        document.getElementById('page-landing').classList.remove('hidden');
        if (this.app.landingPage?._globe) {
          this.app.landingPage._globe.resetToTop();
        }
      }
    };

    brand.addEventListener('click', goHome);
    brand.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') goHome(); });
    brand.style.cursor = 'pointer';
  }

  bind() {
    this.links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        this.navigateTo(page);
      });
    });
  }

  navigateTo(page) {
    // Update nav links
    this.links.forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Update pages
    this.pages.forEach(p => p.classList.remove('active'));
    const activePage = document.getElementById(`page-${page}`);
    if (activePage) activePage.classList.add('active');

    // Initialize component if needed
    const loadablePages = ['flags', 'capitals', 'donate', 'stats'];
    if (loadablePages.includes(page)) {
      if (!this.components[page]) {
        switch (page) {
          case 'flags': this.components[page] = new FlagsPage(this.app); break;
          case 'capitals': this.components[page] = new CapitalsPage(this.app); break;
          case 'donate': this.components[page] = new DonatePage(this.app); break;
          case 'stats': this.components[page] = new StatsPage(this.app); break;
        }
        this.components[page].init();
      } else if (page === 'stats') {
        this.components[page].init(); // Re-render to fetch latest history
      }
    }

    this.app.currentPage = page;
  }
}
