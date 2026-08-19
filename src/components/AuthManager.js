import { supabase } from '../lib/supabase.js';

export class AuthManager {
  constructor() {
    this.user = null;
    this.profile = null;

    this._bindEvents();
    this._initializeAuthListener();
  }

  _bindEvents() {
    // Bind all login buttons across game and landing headers
    document.addEventListener('click', (e) => {
      const target = e.target.closest('#auth-login-btn, #landing-auth-btn');
      if (target) {
        e.preventDefault();
        this.signIn();
      }

      const logoutTarget = e.target.closest('#auth-logout-btn, #landing-auth-logout');
      if (logoutTarget) {
        e.preventDefault();
        this.signOut();
      }

      const aliasTarget = e.target.closest('#auth-user-alias, #landing-auth-alias, .auth-alias');
      if (aliasTarget && this.user) {
        e.preventDefault();
        this._promptEditAlias();
      }
    });
  }

  _initializeAuthListener() {
    // Listen for auth state changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        this.user = session.user;
        await this._fetchProfile();
        this._updateUI(true);
      } else {
        this.user = null;
        this.profile = null;
        this._updateUI(false);
      }
    });
  }

  async signIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      console.error('Error logging in:', error.message);
    }
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    }
  }

  async _fetchProfile() {
    if (!this.user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('alias')
        .eq('id', this.user.id)
        .maybeSingle();

      if (error) {
        console.warn('Could not fetch profile from Supabase:', error.message);
      }

      if (!data) {
        // Profile does not exist yet, create one
        await this._createProfile();
      } else {
        this.profile = data;
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  }

  _sanitizeAlias(raw) {
    if (!raw || typeof raw !== 'string') return 'Unknown Cartographer';
    const stripped = raw.replace(/<[^>]*>/g, '').trim();
    return stripped.slice(0, 30) || 'Unknown Cartographer';
  }

  async _createProfile() {
    // Use Google full name or fallback default
    const googleName = this.user.user_metadata?.full_name || this.user.user_metadata?.name || '';
    let initialAlias = googleName ? this._sanitizeAlias(googleName) : `Cartographer-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          { id: this.user.id, alias: initialAlias },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) {
        console.warn('Profile upsert warning:', error.message);
        this.profile = { alias: initialAlias };
      } else {
        this.profile = data;
      }
    } catch (err) {
      console.error('Profile creation error:', err);
      this.profile = { alias: initialAlias };
    }
  }

  async _promptEditAlias() {
    const current = this.profile?.alias || '';
    const newAlias = prompt('Change your leaderboard display alias (max 30 chars):', current);
    if (newAlias === null) return; // User cancelled

    const sanitized = this._sanitizeAlias(newAlias);
    if (!sanitized || sanitized === 'Unknown Cartographer') return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          { id: this.user.id, alias: sanitized },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) {
        console.error('Error updating alias:', error.message);
        alert('Could not update alias: ' + error.message);
      } else {
        this.profile = data;
        this._updateUI(true);
      }
    } catch (err) {
      console.error('Alias update error:', err);
    }
  }

  _updateUI(isLoggedIn) {
    const loginBtns = document.querySelectorAll('#auth-login-btn, #landing-auth-btn');
    const userMenus = document.querySelectorAll('#auth-user-menu, #landing-auth-user');
    const aliasSpans = document.querySelectorAll('#auth-user-alias, #landing-auth-alias, .auth-alias');

    if (isLoggedIn) {
      loginBtns.forEach(btn => btn.classList.add('hidden'));
      userMenus.forEach(menu => menu.classList.remove('hidden'));
      
      const displayAlias = this.profile?.alias ? this._sanitizeAlias(this.profile.alias) : 'Explorer';
      aliasSpans.forEach(span => {
        span.textContent = displayAlias;
        span.title = 'Click to edit alias';
        span.style.cursor = 'pointer';
      });
    } else {
      loginBtns.forEach(btn => btn.classList.remove('hidden'));
      userMenus.forEach(menu => menu.classList.add('hidden'));
      aliasSpans.forEach(span => {
        span.textContent = '';
      });
    }
  }
}
