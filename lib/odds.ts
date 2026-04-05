import { kvGet, kvSet } from '@/lib/kv'

const BOOKS = ['draftkings', 'fanduel', 'betmgm', 'williamhill_us', 'bet365', 'espnbet']
const ODDS_CACHE_TTL = 900 // 15 minutes

export interface OddsRow {
  batterNameNormalized: string
  consensusHitOddsAmerican: number
  bookCount: number
}

// ── Pure helpers (exported for tests and UI) ─────────────────────────────────

export function americanToImplied(american: number): number {
  if (american > 0) return 100 / (american + 100)
  return Math.abs(american) / (Math.abs(american) + 100)
}

export function impliedToAmerican(prob: number): number {
  if (prob <= 0.5) return ((1 - prob) / prob) * 100   // positive odds (including even money)
  return -(prob / (1 - prob)) * 100                   // negative odds
}

/**
 * Consensus American odds by averaging implied probabilities then converting back.
 * NOTE: This averages the raw (vigged) implied probabilities from each book.
 * The result is a vigged consensus — not a fair-odds price. The systematic
 * bias is ~3-6% depending on book margins, which is expected for a display
 * odds column showing market consensus.
 */
export function consensusFromLines(lines: number[]): number | null {
  if (lines.length === 0) return null
  const avgImplied = lines.reduce((sum, l) => sum + americanToImplied(l), 0) / lines.length
  return impliedToAmerican(avgImplied)
}

/** Normalize a player name for matching: lowercase, strip accents + punctuation. */
export function normalizePlayerName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip combining diacritics (ñ → n, é → e, etc.)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')        // strip punctuation (Jr. → Jr, etc.)
    .replace(/\s+/g, ' ')
    .trim()
}

/** Format American odds for display: +150, -110, +100. */
export function fmtOdds(american: number): string {
  return american >= 0 ? `+${american}` : String(american)
}

// ── API types ────────────────────────────────────────────────────────────────

interface OddsApiOutcome {
  name: string     // player name from odds provider
  price: number    // American odds
}

interface OddsApiBookmaker {
  key: string
  markets: Array<{
    key: string
    outcomes: OddsApiOutcome[]
  }>
}

interface OddsApiEvent {
  id: string
  bookmakers: OddsApiBookmaker[]
}

// ── Main fetch ───────────────────────────────────────────────────────────────

/**
 * Fetch consensus batter_hits odds for all MLB games on `date` (YYYY-MM-DD).
 * Uses a single batch request to /sports/baseball_mlb/odds covering all games.
 * Results cached in KV for 15 min under `odds-hit-consensus:{date}`.
 * Returns [] if ODDS_API_KEY is not set or any error occurs.
 *
 * KNOWN LIMITATION: In doubleheaders, playerLines accumulates odds from both
 * games, so bookCount may show up to 12 (6 books × 2 games) for such batters.
 */
export async function fetchDayOdds(date: string): Promise<OddsRow[]> {
  const apiKey = process.env.ODDS_API_KEY
  if (!apiKey) return []

  const cacheKey = `odds-hit-consensus:${date}`
  const cached = await kvGet<OddsRow[]>(cacheKey)
  if (cached) return cached

  try {
    // Single batch call returns all events + bookmaker odds for the day.
    const from = `${date}T00:00:00Z`
    const to = `${date}T23:59:59Z`
    const bookmakerParam = BOOKS.join(',')
    const url =
      `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds` +
      `?apiKey=${apiKey}` +
      `&regions=us` +
      `&markets=batter_hits` +
      `&oddsFormat=american` +
      `&bookmakers=${bookmakerParam}` +
      `&commenceTimeFrom=${from}` +
      `&commenceTimeTo=${to}` +
      `&dateFormat=iso`

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.error('Odds API fetch failed:', res.status, await res.text())
      return []
    }

    const events: OddsApiEvent[] = await res.json()

    // Collect lines per player across all books and all events.
    const playerLines = new Map<string, number[]>()

    for (const event of events) {
      for (const bookmaker of event.bookmakers) {
        for (const market of bookmaker.markets) {
          if (market.key !== 'batter_hits') continue
          for (const outcome of market.outcomes) {
            const normalized = normalizePlayerName(outcome.name)
            const bucket = playerLines.get(normalized) ?? []
            playerLines.set(normalized, bucket)
            bucket.push(outcome.price)
          }
        }
      }
    }

    const allRows: OddsRow[] = []
    for (const [batterNameNormalized, lines] of playerLines) {
      const consensus = consensusFromLines(lines)
      if (consensus === null) continue
      allRows.push({
        batterNameNormalized,
        consensusHitOddsAmerican: Math.round(consensus),
        bookCount: lines.length,
      })
    }

    kvSet(cacheKey, allRows, ODDS_CACHE_TTL).catch(err =>
      console.error('Failed to cache odds:', err)
    )

    return allRows
  } catch (err) {
    console.error('Odds fetch error:', err)
    return []
  }
}

/**
 * Build a lookup map: normalized batter name → OddsRow.
 * First-entry-wins on name collision (doubleheader edge case).
 */
export function buildOddsMap(rows: OddsRow[]): Map<string, OddsRow> {
  const map = new Map<string, OddsRow>()
  for (const row of rows) {
    if (!map.has(row.batterNameNormalized)) map.set(row.batterNameNormalized, row)
  }
  return map
}
