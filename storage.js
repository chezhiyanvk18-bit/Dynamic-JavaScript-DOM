// storage.js - safe localStorage helpers for cart items and user preferences
const CART_KEY = 'store.cart.v1';
const PREFS_KEY = 'store.prefs.v1';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback; // corrupted JSON or storage blocked
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable: app still works without persistence */
  }
}

export const loadCart = () => read(CART_KEY, []);
export const saveCart = (cart) => write(CART_KEY, cart);
export const loadPrefs = () => read(PREFS_KEY, { category: 'all', sort: 'default', query: '', theme: null });
export const savePrefs = (prefs) => write(PREFS_KEY, prefs);
