import { supabase } from '../lib/supabase.js';

export class LeaderboardManager {
  constructor(app) {
    this.app = app;
    this.overlay = document.getElementById('leaderboard-overlay');
    this.closeBtn = document.getElementById('leaderboard-close');
    this.triggerBtn = document.getElementById('nav-leaderboard-btn');
    this.tabs = document.querySelectorAll('.lb-tab');
    this.contentSpeed = document.getElementById('lb-content-speed');
    this.contentReverse = document.getElementById('lb-content-reverse');

    this.currentMode = 'speed'; // default
    this.data = { speed: null, reverse: null };

    this._bindEvents();
  }

  _bindEvents() {
    if (this.triggerBtn) {
      this.triggerBtn.addEventListener('click', () => this.open());
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    // Close on click outside
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }

    this.tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.currentMode = e.target.dataset.lb;
        this._render();
      });
    });
  }

  async open() {
    this.overlay.classList.remove('hidden');
    // Fetch fresh data every time it's opened
    await this.fetchLeaderboards();
    this._render();
  }

  close() {
    this.overlay.classList.add('hidden');
  }

  async fetchLeaderboards() {
    this._showLoading();
    
    // The view daily_leaderboards is already sorted and filtered
    const { data, error } = await supabase
      .from('daily_leaderboards')
      .select('*')
      .limit(50); // Get top 50 overall, we'll filter by mode in JS

    if (error) {
      console.error('Failed to load leaderboards', error);
      this._showError();
      return;
    }

    // Process data
    this.data.speed = data.filter(d => d.mode === 'speed').slice(0, 10);
    this.data.reverse = data.filter(d => d.mode === 'reverse').slice(0, 10);
  }

  _showLoading() {
    this.contentSpeed.innerHTML = '<div class="lb-loading">Retrieving archives...</div>';
    this.contentReverse.innerHTML = '<div class="lb-loading">Retrieving archives...</div>';
  }

  _showError() {
    this.contentSpeed.innerHTML = '<div class="lb-loading">Error retrieving archives.</div>';
    this.contentReverse.innerHTML = '<div class="lb-loading">Error retrieving archives.</div>';
  }

  _render() {
    if (this.currentMode === 'speed') {
      this.contentSpeed.classList.remove('hidden');
      this.contentReverse.classList.add('hidden');
      this._renderTable(this.contentSpeed, this.data.speed, 'Score');
    } else {
      this.contentReverse.classList.remove('hidden');
      this.contentSpeed.classList.add('hidden');
      this._renderTable(this.contentReverse, this.data.reverse, 'Time');
    }
  }

  _renderTable(container, rows, primaryMetricName) {
    if (!rows || rows.length === 0) {
      container.innerHTML = '<div class="lb-empty">No expeditions recorded today.</div>';
      return;
    }

    let html = `
      <table class="lb-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Cartographer</th>
            <th class="lb-metric">${primaryMetricName}</th>
          </tr>
        </thead>
        <tbody>
    `;

    rows.forEach((row, index) => {
      let metricDisplay = '';
      if (this.currentMode === 'speed') {
        metricDisplay = `${row.final_score} / 196`;
      } else {
        const mins = Math.floor(row.elapsed_seconds / 60);
        const secs = Math.floor(row.elapsed_seconds % 60);
        metricDisplay = `${mins}:${secs.toString().padStart(2, '0')}`;
      }

      const isMe = this.app.authManager && this.app.authManager.user && this.app.authManager.user.id === row.user_id;
      const rowClass = isMe ? 'lb-row-me' : '';

      html += `
        <tr class="${rowClass}">
          <td class="lb-rank">#${index + 1}</td>
          <td class="lb-alias">${row.alias || 'Unknown'}</td>
          <td class="lb-score">${metricDisplay}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  }
}
