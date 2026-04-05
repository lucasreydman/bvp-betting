describe('kv local fallback', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-04-05T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('expires entries after ttl in local memory fallback', async () => {
    const { kvGet, kvSet } = await import('@/lib/kv')

    await kvSet('ttl-key', { ok: true }, 5)
    await expect(kvGet<{ ok: boolean }>('ttl-key')).resolves.toEqual({ ok: true })

    jest.advanceTimersByTime(5001)

    await expect(kvGet<{ ok: boolean }>('ttl-key')).resolves.toBeNull()
  })

  it('keeps entries without ttl in local memory fallback', async () => {
    const { kvGet, kvSet } = await import('@/lib/kv')

    await kvSet('persistent-key', { ok: true })
    jest.advanceTimersByTime(60_000)

    await expect(kvGet<{ ok: boolean }>('persistent-key')).resolves.toEqual({ ok: true })
  })
})