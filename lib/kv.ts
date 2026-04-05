// lib/kv.ts
// Thin wrapper around @vercel/kv with an in-memory fallback for local dev.
// When KV_REST_API_URL / KV_REST_API_TOKEN are not set, all reads/writes go to
// a module-level Map that lasts for the lifetime of the serverless instance.
import { kv } from '@vercel/kv'

const hasKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
type MemoryEntry = {
  value: string
  expiresAt?: number
}

const memStore = new Map<string, MemoryEntry>()

function getMemoryEntry(key: string): string | null {
  const entry = memStore.get(key)
  if (!entry) return null

  if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
    memStore.delete(key)
    return null
  }

  return entry.value
}

export async function kvGet<T>(key: string): Promise<T | null> {
  if (hasKv) return kv.get<T>(key)
  const raw = getMemoryEntry(key)
  return raw ? (JSON.parse(raw) as T) : null
}

// ttlSeconds: optional time-to-live. Passed as { ex: ttlSeconds } to Vercel KV.
export async function kvSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  if (hasKv) {
    await (ttlSeconds ? kv.set(key, value, { ex: ttlSeconds }) : kv.set(key, value))
  } else {
    memStore.set(key, {
      value: JSON.stringify(value),
      expiresAt: ttlSeconds !== undefined ? Date.now() + ttlSeconds * 1000 : undefined,
    })
  }
}

export async function kvDel(key: string): Promise<void> {
  if (hasKv) {
    await kv.del(key)
  } else {
    memStore.delete(key)
  }
}
