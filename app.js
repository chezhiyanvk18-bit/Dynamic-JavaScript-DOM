// app.js - state, filtering/sorting logic and DOM rendering
import { getProducts, getCategories } from './api.js';
import { loadCart, saveCart, loadPrefs, savePrefs } from './storage.js';

const state = {
  products: [],
  categories: [],
  cart: loadCart(),      // [{ id, title, price, image, qty }]
  prefs: loadPrefs(),    // { category, sort, query, theme }
};

const $ = (sel) => document.querySelector(sel);
const els = {
  grid: $('#product-grid'),
  tabs: $('#tabs'),
  search: $('#search'),
  sort: $('#sort'),
  status: $('#status'),
  banner: $('#banner'),
  cart: $('#cart'),
  cartItems: $('#cart-items'),
  cartTotal: $('#cart-total'),
  cartCount: $('#cart-count'),
  theme: $('#theme-toggle'),
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/* ---------- helpers ---------- */
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('data-') || k === 'aria-label' || k === 'role' || k === 'aria-selected' || k === 'type') el.setAttribute(k, v);
    else el[k] = v;
  }
  el.append(...children);
  return el;
}

const debounce = (fn, ms = 250) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

/* ---------- filtering + sorting ---------- */
function visibleProducts() {
  const { category, sort, query } = state.prefs;
  const q = query.trim().toLowerCase();

  const list = state.products.filter((p) =>
    (category === 'all' || p.category === category) &&
    (!q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  );

  const sorters = {
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    'rating': (a, b) => b.rating.rate - a.rating.rate,
    'name': (a, b) => a.title.localeCompare(b.title),
  };
  if (sorters[sort]) list.sort(sorters[sort]);
  return list;
}

/* ---------- rendering ---------- */
function renderSkeletons(n = 8) {
  els.grid.replaceChildren(...Array.from({ length: n }, () => h('div', { class: 'skeleton', 'aria-hidden': 'true' })));
  els.status.textContent = 'Loading products...';
}

function renderTabs() {
  const names = ['all', ...state.categories];
  els.tabs.replaceChildren(...names.map((name) =>
    h('button', {
      class: 'tab', type: 'button', role: 'tab', text: name,
      'data-category': name,
      'aria-selected': String(state.prefs.category === name),
    })
  ));
}

function renderProducts() {
  const list = visibleProducts();
  els.status.textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;

  if (!list.length) {
    els.grid.replaceChildren(h('p', { class: 'status', text: 'No products match your search. Try a different word or category.' }));
    return;
  }

  els.grid.replaceChildren(...list.map((p) =>
    h('article', { class: 'card product' },
      h('img', { class: 'product__img', src: p.image, alt: p.title, loading: 'lazy' }),
      h('h3', { class: 'product__title', text: p.title, title: p.title }),
      h('div', { class: 'product__meta' },
        h('span', { class: 'product__price', text: money.format(p.price) }),
        h('span', { text: `★ ${p.rating.rate} (${p.rating.count})` })
      ),
      h('button', { class: 'btn btn--primary', type: 'button', text: 'Add to cart', 'data-add': p.id })
    )
  ));
}

function renderCart() {
  const count = state.cart.reduce((s, i) => s + i.qty, 0);
  const total = state.cart.reduce((s, i) => s + i.qty * i.price, 0);
  els.cartCount.textContent = count;
  els.cartTotal.textContent = money.format(total);

  if (!state.cart.length) {
    els.cartItems.replaceChildren(h('p', { class: 'status', text: 'Your cart is empty. Add a product to get started.' }));
    return;
  }

  els.cartItems.replaceChildren(...state.cart.map((i) =>
    h('div', { class: 'cart__item' },
      h('img', { src: i.image, alt: '' }),
      h('div', {},
        h('p', { text: i.title }),
        h('div', { class: 'cart__row' },
          h('button', { class: 'qty', type: 'button', text: '−', 'aria-label': `Decrease ${i.title}`, 'data-dec': i.id }),
          h('span', { text: i.qty }),
          h('button', { class: 'qty', type: 'button', text: '+', 'aria-label': `Increase ${i.title}`, 'data-inc': i.id }),
          h('span', { text: money.format(i.price * i.qty) }),
          h('button', { class: 'qty', type: 'button', text: '✕', 'aria-label': `Remove ${i.title}`, 'data-remove': i.id })
        )
      )
    )
  ));
}

function showError(message) {
  els.banner.replaceChildren(
    h('p', { text: message }),
    h('button', { class: 'btn', type: 'button', text: 'Try again', id: 'retry' })
  );
  els.banner.hidden = false;
  els.grid.replaceChildren();
  els.status.textContent = '';
}

/* ---------- cart state ---------- */
function updateCart(mutator) {
  mutator(state.cart);
  state.cart = state.cart.filter((i) => i.qty > 0);
  saveCart(state.cart);
  renderCart();
}

function addToCart(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  updateCart((cart) => {
    const found = cart.find((i) => i.id === id);
    if (found) found.qty += 1;
    else cart.push({ id: p.id, title: p.title, price: p.price, image: p.image, qty: 1 });
  });
}

const changeQty = (id, delta) => updateCart((cart) => { const i = cart.find((x) => x.id === id); if (i) i.qty += delta; });
const removeItem = (id) => updateCart((cart) => { const i = cart.find((x) => x.id === id); if (i) i.qty = 0; });

/* ---------- preferences + theme ---------- */
function setPref(key, value) {
  state.prefs[key] = value;
  savePrefs(state.prefs);
}

function applyTheme() {
  if (state.prefs.theme) document.documentElement.dataset.theme = state.prefs.theme;
}

/* ---------- events ---------- */
function bindEvents() {
  els.search.addEventListener('input', debounce((e) => { setPref('query', e.target.value); renderProducts(); }));
  els.sort.addEventListener('change', (e) => { setPref('sort', e.target.value); renderProducts(); });

  els.tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-category]');
    if (!btn) return;
    setPref('category', btn.dataset.category);
    renderTabs();
    renderProducts();
  });

  els.grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (btn) addToCart(Number(btn.dataset.add));
  });

  els.cart.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.inc) changeQty(Number(t.dataset.inc), 1);
    if (t.dataset.dec) changeQty(Number(t.dataset.dec), -1);
    if (t.dataset.remove) removeItem(Number(t.dataset.remove));
  });

  $('#cart-open').addEventListener('click', () => { els.cart.hidden = false; });
  $('#cart-close').addEventListener('click', () => { els.cart.hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') els.cart.hidden = true; });

  els.banner.addEventListener('click', (e) => { if (e.target.id === 'retry') loadData(); });

  els.theme.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setPref('theme', next);
  });
}

/* ---------- data loading ---------- */
async function loadData() {
  els.banner.hidden = true;
  renderSkeletons();
  try {
    const [products, categories] = await Promise.all([getProducts(), getCategories()]);
    state.products = products;
    state.categories = categories;
    // Restore saved category only if it still exists
    if (state.prefs.category !== 'all' && !categories.includes(state.prefs.category)) setPref('category', 'all');
    renderTabs();
    renderProducts();
  } catch (err) {
    showError(err.message);
  }
}

/* ---------- init ---------- */
function init() {
  applyTheme();
  els.search.value = state.prefs.query;
  els.sort.value = state.prefs.sort;
  bindEvents();
  renderCart();
  loadData();
}

init();
