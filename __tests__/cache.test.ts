import { createCache } from '@/lib/cache'

describe('createCache', () => {
  it('stores and retrieves a value', () => {
    const cache = createCache<string>(60_000)
    cache.set('key', 'value')
    expect(cache.get('key')).toBe('value')
  })

  it('returns undefined for missing key', () => {
    const cache = createCache<string>(60_000)
    expect(cache.get('missing')).toBeUndefined()
  })

  it('returns undefined for expired entry', () => {
    const cache = createCache<string>(0) // 0ms TTL = instantly expired
    cache.set('key', 'value')
    expect(cache.get('key')).toBeUndefined()
  })

  it('overwrites an existing key', () => {
    const cache = createCache<string>(60_000)
    cache.set('key', 'first')
    cache.set('key', 'second')
    expect(cache.get('key')).toBe('second')
  })
})
