// ==========================================================================
// Two Meridian — Sidebar: Mode selector, timer, counter, discovery log, ranks
// ==========================================================================

export class Sidebar {
  constructor(app) {
    this.app = app;
    this.el = document.getElementById('sidebar');
    this.modeSelector = document.getElementById('mode-selector');
    this.modeBtns = document.querySelectorAll('.mode-btn');
    this.recentDiscoveries = [];
    this.bind();
  }

  bind() {
    this.modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.modeSelector.dataset.active = mode;
        this.app.setMode(mode);
      });
    });

    const resetBtn = document.getElementById('reset-all');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.app.gameEngine.resetAllProgress();
      });
    }

    // Bind continent row clicks to highlight/frame continent
    const rows = document.querySelectorAll('.continent-row');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const continent = row.dataset.continent;
        if (!continent || !this.app.mapView?.svgElement) return;

        // Find first visible country in that continent and focus
        const countryInContinent = this.app.countriesData.find(c => c.continent === continent);
        if (countryInContinent) {
          const lowerId = countryInContinent.id.toLowerCase();
          const el = this.app.mapView.svgElement.querySelector(`[id="${lowerId}"], [data-id="${lowerId}"]`);
          if (el) {
            this.app.mapView.navigator?.focusElement(el, 2.2);
          }
        }
      });
    });
  }

  setMode(mode) {
    this.el.dataset.mode = mode;
    this.modeSelector.dataset.active = mode;
    this.modeBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    // Update brand icon color to match game mode
    const icon = document.getElementById('brand-icon');
    if (icon) {
      const modeColors = { casual: '#B8944F', speed: '#4376AB', reverse: '#D65141' };
      icon.style.color = modeColors[mode] || '#B8944F';
      icon.style.transition = 'color 0.3s ease';
    }

    // Update continent panel bar colors
    const fills = document.querySelectorAll('.cp-bar-fill');
    const barColors = { casual: '#B8944F', speed: '#4376AB', reverse: '#D65141' };
    fills.forEach(fill => {
      fill.style.background = barColors[mode] || '#B8944F';
    });

    // Update completed-row highlight color
    document.documentElement.style.setProperty(
      '--cp-active-color', barColors[mode] || '#B8944F'
    );
  }

  // ── Continent panel progress ───────────────────────────────────
  updateContinentPanel(continent, found, total, mapView) {
    const countEl = document.getElementById(`cpc-${continent}`);
    const barEl   = document.getElementById(`cpb-${continent}`);
    const rowEl   = document.getElementById(`cp-${continent}`);

    if (countEl) countEl.textContent = `${found}/${total}`;
    if (barEl)   barEl.style.width = `${Math.round((found / total) * 100)}%`;

    // Highlight active row
    document.querySelectorAll('.continent-row').forEach(r => r.classList.remove('cp-active'));
    if (rowEl && found > 0) rowEl.classList.add('cp-active');

    // Fade/blur the continent panel row when all countries guessed
    if (found >= total && rowEl) {
      rowEl.classList.add('cp-complete');
    }
  }

  updateCounter(count, total) {
    const current = document.getElementById('counter-current');
    const totalEl = document.getElementById('counter-total');
    const bar = document.getElementById('counter-bar-fill');

    if (current) {
      current.textContent = count;
      current.classList.remove('counter-bounce');
      void current.offsetWidth; // trigger reflow
      current.classList.add('counter-bounce');
    }
    if (totalEl) totalEl.textContent = total;
    if (bar) bar.style.width = `${(count / total) * 100}%`;

    this.updateRank(count);
  }

  updateRank(foundCount) {
    const rankBadge = document.getElementById('rank-badge');
    if (!rankBadge) return;

    let rank = 'Apprentice Cartographer';
    if (foundCount >= 196)      rank = 'Grand Sovereign Cartographer';
    else if (foundCount >= 140) rank = 'High Atlas Surveyor';
    else if (foundCount >= 90)  rank = 'Royal Hydrographer';
    else if (foundCount >= 45)  rank = 'Senior Field Cartographer';
    else if (foundCount >= 20)  rank = 'Field Navigator';
    else if (foundCount >= 5)   rank = 'Chart Room Scout';

    rankBadge.textContent = rank;
  }

  updateStreak(streak) {
    const pill = document.getElementById('streak-pill');
    if (!pill) return;

    if (streak >= 2) {
      pill.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" style="flex-shrink:0;vertical-align:-1px"><path d="M12 2c0 4-4 6-4 10a4 4 0 0 0 8 0c0-4-4-6-4-10z"/><path d="M12 12c0 2-2 3-2 5a2 2 0 0 0 4 0c0-2-2-3-2-5z"/></svg> ${streak}x Streak`;
      pill.classList.remove('hidden');
      pill.classList.remove('streak-pop');
      void pill.offsetWidth;
      pill.classList.add('streak-pop');
    } else {
      pill.classList.add('hidden');
    }
  }

  addDiscoveryToLog(country, totalFound) {
    const list = document.getElementById('discovery-log-list');
    const countEl = document.getElementById('log-count');
    if (!list) return;

    if (countEl) countEl.textContent = `${totalFound} Recorded`;

    // Remove empty placeholder
    const empty = list.querySelector('.discovery-log-empty');
    if (empty) empty.remove();

    const flagSrc = `https://flagcdn.com/w80/${country.id.toLowerCase()}.png`;

    const item = document.createElement('div');
    item.className = 'discovery-log-item fade-in-up';
    item.innerHTML = `
      <img class="discovery-log-flag" src="${flagSrc}" alt="${country.name} flag" onerror="this.style.display='none'">
      <div class="discovery-log-info">
        <span class="discovery-log-name">${country.name}</span>
        <span class="discovery-log-sub">${country.continent} • ${country.capital}</span>
      </div>
      <span class="discovery-log-num">#${totalFound}</span>
    `;

    list.insertBefore(item, list.firstChild);

    // Keep up to 6 items
    while (list.children.length > 6) {
      list.removeChild(list.lastChild);
    }
  }

  clearDiscoveryLog() {
    const list = document.getElementById('discovery-log-list');
    const countEl = document.getElementById('log-count');
    if (list) {
      list.innerHTML = '<div class="discovery-log-empty">Type a country to chart the atlas...</div>';
    }
    if (countEl) countEl.textContent = '0 Recorded';
    this.updateStreak(0);
    this.updateRank(0);
  }

  updateTimer(totalMs = 0) {
    const display = document.getElementById('timer-display');
    if (!display) return;
    const mins = Math.floor(totalMs / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const centis = Math.floor((totalMs % 1000) / 10);
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  }

  showFactCard(country) {
    const container = document.getElementById('fact-card-container');
    if (!container) return;

    const flagSrc = `https://flagcdn.com/w160/${country.id.toLowerCase()}.png`;

    container.innerHTML = `
      <div class="fact-card fact-card-enter">
        <div class="fact-card-header">
          <img class="fact-card-flag" src="${flagSrc}" alt="${country.name} flag"
               onerror="this.style.display='none'">
          <div class="fact-card-name">${country.name}</div>
        </div>
        <div class="fact-card-details">
          <div class="fact-detail">
            <span class="fact-detail-label">Capital</span>
            <span class="fact-detail-value">${country.capital}</span>
          </div>
          <div class="fact-detail">
            <span class="fact-detail-label">Continent</span>
            <span class="fact-detail-value">${country.continent}</span>
          </div>
          <div class="fact-detail">
            <span class="fact-detail-label">Currency</span>
            <span class="fact-detail-value">${country.currency}</span>
          </div>
          <div class="fact-detail">
            <span class="fact-detail-label">Known For</span>
            <span class="fact-detail-value">${country.famous_brand || '—'}</span>
          </div>
        </div>
        <div class="fact-card-funfact">${country.fun_fact}</div>
      </div>
    `;
  }

  clearFactCard() {
    const container = document.getElementById('fact-card-container');
    if (container) container.innerHTML = '';
  }

  showInputFeedback(text, type) {
    const fb = document.getElementById('input-feedback');
    if (!fb) return;
    fb.textContent = text;
    fb.className = `input-feedback visible ${type}`;
    setTimeout(() => { fb.classList.remove('visible'); }, 2000);
  }

  updateBestTime(totalMs) {
    const el = document.getElementById('best-time-value');
    if (!el) return;
    if (totalMs === null || totalMs === undefined) {
      el.textContent = '--:--.--';
    } else {
      const mins = Math.floor(totalMs / 60000);
      const secs = Math.floor((totalMs % 60000) / 1000);
      const centis = Math.floor((totalMs % 1000) / 10);
      el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
    }
  }
}
