// ============================================
// Two Meridian — Storage: localStorage wrapper
// ============================================

const STORAGE_KEY = 'twomeridian';

export class Storage {
  constructor() {
    this._cache = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._cache));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  get(key) {
    return this._cache[key];
  }

  set(key, value) {
    this._cache[key] = value;
    this._save();
  }

  remove(key) {
    delete this._cache[key];
    this._save();
  }

  clear() {
    this._cache = {};
    this._save();
  }

  // --- Weak Spots System ---
  getWeakSpots() {
    return this.get('weak_spots') || [];
  }

  addWeakSpot(id) {
    const set = new Set(this.getWeakSpots());
    set.add(id);
    this.set('weak_spots', Array.from(set));
  }

  removeWeakSpot(id) {
    const list = this.getWeakSpots().filter((item) => item !== id);
    this.set('weak_spots', list);
  }

  // --- Daily Streak System ---
  getDailyStreak() {
    const data = this.get('daily_streak_data') || { count: 0, lastPlayed: null, history: [] };
    return data;
  }

  recordDailyPlay() {
    const today = new Date().toISOString().split('T')[0];
    const data = this.getDailyStreak();

    if (data.lastPlayed === today) {
      return data; // Already played today
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (data.lastPlayed === yesterday) {
      data.count += 1;
    } else {
      data.count = 1; // Streak broken or new start
    }

    data.lastPlayed = today;
    if (!data.history.includes(today)) {
      data.history.push(today);
    }

    this.set('daily_streak_data', data);
    return data;
  }
}
