// ============================================
// QuizPage — base class for specialized quiz modes
// ============================================

export class QuizPage {
  constructor(app, containerId) {
    this.app = app;
    this.container = document.getElementById(containerId);
    this.countries = [...app.countriesData];
    this.pool = [];
    this.currentIndex = 0;
    this.score = 0;
    this.totalAttempted = 0;
    this.currentCountry = null;
  }

  init() {
    this.shufflePool();
    this.renderLayout();
    this.nextQuestion();
  }

  shufflePool() {
    this.pool = [...this.countries].sort(() => Math.random() - 0.5);
    this.currentIndex = 0;
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="quiz-layout">
        <div class="quiz-card glass">
          <div class="quiz-header">
            <div class="quiz-stats">
              <span class="quiz-stat-label">Correct</span>
              <span class="quiz-stat-value" id="quiz-score">0</span>
            </div>
            <div class="quiz-title" id="quiz-instruction">Identify the country</div>
            <div class="quiz-stats">
              <span class="quiz-stat-label">Total</span>
              <span class="quiz-stat-value" id="quiz-attempted">0</span>
            </div>
          </div>
          
          <div class="quiz-display" id="quiz-display-area">
            <!-- Specific quiz content (flag, capital name, etc) -->
          </div>

          <div class="quiz-input-wrapper">
            <input type="text" id="quiz-input" placeholder="Type country name..." autocomplete="off" spellcheck="false">
            <div class="quiz-feedback" id="quiz-feedback"></div>
          </div>

          <div class="quiz-actions">
            <button class="quiz-skip-btn" id="quiz-skip">Skip →</button>
          </div>
        </div>
      </div>
    `;

    const input = this.container.querySelector('#quiz-input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.checkAnswer(input.value);
    });

    this.container.querySelector('#quiz-skip').addEventListener('click', () => {
      this.showFeedback(`The answer was: ${this.currentCountry.name}`, 'incorrect');
      setTimeout(() => this.nextQuestion(), 1500);
    });
  }

  nextQuestion() {
    if (this.currentIndex >= this.pool.length) {
      this.shufflePool();
    }

    this.currentCountry = this.pool[this.currentIndex];
    this.currentIndex++;
    this.totalAttempted++;
    
    const input = this.container.querySelector('#quiz-input');
    if (input) {
      input.value = '';
      input.focus();
    }

    this.updateStats();
    this.updateDisplayArea();
  }

  checkAnswer(value) {
    if (!value.trim()) return;
    const matchId = this.app.gameEngine.matcher.match(value);

    if (matchId === this.currentCountry.id) {
      this.score++;
      this.app.playSound('correct');
      this.showFeedback('✓ Correct!', 'correct');
      setTimeout(() => this.nextQuestion(), 1000);
    } else {
      this.app.playSound('wrong');
      const input = this.container.querySelector('#quiz-input');
      input.classList.add('input-error');
      setTimeout(() => input.classList.remove('input-error'), 600);
    }
    this.updateStats();
  }

  updateStats() {
    const s = this.container.querySelector('#quiz-score');
    const a = this.container.querySelector('#quiz-attempted');
    if (s) s.textContent = this.score;
    if (a) a.textContent = this.totalAttempted;
  }

  showFeedback(text, type) {
    const fb = this.container.querySelector('#quiz-feedback');
    if (!fb) return;
    fb.textContent = text;
    fb.className = `quiz-feedback visible ${type}`;
    setTimeout(() => fb.classList.remove('visible'), 2000);
  }

  updateDisplayArea() {
    // Override in subclasses
  }
}
