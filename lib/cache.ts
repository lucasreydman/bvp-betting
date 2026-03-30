interface CacheEntry<T> {
  data: T
  fetchedAt: number
}

export interface Cache<T> {
  get(key: string): T | undefined
  set(key: string, value: T): void
}

export function createCache<T>(ttlMs: number): Cache<T> {
  const store = new Map<string, CacheEntry<T>>()
  return {
    get(key: string): T | undefined {
      const entry = store.get(key)
      if (!entry) return undefined
      if (Date.now() - entry.fetchedAt >= ttlMs) {
        store.delete(key)
        return undefined
      }
      return entry.data
    },
    set(key: string, value: T): void {
      store.set(key, { data: value, fetchedAt: Date.now() })
    },
  }
}
