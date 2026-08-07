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
}
