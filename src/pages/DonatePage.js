export class DonatePage {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('page-donate');
  }

  init() {
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="donate-layout">
        <div class="donate-card glass fade-in-up">
          <header class="donate-header">
            <span class="brand-icon large">◆</span>
            <h1 class="donate-title">Keep the World Illuminated</h1>
            <p class="donate-subtitle">Two Meridian is built to be a pure, ad-free, and open geolearning experience for everyone.</p>
          </header>

          <div class="donate-content">
            <div class="donate-mission">
              <h3>Our Mission</h3>
              <p>We believe geography is the key to understanding our interconnected world. Two Meridian was created as a premium, distraction-free environment to spark curiosity and global literacy.</p>
            </div>

            <div class="donate-benefits">
              <div class="benefit-item">
                <span class="benefit-icon">✦</span>
                <div class="benefit-text">
                  <strong>100% Ad-Free</strong>
                  <span>No distractions, no tracking, just pure learning.</span>
                </div>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">✦</span>
                <div class="benefit-text">
                  <strong>Open Access</strong>
                  <span>Always free for students and educators worldwide.</span>
                </div>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">✦</span>
                <div class="benefit-text">
                  <strong>Privacy First</strong>
                  <span>We don't collect your data. Your progress stay local.</span>
                </div>
              </div>
            </div>
          </div>

          <footer class="donate-footer">
            <button class="donate-btn-primary">Buy us a coffee ☕</button>
            <p class="donate-thanks">Thank you for supporting independent educational software.</p>
          </footer>
        </div>
      </div>
    `;
  }
}
