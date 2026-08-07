export class StatsPage {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('page-stats');
  }

  init() {
    this.render();
  }

  formatTime(timeVal) {
    if (timeVal === undefined || timeVal === null || isNaN(timeVal)) return '--:--.--';
    const isMs = timeVal > 600 || timeVal.toString().length >= 4;
    const ms = isMs ? timeVal : timeVal * 1000;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  }

  formatDate(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  render() {
    const history = this.app.storage.get('history') || [];
    
    // Sort descending by timestamp
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

    let html = `
      <div class="stats-container">
        <header class="stats-header">
          <span class="brand-icon large">◆</span>
          <h1 class="stats-title">Your Progress</h1>
          <p class="stats-subtitle">Track your geolearning journey and personal bests.</p>
        </header>

        <div class="stats-content">
    `;

    if (sortedHistory.length === 0) {
      html += `
          <div class="stats-empty">
            <p>No games played yet. Complete a game in Casual, Speed, or Reverse mode to see your stats here!</p>
          </div>
      `;
    } else {
      // Calculate metrics
      const bestTimes = {
        speed: Infinity,
        reverse: Infinity
      };
      let totalLifetimeScore = 0;
      let totalElapsedMs = 0;

      sortedHistory.forEach(run => {
        const timeVal = run.elapsedMs !== undefined ? run.elapsedMs : (run.elapsedSeconds ? run.elapsedSeconds * 1000 : 0);
        totalLifetimeScore += (run.score || 0);
        totalElapsedMs += timeVal;
        if (run.score === run.total && run.mode in bestTimes) {
          if (timeVal < bestTimes[run.mode]) {
            bestTimes[run.mode] = timeVal;
          }
        }
      });

      html += `
          <div class="stats-summary">
            <div class="stat-card">
              <h3>Expeditions Logged</h3>
              <div class="stat-value">${sortedHistory.length}</div>
            </div>
            <div class="stat-card">
              <h3>Total Discoveries</h3>
              <div class="stat-value">${totalLifetimeScore}</div>
            </div>
            <div class="stat-card">
              <h3>Best Speed Clear</h3>
              <div class="stat-value speed-color">${bestTimes.speed === Infinity ? '--:--.--' : this.formatTime(bestTimes.speed)}</div>
            </div>
            <div class="stat-card">
              <h3>Best Reverse Clear</h3>
              <div class="stat-value reverse-color">${bestTimes.reverse === Infinity ? '--:--.--' : this.formatTime(bestTimes.reverse)}</div>
            </div>
          </div>

          <h2 class="stats-table-title">Expedition History</h2>
          <div class="stats-table-container">
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Coverage</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
      `;

      sortedHistory.forEach(run => {
        const modeColorClass = `${run.mode}-color`;
        const timeVal = run.elapsedMs !== undefined ? run.elapsedMs : (run.elapsedSeconds ? run.elapsedSeconds * 1000 : 0);
        const pct = run.total > 0 ? ((run.score / run.total) * 100).toFixed(0) : 0;
        const isComplete = run.score === run.total;
        html += `
                <tr>
                  <td>${this.formatDate(run.timestamp)}</td>
                  <td class="mode-cell"><span class="mode-badge ${modeColorClass}">${run.mode}</span></td>
                  <td>${run.score} / ${run.total} <span style="opacity:0.6;font-size:0.8em">(${pct}%${isComplete ? ' 👑' : ''})</span></td>
                  <td>${this.formatTime(timeVal)}</td>
                </tr>
        `;
      });

      html += `
              </tbody>
            </table>
          </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }
}
