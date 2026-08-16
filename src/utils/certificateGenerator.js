// ==========================================================================
// Two Meridian — Certificate Generator: Text & Canvas Expedition Share Cards
// ==========================================================================

export class CertificateGenerator {
  /**
   * Format text results grid for instant copy (Wordle style)
   */
  static generateTextShare({ mode, score, total, elapsedMs, streakCount, continentStats, dailyNumber }) {
    const formatTime = (ms) => {
      const totalSec = Math.floor(ms / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return `${min}m ${sec}s`;
    };

    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const modeName = mode.charAt(0).toUpperCase() + mode.slice(1);
    const dailyHeader = dailyNumber ? ` 🗓️ Daily #${dailyNumber}` : '';

    let text = `Two Meridian — Certificate of Expedition 🗺️\n`;
    text += `Mode: ${modeName} | Score: ${score}/${total} (${pct}%)${dailyHeader}\n`;
    text += `⏱️ Time: ${formatTime(elapsedMs)} | 🔥 Streak: ${streakCount || 0}\n\n`;

    if (continentStats && Object.keys(continentStats).length > 0) {
      text += `🌍 Continent Breakdown:\n`;
      for (const [cont, stat] of Object.entries(continentStats)) {
        const cPct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
        const blocks = Math.round(cPct / 20); // 5 block grid
        const green = '🟩'.repeat(blocks);
        const white = '⬜'.repeat(5 - blocks);
        const paddedCont = (cont + ':').padEnd(10, ' ');
        text += `${paddedCont} ${green}${white} ${cPct}%\n`;
      }
      text += `\n`;
    }

    text += `Chart your journey at https://twomeridian.in`;
    return text;
  }

  /**
   * Draw canvas certificate and export data URL / blob for download
   */
  static generateCanvasImage({ mode, score, total, elapsedMs, streakCount, continentStats, dailyNumber }) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');

      // Background - Dark Parchment Gradient
      const grad = ctx.createRadialGradient(600, 600, 100, 600, 600, 700);
      grad.addColorStop(0, '#151928');
      grad.addColorStop(1, '#0b0d14');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 1200);

      // Outer Vintage Border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 6;
      ctx.strokeRect(40, 40, 1120, 1120);

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(55, 55, 1090, 1090);

      // Header Brand
      ctx.fillStyle = '#d4af37';
      ctx.font = '600 32px "Fraunces", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('TWO MERIDIAN', 600, 120);

      ctx.fillStyle = 'rgba(232, 232, 240, 0.6)';
      ctx.font = '400 20px "IBM Plex Sans", sans-serif';
      ctx.fillText('OFFICIAL CERTIFICATE OF EXPEDITION', 600, 160);

      // Decorative Line
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.beginPath();
      ctx.moveTo(350, 190);
      ctx.lineTo(850, 190);
      ctx.stroke();

      // Main Score Badge
      const pct = total > 0 ? Math.round((score / total) * 100) : 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 110px "Fraunces", serif';
      ctx.fillText(`${score} / ${total}`, 600, 320);

      ctx.fillStyle = '#d4af37';
      ctx.font = '500 28px "IBM Plex Sans", sans-serif';
      ctx.fillText(`${pct}% Territory Charted`, 600, 370);

      // Stats Pill Container
      const totalSec = Math.floor(elapsedMs / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      const timeStr = `${min}m ${sec}s`;
      const modeStr = mode.toUpperCase();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.roundRect(160, 420, 880, 100, 20);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '400 18px "IBM Plex Sans", sans-serif';
      ctx.fillText('MODE', 200, 458);
      ctx.fillText('EXPEDITION TIME', 470, 458);
      ctx.fillText('MAX STREAK', 770, 458);

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 26px "IBM Plex Sans", sans-serif';
      ctx.fillText(modeStr, 200, 494);
      ctx.fillText(timeStr, 470, 494);
      ctx.fillText(`🔥 ${streakCount || 0}`, 770, 494);

      // Continent Breakdown Bars
      if (continentStats && Object.keys(continentStats).length > 0) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#d4af37';
        ctx.font = '600 22px "Fraunces", serif';
        ctx.fillText('CONTINENT MASTERY BREAKDOWN', 160, 580);

        let y = 630;
        for (const [cont, stat] of Object.entries(continentStats)) {
          const cPct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = '400 20px "IBM Plex Sans", sans-serif';
          ctx.fillText(cont, 160, y + 20);

          // Bar BG
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.beginPath();
          ctx.roundRect(360, y, 560, 24, 12);
          ctx.fill();

          // Bar Fill
          if (cPct > 0) {
            ctx.fillStyle = '#d4af37';
            ctx.beginPath();
            ctx.roundRect(360, y, Math.max(24, (560 * cPct) / 100), 24, 12);
            ctx.fill();
          }

          // Pct text
          ctx.fillStyle = '#ffffff';
          ctx.font = '600 18px "IBM Plex Sans", sans-serif';
          ctx.fillText(`${cPct}%`, 940, y + 19);

          y += 55;
        }
      }

      // Vintage Expedition Stamp Seal (Bottom Right)
      ctx.save();
      ctx.translate(960, 960);
      ctx.rotate(-0.18);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 90, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 82, 0, Math.PI * 2);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#d4af37';
      ctx.font = '700 14px "IBM Plex Sans", sans-serif';
      ctx.fillText('OFFICIALLY ARCHIVED', 0, -30);
      ctx.font = '800 22px "Fraunces", serif';
      ctx.fillText('PASSED', 0, 5);
      ctx.font = '600 13px "IBM Plex Sans", sans-serif';
      ctx.fillText('TWO MERIDIAN', 0, 35);
      ctx.restore();

      // Footer Url
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '400 18px "IBM Plex Sans", sans-serif';
      ctx.fillText('twomeridian.in — Test your geographical mastery', 600, 1130);

      resolve(canvas.toDataURL('image/png'));
    });
  }
}
