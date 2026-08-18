// ==========================================================================
// Two Meridian — FeedbackModal: In-App Feedback Dispatch to Supabase
// Includes Anti-Abuse Protections: Word/Char Limits, Rate-Limiting & Honeypots
// ==========================================================================

import { supabase } from '../lib/supabase.js';

export class FeedbackModal {
  constructor(app) {
    this.app = app;
    this.isOpen = false;
    this.selectedCategory = 'General';
    this.maxChars = 800;
    this.minChars = 10;
    this.cooldownMs = 60 * 1000; // 60-second anti-spam cooldown

    this.categories = [
      { id: 'General', label: 'General' },
      { id: 'Feature Idea', label: 'Feature Idea' },
      { id: 'Map Correction', label: 'Map / Borders' },
      { id: 'Bug Report', label: 'Bug Report' },
      { id: 'Aesthetics', label: 'Aesthetics & UI' }
    ];

    this._onKeyDown = this._onKeyDown.bind(this);
  }

  open(defaultCategory = 'General') {
    if (this.isOpen) return;
    this.isOpen = true;
    this.selectedCategory = defaultCategory;
    this._render();
    window.addEventListener('keydown', this._onKeyDown);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    window.removeEventListener('keydown', this._onKeyDown);

    const overlay = document.getElementById('feedback-modal-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 250);
    }
  }

