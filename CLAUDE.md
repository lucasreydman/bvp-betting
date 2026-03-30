@AGENTS.md

# MLB BvP Total Bases Tool

Next.js 16 / React 19 app. No pages router — App Router only. Tailwind v4 (no config file, all via `@import "tailwindcss"` in CSS).

## Architecture

```
app/
  page.tsx               # Server component — passes today's date to ClientShell
  layout.tsx             # Root layout
  api/
    matchups/route.ts    # Main endpoint — fetches all BvP pairs for a date
    bvp/route.ts         # Debug endpoint — single batter vs pitcher lookup
    schedule/route.ts    # Schedule endpoint — lists games for a date
  components/
    ClientShell.tsx      # Root client component — owns all state
    DatePicker.tsx       # ±3 day nav, UTC-safe date arithmetic
    StatusBar.tsx        # Last updated, games scanned, refresh button
    Filters.tsx          # 4 filter inputs + Apply/Reset/Export CSV
    TopPlays.tsx         # Top 5 by OPS→AVG→SLG→AB from filtered set
    MatchupTable.tsx     # Sortable table — columns: OPS→AVG→SLG→AB
    MatchupRow.tsx       # Single row, confidence-color coded
    LoadingSkeleton.tsx  # Pulse skeleton during fetch
lib/
  types.ts    # MatchupResult, FilterState, DEFAULT_FILTERS, SortState
  stats.ts    # calcStats(), assignConfidence(), parseSplit()
  utils.ts    # applyFilters(), sortMatchups(), generateCSV(), formatET()
  mlb-api.ts  # All MLB Stats API fetch functions
  cache.ts    # createCache<T>(ttlMs) — simple in-memory TTL cache
```

## Data Flow

1. `ClientShell` fetches `/api/matchups?date=YYYY-MM-DD` on mount and date change
2. Route fetches schedule → lineups (confirmed boxscore or estimated top-9 by career PA) → BvP stats in batches of 20 with 200ms delays
3. Server filters out AB < 10; client applies 4 filters (minAB, minOPS, minSLG, minAVG)
4. `applyFilters` + `sortMatchups` run on every render (pure, fast — ~500 items max)
5. `TopPlays` receives the already-filtered array; sorts by OPS→AVG→SLG→AB

## Key Invariants

- **Filters are AND logic** — matchup must pass all 4 thresholds
- **Top 5 and table use the same filtered set** — TopPlays receives `filtered`, not `allMatchups`
- **Sort order matches filter order**: OPS → AVG → SLG → AB everywhere (Top 5, table default, tiebreakers)
- **Confidence** = AB-based: high ≥30, medium ≥15, low 10–14 — colors green/yellow/orange
- **Module-level caches only** — never instantiate caches inside a request handler (re-created per request in serverless)
- **`parseSplit(stat)`** is the single place that maps MLB API stat fields to internal raw+calculated shape — use it in both routes, never duplicate

## MLB Stats API

Base: `https://statsapi.mlb.com/api/v1`

Key endpoints used:
- `/schedule?sportId=1&date=DATE&hydrate=probablePitcher,lineups`
- `/game/{gamePk}/boxscore` — confirmed batting order
- `/teams/{teamId}/roster?rosterType=active`
- `/people/{playerId}/stats?stats=career&group=hitting`
- `/people/{batterId}/stats?stats=vsPlayer&opposingPlayerId={pitcherId}&group=hitting`
- `/people/{playerId}`

BvP fetch has **no Next.js revalidate** — handled by in-memory `bvpCache` (60 min TTL).

## Commands

```bash
npm run dev       # localhost:3000
npm run build     # production build
npm run lint      # ESLint
npm test          # Jest (unit tests for lib/)
npx vercel --prod # deploy
```

## Tests

Unit tests in `__tests__/` cover `lib/stats.ts`, `lib/utils.ts`, `lib/cache.ts`. Run with `npm test`. No component or API route tests.
