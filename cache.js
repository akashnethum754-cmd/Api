const store = new Map();
const TTL = 1000 * 60 * 30; // 30 min

export function get(key) {
  const item = store.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    store.delete(key);
    return null;
  }
  return item.value;
}

export function set(key, value) {
  store.set(key, { value, expiry: Date.now() + TTL });
}