  _onKeyDown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  _render() {
    let overlay = document.getElementById('feedback-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'feedback-modal-overlay';
      overlay.className = 'feedback-modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="feedback-modal-card" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        <div class="feedback-modal-header">
          <div class="feedback-badge">
            <span class="feedback-glyph">◈</span>
            <span>DIRECT DISPATCH // TO NEO</span>
          </div>
          <button class="feedback-close-btn" id="feedback-close-btn" aria-label="Close modal">✕</button>
        </div>

        <div class="feedback-modal-body" id="feedback-modal-body">
          <h3 id="feedback-title" class="feedback-title">Share Your Thoughts</h3>
          
          <div class="feedback-creator-note">
            <p class="feedback-note-p">
              Thank you for choosing to help me improve. I am looking for irregularities, corrections on the site, as well as genuine suggestions about improving features and the overall aesthetic.
            </p>
          </div>

          <form id="feedback-form" class="feedback-form">
            <!-- Hidden Honeypot to trap automated spam bots -->
            <div class="feedback-hp" aria-hidden="true" style="position: absolute; left: -9999px; top: -9999px; opacity: 0; pointer-events: none;">
              <label for="feedback-hp-field">Leave blank</label>
              <input type="text" id="feedback-hp-field" name="website_hp" tabindex="-1" autocomplete="off" />
            </div>

            <!-- Category Chips -->
            <div class="feedback-field-group">
              <label class="feedback-label">SELECT CATEGORY</label>
              <div class="feedback-category-pills" id="feedback-categories">
                ${this.categories.map(cat => `
                  <button type="button" class="category-pill ${cat.id === this.selectedCategory ? 'active' : ''}" data-category="${cat.id}">
                    ${cat.label}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Feedback Message Area with Live Counter -->
            <div class="feedback-field-group">
              <div class="feedback-label-row">
                <label for="feedback-message" class="feedback-label">YOUR MESSAGE <span class="required">*</span></label>
                <span class="feedback-char-count" id="feedback-char-count">0 / ${this.maxChars}</span>
              </div>
              <textarea 
                id="feedback-message" 
                class="feedback-textarea" 
                rows="4" 
                maxlength="${this.maxChars}"
                placeholder="Describe any map errors, feature ideas, bugs, or aesthetic tweaks..."
                required
              ></textarea>
            </div>

            <!-- Optional User Email -->
            <div class="feedback-field-group">
              <label for="feedback-email" class="feedback-label">YOUR EMAIL <span class="optional">(OPTIONAL)</span></label>
              <input 
                type="email" 
                id="feedback-email" 
                class="feedback-input" 
                maxlength="120"
                placeholder="name@example.com (only if you would like a reply)"
              />
            </div>

            <!-- Error / Warning Banner -->
            <div class="feedback-error-msg" id="feedback-error-msg" style="display: none;"></div>

            <!-- Modal Footer -->
            <div class="feedback-modal-footer">
              <button type="button" class="feedback-cancel-btn" id="feedback-cancel-btn">Cancel</button>
              <button type="submit" class="feedback-submit-btn" id="feedback-submit-btn">
                <span>Dispatch Feedback</span>
                <span class="btn-arrow">→</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Force reflow and add visible class
    overlay.offsetHeight;
    overlay.classList.add('visible');

    // Focus textarea
    setTimeout(() => {
      document.getElementById('feedback-message')?.focus();
    }, 100);

    this._bindEvents(overlay);
  }

  _bindEvents(overlay) {
    // Close on overlay backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    // Close buttons
    document.getElementById('feedback-close-btn')?.addEventListener('click', () => this.close());
    document.getElementById('feedback-cancel-btn')?.addEventListener('click', () => this.close());

    // Category pill selection
    const categoryContainer = document.getElementById('feedback-categories');
    if (categoryContainer) {
      categoryContainer.querySelectorAll('.category-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          categoryContainer.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedCategory = btn.dataset.category;
        });
      });
    }

    // Live character counter
    const messageEl = document.getElementById('feedback-message');
    const charCountEl = document.getElementById('feedback-char-count');
    if (messageEl && charCountEl) {
      messageEl.addEventListener('input', () => {
        const len = messageEl.value.length;
        charCountEl.textContent = `${len} / ${this.maxChars}`;
        if (len > this.maxChars - 60) {
          charCountEl.classList.add('near-limit');
        } else {
          charCountEl.classList.remove('near-limit');
        }
      });
    }

    // Form submission
    const form = document.getElementById('feedback-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this._handleSubmit();
      });
    }
  }

  async _handleSubmit() {
    const messageEl = document.getElementById('feedback-message');
    const emailEl = document.getElementById('feedback-email');
    const submitBtn = document.getElementById('feedback-submit-btn');
    const errorEl = document.getElementById('feedback-error-msg');
    const hpField = document.getElementById('feedback-hp-field');

    // 1. Anti-Bot Honeypot Protection
    if (hpField && hpField.value.trim() !== '') {
      // Spam bot detected: simulate success and silently drop
      this._renderSuccess();
      return;
    }

    // 2. Cooldown Rate-Limiting Protection (60s)
    const lastSent = Number(localStorage.getItem('tm_feedback_last_sent') || 0);
    const now = Date.now();
    if (now - lastSent < this.cooldownMs) {
      const remainingSecs = Math.ceil((this.cooldownMs - (now - lastSent)) / 1000);
      if (errorEl) {
        errorEl.textContent = `Please wait ${remainingSecs}s before sending another dispatch.`;
        errorEl.style.display = 'block';
      }
      return;
    }

    // 3. Validation & Sanitization
    let message = messageEl?.value.trim() || '';
    const email = emailEl?.value.trim() || null;

    if (message.length < this.minChars) {
      if (errorEl) {
        errorEl.textContent = `Please write at least ${this.minChars} characters.`;
        errorEl.style.display = 'block';
      }
      return;
    }

    // Trim excessive consecutive newlines (max 2)
    message = message.replace(/\n{3,}/g, '\n\n').slice(0, this.maxChars);

    // Set loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Dispatching...</span>';
    }
    if (errorEl) errorEl.style.display = 'none';

    try {
      // Send directly to Supabase table 'feedback'
      const { data, error } = await supabase.from('feedback').insert([
        {
          category: this.selectedCategory,
          message: message,
          email: email,
          user_agent: navigator.userAgent
        }
      ]);

      if (error) {
        throw error;
      }

      // Record successful dispatch timestamp for rate limiting
      localStorage.setItem('tm_feedback_last_sent', Date.now().toString());

      // Show success screen
      this._renderSuccess();
    } catch (err) {
      console.error('Failed to submit feedback to Supabase:', err);
      if (errorEl) {
        const errorMsg = err?.message || 'Could not dispatch feedback right now.';
        errorEl.textContent = errorMsg.includes('relation') 
          ? 'Table "feedback" not found. Please create the feedback table in Supabase SQL Editor.'
          : errorMsg;
        errorEl.style.display = 'block';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Dispatch Feedback</span><span class="btn-arrow">→</span>';
      }
    }
  }

  _renderSuccess() {
    const body = document.getElementById('feedback-modal-body');
    if (!body) return;

    body.innerHTML = `
      <div class="feedback-success-state">
        <div class="success-glyph">◈</div>
        <h3 class="feedback-title">Dispatch Received</h3>
        <p class="feedback-success-p">
          Thank you for taking the time to share your feedback. Your note has been delivered directly to NEO and will be reviewed to help shape upcoming features and refinements.
        </p>
        <div class="feedback-modal-footer success-footer">
          <button type="button" class="feedback-submit-btn" id="feedback-success-close-btn">
            Done
          </button>
        </div>
      </div>
    `;

    document.getElementById('feedback-success-close-btn')?.addEventListener('click', () => this.close());

    // Auto close after 3.5 seconds
    setTimeout(() => {
      if (this.isOpen) this.close();
    }, 3500);
  }
}
