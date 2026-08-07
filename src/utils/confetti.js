// ============================================
// Two Meridian — Confetti & Victory Particle Engine
// ============================================

export class ConfettiEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animId = null;
  }

  _ensureCanvas() {
    if (this.canvas) return;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'victory-particle-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // 🌟 Gold & Aurora Starburst Confetti (Casual Mode)
  burstCasual() {
    this._ensureCanvas();
    const colors = ['#ffd700', '#00b4d8', '#7b2cbf', '#ff4d6d', '#00f5d4', '#ffffff'];
    const count = 180;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 4;
      this.particles.push({
        x: this.canvas.width / 2,
        y: this.canvas.height * 0.45,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 3,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        opacity: 1,
        decay: Math.random() * 0.008 + 0.005,
        gravity: 0.2,
        shape: Math.random() > 0.5 ? 'star' : 'rect'
      });
    }

    this._startLoop();
  }

  // ⚡ Neon Hyperdrive Speed Streaks (Speed Mode)
  burstSpeed() {
    this._ensureCanvas();
    const colors = ['#00f5d4', '#00b4d8', '#7000ff', '#ffffff'];
    const count = 220;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (Math.random() * 0.1);
      const speed = Math.random() * 22 + 8;
      this.particles.push({
        x: this.canvas.width / 2,
        y: this.canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 14 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
        decay: Math.random() * 0.015 + 0.01,
        gravity: 0.02,
        shape: 'streak'
      });
    }

    this._startLoop();
  }

  // 🎯 Tactical Radar Scanning Reticle Burst (Reverse Mode)
  burstReverse() {
    this._ensureCanvas();
    const colors = ['#ff0055', '#ff5500', '#00f5d4', '#ffffff'];
    const count = 160;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 15 + 2;
      this.particles.push({
        x: this.canvas.width / 2,
        y: this.canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
        decay: Math.random() * 0.012 + 0.008,
        gravity: 0.08,
        shape: 'ring'
      });
    }

    this._startLoop();
  }

  _startLoop() {
    if (this.animId) return;
    const loop = () => {
      if (!this.ctx || !this.canvas) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.opacity -= p.decay;

        if (p.opacity <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, p.opacity);
        this.ctx.translate(p.x, p.y);

        if (p.shape === 'rect') {
          p.rotation += p.vRot;
          this.ctx.rotate(p.rotation);
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === 'star') {
          p.rotation += p.vRot;
          this.ctx.rotate(p.rotation);
          this.ctx.fillStyle = p.color;
          this.ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            this.ctx.lineTo(Math.cos((18 + j * 72) * Math.PI / 180) * p.size, -Math.sin((18 + j * 72) * Math.PI / 180) * p.size);
            this.ctx.lineTo(Math.cos((54 + j * 72) * Math.PI / 180) * (p.size / 2), -Math.sin((54 + j * 72) * Math.PI / 180) * (p.size / 2));
          }
          this.ctx.closePath();
          this.ctx.fill();
        } else if (p.shape === 'streak') {
          const angle = Math.atan2(p.vy, p.vx);
          this.ctx.rotate(angle);
          this.ctx.strokeStyle = p.color;
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.moveTo(0, 0);
          this.ctx.lineTo(-p.size * 2, 0);
          this.ctx.stroke();
        } else if (p.shape === 'ring') {
          this.ctx.strokeStyle = p.color;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          this.ctx.stroke();
        }

        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animId = requestAnimationFrame(loop);
      } else {
        this.animId = null;
        if (this.canvas) {
          this.canvas.remove();
          this.canvas = null;
        }
      }
    };

    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    this.particles = [];
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
  }
}
