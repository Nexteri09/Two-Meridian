import { supabase } from '../lib/supabase.js';

export class AuthManager {
  constructor() {
    this.user = null;
    this.profile = null;
    this.loginBtn = document.getElementById('auth-login-btn');
    this.userMenu = document.getElementById('auth-user-menu');
    this.aliasSpan = document.getElementById('auth-user-alias');
    this.logoutBtn = document.getElementById('auth-logout-btn');

    this._bindEvents();
    this._initializeAuthListener();
  }

  _bindEvents() {
    if (this.loginBtn) {
      this.loginBtn.addEventListener('click', () => this.signIn());
    }
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => this.signOut());
    }
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

    const { data, error } = await supabase
      .from('profiles')
      .select('alias')
      .eq('id', this.user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, we need to create one
      await this._createProfile();
    } else if (data) {
      this.profile = data;
    }
  }

  async _createProfile() {
    let alias = prompt('Welcome to Two Meridian! Please enter a display name for the leaderboards:');
    if (!alias) {
      alias = `Cartographer-${Math.floor(Math.random() * 10000)}`;
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert([
        { id: this.user.id, alias: alias }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error.message);
      // Fallback
      this.profile = { alias: 'Unknown Cartographer' };
    } else {
      this.profile = data;
    }
  }

  _updateUI(isLoggedIn) {
    if (isLoggedIn) {
      this.loginBtn.classList.add('hidden');
      this.userMenu.classList.remove('hidden');
      if (this.profile) {
        this.aliasSpan.textContent = this.profile.alias;
      }
    } else {
      this.loginBtn.classList.remove('hidden');
      this.userMenu.classList.add('hidden');
      this.aliasSpan.textContent = '';
    }
  }
}
