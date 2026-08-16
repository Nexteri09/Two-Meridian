// ==========================================================================
// Two Meridian — OnboardingModal: First-time visitor 15-second guided tour
// ==========================================================================

export class OnboardingModal {
  constructor(app) {
    this.app = app;
    this.currentStep = 0;
    this.active = false;

    this.steps = [
      {
        title: '1. Locate the Highlighted Territory',
        desc: 'Look at the pulsing gold country on the map. This is your target territory for the current round.',
        targetId: 'map-container',
        actionLabel: 'Next: Type to Guess ➔'
      },
      {
        title: '2. Type the Country Name',
        desc: 'Type your guess into the search bar or pick from the choices. Instant auto-complete helps you spell complex names.',
        targetId: 'country-input-wrapper',
        actionLabel: 'Next: Discover Trivia ➔'
      },
      {
        title: '3. Uncover Rich Cartographic Trivia',
        desc: 'Every correct chart reveals intriguing historical facts, geographical records, and boosts your streak combo!',
        targetId: 'sidebar-container',
        actionLabel: 'Begin Expedition 🚀'
      }
    ];

    this.init();
  }

  init() {
    // Check if user already saw onboarding
    const seen = this.app.storage.get('has_seen_onboarding');
    if (!seen) {
      // Auto-trigger after short delay on initial landing
      setTimeout(() => this.start(), 1200);
    }
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.currentStep = 0;
    this.render();
  }

  render() {
    let overlay = document.getElementById('onboarding-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'onboarding-overlay';
      overlay.className = 'onboarding-overlay';
      document.body.appendChild(overlay);
    }

    const step = this.steps[this.currentStep];

    overlay.innerHTML = `
      <div class="onboarding-card vintage-card" role="dialog" aria-labelledby="onboarding-title" aria-modal="true">
        <div class="onboarding-header">
          <span class="onboarding-badge">EXPEDITION BRIEFING</span>
          <button class="onboarding-skip-btn" id="btn-skip-onboarding">Skip Guide (ESC)</button>
        </div>

        <div class="onboarding-body">
          <div class="onboarding-progress">
            ${this.steps.map((_, idx) => `<span class="progress-dot ${idx === this.currentStep ? 'active' : idx < this.currentStep ? 'completed' : ''}"></span>`).join('')}
          </div>
          <h3 id="onboarding-title" class="onboarding-title">${step.title}</h3>
          <p class="onboarding-desc">${step.desc}</p>
        </div>

        <div class="onboarding-footer">
          <button class="btn-primary onboarding-next-btn" id="btn-next-onboarding">${step.actionLabel}</button>
        </div>
      </div>
    `;

    overlay.classList.add('visible');

    // Key handlers
    this.keydownHandler = (e) => {
      if (e.key === 'Escape') this.complete();
      if (e.key === 'Enter') this.nextStep();
    };
    window.addEventListener('keydown', this.keydownHandler);

    document.getElementById('btn-skip-onboarding').addEventListener('click', () => this.complete());
    document.getElementById('btn-next-onboarding').addEventListener('click', () => this.nextStep());
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.render();
    } else {
      this.complete();
    }
  }

  complete() {
    this.active = false;
    this.app.storage.set('has_seen_onboarding', true);
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
    }
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
    }
  }
}
