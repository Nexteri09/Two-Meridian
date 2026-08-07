// ==========================================================================
// Two Meridian — GameEngine: Core game logic, combo streak, ranks, scoring
// ==========================================================================

import { CountryMatcher } from '../utils/countryMatcher.js';

export class GameEngine {
  constructor(app) {
    this.app = app;
    this.matcher = new CountryMatcher(app.countriesData);
    this.mode = 'casual';
    this.guessedCountries = new Set();
    this.totalCountries = app.countriesData.length;
    this.timerInterval = null;
    this.timerStartTime = 0;
    this.elapsedMs = 0;
    this.timerRunning = false;
    this.speedStreakTimeout = null;
    this.reverseCurrentCountry = null;
    this.reverseCorrect = 0;
    this.reverseSkipped = 0;

    // Streak engine
    this.streakCount = 0;
    this.lastGuessTime = 0;

    this.bind();
  }

  bind() {
    // Main input
    const input = document.getElementById('country-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleGuess(input.value);
          input.value = '';
        }
      });
      // Keep focus
      input.addEventListener('blur', () => {
        if (this.mode !== 'reverse') {
          setTimeout(() => input.focus(), 50);
        }
      });
    }

    // Reverse mode controls
    const submitBtn = document.getElementById('reverse-submit');
    const skipBtn = document.getElementById('reverse-skip');
    if (submitBtn) submitBtn.addEventListener('click', () => this.handleReverseSubmit());
    if (skipBtn) skipBtn.addEventListener('click', () => this.handleReverseSkip());

    // Reverse input enter key
    const revCountryInput = document.getElementById('reverse-country-input');
    if (revCountryInput) {
      revCountryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleReverseSubmit();
      });
      // Keep focus
      revCountryInput.addEventListener('blur', () => {
        if (this.mode === 'reverse') {
          setTimeout(() => revCountryInput.focus(), 50);
        }
      });
    }

    // Conclude Expedition button
    const concludeBtn = document.getElementById('btn-conclude-expedition');
    if (concludeBtn) {
      concludeBtn.addEventListener('click', () => this.handleConcludeExpedition());
    }
  }

  handleConcludeExpedition() {
    const score = this.mode === 'reverse' ? this.reverseCorrect : this.guessedCountries.size;
    if (score === 0 && this.elapsedMs === 0) {
      this.app.sidebar.showInputFeedback('Chart territories before concluding!', 'incorrect');
      return;
    }

    // Pause timer while reviewing debrief
    this.stopTimer();
    if (this.speedStreakTimeout) {
      clearTimeout(this.speedStreakTimeout);
      this.speedStreakTimeout = null;
    }

    // Trigger vintage debrief modal
    if (this.app.mapView) {
      this.app.mapView.triggerExpeditionDebrief({
        mode: this.mode,
        score,
        total: this.totalCountries,
        elapsedMs: this.elapsedMs,
        reverseSkipped: this.reverseSkipped
      });
    }
  }

  finalizeExpedition() {
    const score = this.mode === 'reverse' ? this.reverseCorrect : this.guessedCountries.size;

    // Record session to stats history
    this.recordRun(this.mode, score, this.totalCountries, this.elapsedMs);

    // If speed mode and 100% completed, save best time
    if (this.mode === 'speed' && score === this.totalCountries && this.elapsedMs > 0) {
      const best = this.app.storage.get('speedBestTime');
      if (!best || this.elapsedMs < best) {
        this.app.storage.set('speedBestTime', this.elapsedMs);
        this.app.sidebar.updateBestTime(this.elapsedMs);
      }
    }

    this.app.sidebar.showInputFeedback('Expedition archived to Stats! 📜', 'correct');

    // Reset progress for next expedition
    this.resetAllProgress();
  }

  handleGuess(value) {
    if (!value.trim()) return;
    const countryId = this.matcher.match(value);

    if (!countryId) {
      this.app.sidebar.showInputFeedback('Country not recognized', 'incorrect');
      this.app.playSound('wrong');
      this.streakCount = 0;
      this.app.sidebar.updateStreak(0);
      if (this.speedStreakTimeout) {
        clearTimeout(this.speedStreakTimeout);
        this.speedStreakTimeout = null;
      }
      const input = document.getElementById('country-input');
      if (input) {
        input.classList.add('input-error');
        setTimeout(() => input.classList.remove('input-error'), 600);
      }
      return;
    }

    if (this.guessedCountries.has(countryId)) {
      this.app.sidebar.showInputFeedback('Already discovered!', '');
      return;
    }

    // Correct guess
    this.guessedCountries.add(countryId);
    this.app.storage.set(`guessed_${this.mode}`, Array.from(this.guessedCountries));

    // Update streak combo
    const now = Date.now();
    if (this.mode === 'speed') {
      if (now - this.lastGuessTime <= 15000) {
        this.streakCount++;
      } else {
        this.streakCount = 1;
      }
      this.lastGuessTime = now;
      this.app.sidebar.updateStreak(this.streakCount);

      // In speed mode, reset streak if no input for 15 seconds
      if (this.speedStreakTimeout) clearTimeout(this.speedStreakTimeout);
      this.speedStreakTimeout = setTimeout(() => {
        if (this.mode === 'speed') {
          this.streakCount = 0;
          this.app.sidebar.updateStreak(0);
        }
      }, 15000);
    } else {
      if (now - this.lastGuessTime <= 15000) {
        this.streakCount++;
      } else {
        this.streakCount = 1;
      }
      this.lastGuessTime = now;
      this.app.sidebar.updateStreak(this.streakCount);
    }

    // Auto-start timer on first correct guess if not running
    if (!this.timerRunning) {
      this.startTimer();
    }

    // Highlight on map with instant discovery flash
    this.app.mapView.highlightCountry(countryId, this.mode);

    // Update counter & rank
    this.app.sidebar.updateCounter(this.guessedCountries.size, this.totalCountries);

    // Update continent progress
    const country = this.matcher.getCountry(countryId);
    if (country) {
      this.updateContinentProgress(country.continent);

      // Add to Discovery Log
      this.app.sidebar.addDiscoveryToLog(country, this.guessedCountries.size);

      // Show fact card in casual mode
      if (this.mode === 'casual') {
        this.app.sidebar.showFactCard(country);
      }

      this.app.sidebar.showInputFeedback(`✓ ${country.name}`, 'correct');
    }

    this.app.playSound('correct');

    // Flash input
    const input = document.getElementById('country-input');
    if (input) {
      input.classList.add('input-correct');
      setTimeout(() => input.classList.remove('input-correct'), 600);
    }

    // Check completion
    if (this.guessedCountries.size === this.totalCountries) {
      this.handleCompletion();
    }
  }

  handleMapClick(countryId) {
    if (this.mode !== 'casual') return;

    const upperId = countryId.toUpperCase();
    const country = this.matcher.getCountry(upperId);
    if (!country) return;

    // Highlight passively
    this.app.mapView.highlightPassive(upperId);

    // Show fact card
    this.app.sidebar.showFactCard(country);
  }

  updateContinentProgress(continent) {
    const continentCountries = this.app.countriesData.filter(c => c.continent === continent);
    const total = continentCountries.length;
    const found = continentCountries.filter(c => this.guessedCountries.has(c.id)).length;
    this.app.sidebar.updateContinentPanel(continent, found, total, this.app.mapView);
  }

  // --- High-Precision Stopwatch Timer ---
  startTimer() {
    if (this.timerRunning) return;
    this.timerRunning = true;
    this.timerStartTime = Date.now() - this.elapsedMs;
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.elapsedMs = Date.now() - this.timerStartTime;
      this.app.sidebar.updateTimer(this.elapsedMs);
    }, 33);
  }

  stopTimer() {
    this.timerRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resetTimer() {
    this.stopTimer();
    this.elapsedMs = 0;
    this.app.sidebar.updateTimer(0);
  }

  // --- Reverse Mode Logic ---
  startReverseMode() {
    this.reverseQueue = [...this.app.countriesData]
      .sort(() => Math.random() - 0.5)
      .map(c => c.id);
    this.reverseCorrect = 0;
    this.reverseSkipped = 0;
    this.streakCount = 0;
    this.app.sidebar.updateStreak(0);
    this.startTimer();
    this.nextReverseCountry();
  }

  nextReverseCountry() {
    if (!this.reverseQueue || this.reverseQueue.length === 0) {
      this.handleReverseCompletion();
      return;
    }

    const nextId = this.reverseQueue.pop();
    this.reverseCurrentCountry = this.matcher.getCountry(nextId);

    if (!this.reverseCurrentCountry) {
      this.nextReverseCountry();
      return;
    }

    // Highlight the mystery country
    this.app.mapView.highlightForReverse(this.reverseCurrentCountry.id);

    // Reset reverse input
    const countryInput = document.getElementById('reverse-country-input');
    if (countryInput) {
      countryInput.value = '';
      countryInput.focus();
    }
  }

  handleReverseSkip() {
    if (!this.reverseCurrentCountry) return;
    this.reverseSkipped++;
    this.streakCount = 0;
    this.app.sidebar.updateStreak(0);
    this.app.sidebar.showInputFeedback(`Skipped: ${this.reverseCurrentCountry.name}`, '');
    this.app.mapView.clearReverseHighlight();
    this.nextReverseCountry();
  }

  handleReverseSubmit() {
    if (!this.reverseCurrentCountry) return;

    if (!this.timerRunning) {
      this.startTimer();
    }

    const countryInput = document.getElementById('reverse-country-input');
    if (!countryInput) return;

    const countryGuess = this.matcher.match(countryInput.value);

    if (countryGuess === this.reverseCurrentCountry.id) {
      this.reverseCorrect++;
      this.guessedCountries.add(this.reverseCurrentCountry.id);

      // In Reverse mode, no cooldown decay — streak simply increments on consecutive correct guesses
      this.streakCount++;
      this.app.sidebar.updateStreak(this.streakCount);

      this.app.sidebar.updateCounter(this.guessedCountries.size, this.totalCountries);
      this.updateContinentProgress(this.reverseCurrentCountry.continent);
      this.app.sidebar.addDiscoveryToLog(this.reverseCurrentCountry, this.guessedCountries.size);
      this.app.playSound('correct');
      this.app.sidebar.showInputFeedback(`✓ ${this.reverseCurrentCountry.name}`, 'correct');

      this.reverseCurrentCountry = null;
      setTimeout(() => {
        this.app.mapView.clearReverseHighlight();
        this.nextReverseCountry();
      }, 600);
    } else {
      this.app.playSound('wrong');
      this.streakCount = 0;
      this.app.sidebar.updateStreak(0);
      this.app.sidebar.showInputFeedback(`✗ Try again`, 'incorrect');

      countryInput.classList.add('input-error');
      setTimeout(() => countryInput.classList.remove('input-error'), 600);
    }
  }

  // --- Mode switching ---
  setMode(mode) {
    this.resetTimer();
    if (this.speedStreakTimeout) {
      clearTimeout(this.speedStreakTimeout);
      this.speedStreakTimeout = null;
    }
    this.mode = mode;
    this.streakCount = 0;
    this.lastGuessTime = 0;
    this.app.storage.set('currentMode', mode);
    document.body.setAttribute('data-mode', mode);

    // Clear ALL game state: guesses, map, counter, badges, timer, fact card
    this.guessedCountries.clear();
    this.clearAllHighlights();
    this.app.sidebar.updateCounter(0, this.totalCountries);
    this.app.sidebar.updateTimer(0);
    this.app.sidebar.clearFactCard();
    this.app.sidebar.clearDiscoveryLog();
    this.refreshAllContinentProgress();

    if (mode === 'speed') {
      const best = this.app.storage.get('speedBestTime');
      this.app.sidebar.updateBestTime(best || null);
    }

    if (mode === 'reverse') {
      this.reverseQueue = null;
      this.reverseCorrect = 0;
      this.reverseSkipped = 0;
      this.startReverseMode();
    }

    setTimeout(() => {
      const input = document.getElementById('country-input');
      if (input && mode !== 'reverse') input.focus();
    }, 100);
  }

  restoreProgress() {
    const saved = this.app.storage.get(`guessed_${this.mode}`) || [];
    this.guessedCountries = new Set(saved);
    for (const id of this.guessedCountries) {
      this.app.mapView.highlightCountry(id, this.mode);
    }
    this.app.sidebar.updateCounter(this.guessedCountries.size, this.totalCountries);
    this.refreshAllContinentProgress();
  }

  refreshAllContinentProgress() {
    const continents = ['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Oceania'];
    continents.forEach(c => this.updateContinentProgress(c));
  }

  clearAllHighlights() {
    if (!this.app.mapView.svgElement) return;
    const paths = this.app.mapView.svgElement.querySelectorAll(
      '.guessed-casual, .guessed-speed, .guessed-reverse, .reverse-active, .passive-active, .just-discovered'
    );
    paths.forEach(el => {
      el.classList.remove('guessed-casual', 'guessed-speed', 'guessed-reverse', 'reverse-active', 'passive-active', 'just-discovered');
    });

    const rows = document.querySelectorAll('.continent-row');
    rows.forEach(r => r.classList.remove('cp-complete', 'cp-active'));
  }

  resetAllProgress() {
    this.resetTimer();
    if (this.speedStreakTimeout) {
      clearTimeout(this.speedStreakTimeout);
      this.speedStreakTimeout = null;
    }
    this.streakCount = 0;
    this.lastGuessTime = 0;

    this.guessedCountries.clear();
    this.app.storage.remove('guessed_casual');
    this.app.storage.remove('guessed_speed');
    this.app.storage.remove('guessed_reverse');
    this.app.storage.remove('speedBestTime');

    this.clearAllHighlights();
    this.app.sidebar.updateCounter(0, this.totalCountries);
    this.app.sidebar.updateTimer(0);
    this.app.sidebar.updateBestTime(null);
    this.app.sidebar.clearFactCard();
    this.app.sidebar.clearDiscoveryLog();
    this.refreshAllContinentProgress();

    this.setMode(this.mode);
    this.app.sidebar.showInputFeedback('Progress reset', 'correct');
  }

  handleCompletion() {
    this.stopTimer();
    if (this.speedStreakTimeout) {
      clearTimeout(this.speedStreakTimeout);
      this.speedStreakTimeout = null;
    }

    if (this.mode === 'speed' && this.elapsedMs > 0) {
      const best = this.app.storage.get('speedBestTime');
      if (!best || this.elapsedMs < best) {
        this.app.storage.set('speedBestTime', this.elapsedMs);
        this.app.sidebar.updateBestTime(this.elapsedMs);
      }
    }

    this.recordRun(this.mode, this.guessedCountries.size, this.totalCountries, this.elapsedMs);

    if (this.app.mapView) {
      if (this.mode === 'casual') this.app.mapView.triggerCasualCelebration();
      else if (this.mode === 'speed') this.app.mapView.triggerSpeedCelebration(this.elapsedMs);
      else if (this.mode === 'reverse') this.app.mapView.triggerReverseCelebration({ elapsedMs: this.elapsedMs });
    }
  }

  handleReverseCompletion() {
    this.stopTimer();

    this.recordRun('reverse', this.reverseCorrect, this.totalCountries, this.elapsedMs);

    if (this.app.mapView) {
      this.app.mapView.triggerReverseCelebration({
        elapsedMs: this.elapsedMs,
        reverseSkipped: this.reverseSkipped
      });
    }
  }

  recordRun(mode, score, total, elapsedMs) {
    const history = this.app.storage.get('history') || [];
    history.push({
      timestamp: Date.now(),
      mode,
      score,
      total,
      elapsedMs
    });
    if (history.length > 50) {
      history.shift();
    }
    this.app.storage.set('history', history);
  }
}
