// api.js - REST client for FakeStoreAPI (https://fakestoreapi.com)
const BASE_URL = 'https://fakestoreapi.com';
const TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Small in-memory cache so switching tabs never re-fetches the same endpoint.
const cache = new Map();

async function request(path) {
  if (cache.has(path)) return cache.get(path);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, { signal: controller.signal });
    if (!res.ok) throw new ApiError(`The server responded with an error (${res.status}).`, res.status);
    const data = await res.json();
    cache.set(path, data);
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') throw new ApiError('The request timed out. Check your connection and try again.');
    throw new ApiError('Could not reach the store. Check your internet connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}

export const getProducts = () => request('/products');
export const getCategories = () => request('/products/categories');
