class Cache {
  constructor(timeout = 5 * 60 * 1000) {
    // 5 minutes default
    this.cache = new Map();
    this.timeout = timeout;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > this.timeout;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const productCache = new Cache();
export const categoryCache = new Cache();
export const brandCache = new Cache();
