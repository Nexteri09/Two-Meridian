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
    this.reverseActive = false;
    this.reverseGuideOpen = false;
    this.reverseCurrentCountry = null;
    this.reverseCorrect = 0;
    this.reverseSkipped = 0;

    // Streak engine
    this.streakCount = 0;
    this.lastGuessTime = 0;

    // Instant submit mode (auto-submit on match without Enter)
    const savedInstant = this.app.storage.get('instantSubmit');
    this.instantSubmit = savedInstant !== undefined ? savedInstant : true;

    this.bind();
  }

  bind() {
    // Instant submit toggle pill
    const toggleBtn = document.getElementById('instant-submit-toggle');
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', this.instantSubmit);
      toggleBtn.addEventListener('click', () => {
        this.instantSubmit = !this.instantSubmit;
        this.app.storage.set('instantSubmit', this.instantSubmit);
        toggleBtn.classList.toggle('active', this.instantSubmit);
        this.app.sidebar.showInputFeedback(
          this.instantSubmit ? 'Auto-Submit Enabled' : 'Auto-Submit Disabled',
          'correct'
        );
      });
    }

    // Main input
    const input = document.getElementById('country-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleGuess(input.value);
          input.value = '';
        }
      });

      // Instant submit as user types
      input.addEventListener('input', () => {
        if (!this.instantSubmit) return;
        const val = input.value.trim();
        if (!val) return;
        const countryId = this.matcher.match(val);
        if (countryId && !this.guessedCountries.has(countryId)) {
          this.handleGuess(val);
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

    // Reverse input enter key & focus management (No Auto-Submit in Reverse Mode)
    const revCountryInput = document.getElementById('reverse-country-input');
    if (revCountryInput) {
      revCountryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleReverseSubmit();
      });

      // Keep focus
      revCountryInput.addEventListener('blur', () => {
        if (this.mode === 'reverse' && this.reverseActive) {
          setTimeout(() => revCountryInput.focus(), 50);
        }
      });
    }

    // Conclude / Begin Expedition button
    const concludeBtn = document.getElementById('btn-conclude-expedition');
    if (concludeBtn) {
      concludeBtn.addEventListener('click', () => this.handleExpeditionActionClick());
    }
  }

  handleExpeditionActionClick() {
    if (this.mode === 'reverse') {
      if (!this.reverseActive) {
        if (!this.reverseGuideOpen) {
          // 1st click: expand the 3-points guide
          this.reverseGuideOpen = true;
          const guide = document.getElementById('expedition-guide');
          if (guide) guide.classList.remove('hidden');
          const btn = document.getElementById('btn-conclude-expedition');
          if (btn) btn.classList.add('guide-open');
        } else {
          // 2nd click: start the game, timer and glowing country!
          this.startReverseExpedition();
        }
      } else {
        // Conclude expedition during active game
        this.handleConcludeExpedition();
      }
    } else {
      this.handleConcludeExpedition();
    }
  }

  handleConcludeExpedition() {
    const score = this.mode === 'reverse' || this.mode === 'weakspots' ? this.reverseCorrect : this.guessedCountries.size;
    
    // Record daily streak participation
    this.app.storage.recordDailyPlay();

    // Abandon session on server if they conclude early
    if (this.app.sessionManager) {
      this.app.sessionManager.abandonSession();
    }

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

    // Trigger vintage debrief modal with continent stats and certificate share context
    if (this.app.mapView) {
      this.app.mapView.triggerExpeditionDebrief({
        mode: this.mode,
        score,
        total: this.totalCountries,
        elapsedMs: this.elapsedMs,
        reverseSkipped: this.reverseSkipped,
        streakCount: this.streakCount,
        continentStats: this.getContinentStats()
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

    if (this.mode !== 'casual' && this.app.sessionManager) {
      this.app.sessionManager.completeSession(this.guessedCountries.size);
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
      if (this.mode === 'speed' && this.app.sessionManager) {
        this.app.sessionManager.startSession('speed');
      }
      this.startTimer();
    }
    
    // Log guess to server
    if (this.mode === 'speed' && this.app.sessionManager) {
      this.app.sessionManager.logGuess(countryId, true);
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
    this.reverseActive = false;
    this.reverseGuideOpen = false;
    this.reverseQueue = null;
    this.reverseCurrentCountry = null;
    this.reverseCorrect = 0;
    this.reverseSkipped = 0;
    this.streakCount = 0;
    this.app.sidebar.updateStreak(0);
    this.resetTimer();
    this.app.mapView.clearReverseHighlight();
    if (this.app.mapView) {
      this.app.mapView.setReverseActiveState(false);
    }

    const guide = document.getElementById('expedition-guide');
    if (guide) guide.classList.add('hidden');

    this.updateExpeditionButtonState('begin');

    const countryInput = document.getElementById('reverse-country-input');
    if (countryInput) {
      countryInput.value = '';
      countryInput.placeholder = "Click 'Begin Expedition' to start...";
    }
  }

  startReverseExpedition() {
    this.reverseActive = true;
    this.reverseGuideOpen = false;

    const guide = document.getElementById('expedition-guide');
    if (guide) guide.classList.add('hidden');

    this.updateExpeditionButtonState('conclude');

    if (this.app.mapView) {
      this.app.mapView.setReverseActiveState(true);
    }

    if (this.mode === 'weakspots') {
      const weakSpots = this.app.storage.getWeakSpots();
      if (weakSpots.length === 0) {
        this.app.sidebar.showInputFeedback('No weak spots recorded in logbook yet!', 'incorrect');
        this.reverseActive = false;
        this.updateExpeditionButtonState('begin');
        return;
      }
      this.reverseQueue = [...weakSpots].sort(() => Math.random() - 0.5);
      this.totalCountries = weakSpots.length;
    } else {
      this.reverseQueue = [...this.app.countriesData]
        .sort(() => Math.random() - 0.5)
        .map(c => c.id);
      this.totalCountries = this.app.countriesData.length;
    }

    this.reverseCorrect = 0;
    this.reverseSkipped = 0;
    this.streakCount = 0;
    this.app.sidebar.updateStreak(0);
    
    if (this.app.sessionManager) {
      this.app.sessionManager.startSession(this.mode);
    }

    this.startTimer();
    this.nextReverseCountry();

    setTimeout(() => {
      const countryInput = document.getElementById('reverse-country-input');
      if (countryInput) {
        countryInput.placeholder = "Country name...";
        countryInput.focus();
      }
    }, 100);
  }

  updateExpeditionButtonState(state) {
    const btn = document.getElementById('btn-conclude-expedition');
    const text = document.getElementById('expedition-btn-text');
    const icon = document.getElementById('expedition-btn-icon');
    if (!btn) return;

    if (state === 'begin') {
      btn.classList.add('state-begin');
      btn.classList.remove('state-conclude', 'guide-open');
      if (text) text.textContent = 'Begin Expedition';
      if (icon) {
        icon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
      }
    } else {
      btn.classList.remove('state-begin', 'guide-open');
      btn.classList.add('state-conclude');
      if (text) text.textContent = 'Conclude Expedition';
      if (icon) {
        icon.innerHTML = `
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        `;
      }
    }
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
      countryInput.placeholder = "Country name...";
      countryInput.focus();
    }
  }

  handleReverseSkip() {
    if (!this.reverseActive || !this.reverseCurrentCountry) return;
    this.reverseSkipped++;
    this.streakCount = 0;
    this.app.sidebar.updateStreak(0);
    
    // Add skipped country to weak spots
    this.app.storage.addWeakSpot(this.reverseCurrentCountry.id);

    this.app.sidebar.showInputFeedback(`Skipped: ${this.reverseCurrentCountry.name}`, '');
    this.app.mapView.clearReverseHighlight();
    
    if (this.app.sessionManager) {
      this.app.sessionManager.logGuess(this.reverseCurrentCountry.id, false);
    }
    
    this.nextReverseCountry();
  }

  handleReverseSubmit() {
    if (!this.reverseActive) {
      this.startReverseExpedition();
      return;
    }

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

      // Remove from weak spots if mastered
      this.app.storage.removeWeakSpot(this.reverseCurrentCountry.id);

      // In Reverse mode, no cooldown decay — streak simply increments on consecutive correct guesses
      this.streakCount++;
      this.app.sidebar.updateStreak(this.streakCount);
      
      if (this.app.sessionManager) {
        this.app.sessionManager.logGuess(this.reverseCurrentCountry.id, true);
      }

      this.app.sidebar.updateCounter(this.guessedCountries.size, this.totalCountries);
      this.updateContinentProgress(this.reverseCurrentCountry.continent);
      this.app.sidebar.addDiscoveryToLog(this.reverseCurrentCountry, this.guessedCountries.size);

      // Play success audio
      this.app.playSound('correct');

      this.app.sidebar.showInputFeedback(`✓ Correct: ${this.reverseCurrentCountry.name}`, 'correct');
      countryInput.value = '';

      // Clear previous country glow and get next
      this.app.mapView.clearReverseHighlight();
      this.nextReverseCountry();
    } else {
      // Wrong guess
      this.app.playSound('wrong');
      this.streakCount = 0;
      this.app.sidebar.updateStreak(0);

      // Add to weak spots
      this.app.storage.addWeakSpot(this.reverseCurrentCountry.id);

      this.app.sidebar.showInputFeedback(`✗ Try again`, 'incorrect');

      if (this.app.sessionManager && countryGuess) {
        // Log wrong guess for the active highlighted country
        this.app.sessionManager.logGuess(this.reverseCurrentCountry.id, false);
      }

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
      this.startReverseMode();
    } else {
      this.reverseActive = false;
      this.reverseGuideOpen = false;
      const guide = document.getElementById('expedition-guide');
      if (guide) guide.classList.add('hidden');
      this.updateExpeditionButtonState('conclude');
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
    this.reverseActive = false;
    this.updateExpeditionButtonState('begin');
    if (this.app.mapView) {
      this.app.mapView.setReverseActiveState(false);
    }

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

  getContinentStats() {
    const continents = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];
    const stats = {};

    continents.forEach(cont => {
      const allInCont = this.app.countriesData.filter(c => {
        if (cont === 'Americas') return c.continent === 'North America' || c.continent === 'South America';
        return c.continent === cont;
      });
      const correctCount = allInCont.filter(c => this.guessedCountries.has(c.id)).length;
      stats[cont] = {
        correct: correctCount,
        total: allInCont.length
      };
    });

    return stats;
  }
}
