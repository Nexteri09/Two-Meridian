export class DonatePage {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('page-donate');
    this.selectedAmount = 5;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  init() {
    this.render();
    this.bindEvents();
  }

  returnToPrevious() {
    const targetPage = this.app.navigation?.previousPage || 'world';
    this.app.navigation?.navigateTo(targetPage);
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape' && this.app.currentPage === 'donate') {
      this.returnToPrevious();
    }
  }

  bindEvents() {
    // Return buttons
    const returnBtns = this.container.querySelectorAll('.donate-return-btn, .donate-close-btn');
    returnBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.returnToPrevious();
      });
    });

    // Tip tier buttons
    const tipRows = this.container.querySelectorAll('.ledger-row.tip-btn');
    const ctaBtn = this.container.querySelector('#donate-cta-link');
    const ctaLabel = this.container.querySelector('#donate-cta-label');

    tipRows.forEach(row => {
      const selectTier = () => {
        tipRows.forEach(r => r.classList.remove('active'));
        row.classList.add('active');
        const amt = parseFloat(row.dataset.amt) || 5;
        this.selectedAmount = amt;
        if (ctaLabel) {
          ctaLabel.textContent = `Fuel the Atlas Expedition ($${amt.toFixed(2)})`;
        }
        if (ctaBtn) {
          ctaBtn.href = `https://buymeacoffee.com?amount=${amt}`;
        }
      };

      row.addEventListener('click', selectTier);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectTier();
        }
      });
    });

    // Escape listener
    window.removeEventListener('keydown', this._handleKeyDown);
    window.addEventListener('keydown', this._handleKeyDown);
  }

  render() {
    this.container.innerHTML = `
      <div class="donate-layout">
        <div class="donate-card glass fade-in-up">
          
          <!-- Top Utility Nav -->
          <div class="donate-top-bar">
            <button class="donate-return-btn" title="Return to previous screen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>Return to Expedition</span>
            </button>
            <button class="donate-close-btn" title="Close support ledger" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <header class="donate-header">
            <div class="ledger-stamp">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10" stroke-dasharray="2 2"/>
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <span class="ledger-eyebrow">EXPEDITION LOG // ARCHIVAL SUPPORT</span>
            <h1 class="donate-title">Fuel the Cartography Expedition</h1>
            <p class="donate-subtitle">Two Meridian is an independent, ad-free cartography archive. Support ongoing chart maintenance, territory telemetry, and future releases with an expedition ration.</p>
          </header>

          <div class="donate-content">
            <!-- Archival Ledger Table with Dotted Leaders -->
            <div class="ledger-table" id="donate-tip-options">
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
              <div class="ledger-row tip-btn" data-amt="25" role="button" tabindex="0">
                <span class="ledger-item">Full Meridian Patronage</span>
                <span class="ledger-dots"></span>
                <span class="ledger-price">$25.00</span>
              </div>
            </div>

            <div class="donate-benefits">
              <div class="benefit-item">
                <span class="benefit-icon">✦</span>
                <div class="benefit-text">
                  <strong>100% Ad-Free & Distraction-Free</strong>
                  <span>Zero banners, sponsored tiles, or popups.</span>
                </div>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">✦</span>
                <div class="benefit-text">
                  <strong>Privacy-First Local Telemetry</strong>
                  <span>No analytics tracking; all history remains in local storage.</span>
                </div>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">✦</span>
                <div class="benefit-text">
                  <strong>Continuous Chart Expansion</strong>
                  <span>Ongoing geopolitical updates, capitals, and flag archives.</span>
                </div>
              </div>
            </div>
          </div>

          <footer class="donate-footer">
            <div class="ledger-actions">
              <a href="https://buymeacoffee.com?amount=5" target="_blank" rel="noopener noreferrer" class="donate-btn-primary ledger-cta-btn" id="donate-cta-link">
                <span id="donate-cta-label">Fuel the Atlas Expedition ($5.00)</span>
                <span class="cta-arrow">↗</span>
              </a>
            </div>
            <button class="donate-secondary-btn donate-return-btn">
              Return to Expedition
            </button>
            <p class="donate-thanks">Thank you for supporting independent educational software.</p>
          </footer>
        </div>
      </div>
    `;
  }
}
