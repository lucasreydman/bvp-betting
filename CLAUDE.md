@AGENTS.md

# MLB BvP

Next.js 16 / React 19 app. App Router only (no pages router). Tailwind v4 (no config file; `@import "tailwindcss"` in CSS).

Public-facing copy: **1+ total bases** prop betting; career BvP for today’s slate, ranked by OPS (then AVG, SLG, AB). Walks typically do not count toward TB at books; stats are hit-based.

## Architecture

```
app/
  page.tsx               # Server component; passes today's date to ClientShell
  layout.tsx             # Root layout, metadata
  api/
    matchups/route.ts    # Main endpoint: all BvP pairs for a date
    bvp/route.ts         # Debug: single batter vs pitcher lookup
    schedule/route.ts    # Schedule for a date
  components/
    ClientShell.tsx      # Root client component; owns state
    DatePicker.tsx       # ±3 day nav, UTC-safe date arithmetic
    StatusBar.tsx        # Last updated, games scanned, refresh
    Filters.tsx          # Four minimums + Apply / Reset / Export CSV
    TopPlays.tsx         # Top 5 by OPS (tiebreak AVG, SLG, AB); upcoming only
    MatchupTable.tsx     # Sortable table: Upcoming and In progress sections
    MatchupRow.tsx       # Single row, confidence colors
    LoadingSkeleton.tsx  # Loading state
lib/
  types.ts    # MatchupResult, FilterState, DEFAULT_FILTERS, SortState
  stats.ts    # calcStats(), assignConfidence(), parseSplit()
  utils.ts    # applyFilters(), sortMatchups(), generateCSV(), formatTime()
  mlb-api.ts  # MLB Stats API fetch helpers
  cache.ts    # createCache<T>(ttlMs), in-memory TTL cache
```

## Data Flow

1. `ClientShell` fetches `/api/matchups?date=YYYY-MM-DD` on mount and date change.
2. Route loads schedule, then lineups (boxscore or estimated top 9 by career PA), then BvP in batches of 20 with 200 ms delays.
3. Server excludes rows with fewer than 10 AB, then dedupes rows where 5+ batters on the same team vs the same pitcher share identical raw stats. Client applies four filters: minAB, minOPS, minSLG, minAVG.
4. Client splits into `upcoming` vs `inProgress` using `Date.now()` vs `gameTime`.
5. `TopPlays` and the first table use `upcoming` only; second table is **In progress**.
6. CSV export includes both upcoming and in-progress rows that pass filters.
7. `applyFilters` and `sortMatchups` run each render (pure, fast; on the order of hundreds of rows).

## Key Invariants

- **Filters:** AND logic. Every minimum must pass. Same filters apply to Upcoming and In progress.
- **Upcoming vs In progress:** Client-side split from `Date.now()` vs `m.gameTime`; refresh moves rows between sections.
- **TopPlays:** Only `upcoming` matchups (not the full unfiltered list).
- **Default ranking:** OPS, then AVG, SLG, AB (Top 5 card, table default sort, tiebreakers).
- **Confidence:** AB vs this pitcher: high ≥30, medium 15–29, low 10–14 (green / yellow / orange).
- **Caches:** Module-level only for BvP and roster/name TTL caches (not recreated inside the handler).
- **`parseSplit(stat)`:** Single mapping from MLB stat fields to raw + calculated fields; use in both API routes.
- **Aggregate dedup:** Drop rows where `keyCounts(statKey) >= 5` for identical raw lines (same team vs same pitcher). Keeps clusters of 4 or fewer.
- **`formatTime()`:** Uses `Intl.DateTimeFormat().resolvedOptions().timeZone` (browser local time, not hardcoded ET).

## MLB Stats API

Base: `https://statsapi.mlb.com/api/v1`

Key endpoints:

- `/schedule?sportId=1&date=DATE&hydrate=probablePitcher,lineups`
- `/game/{gamePk}/boxscore` (batting order)
- `/teams/{teamId}/roster?rosterType=active`
- `/people/{playerId}/stats?stats=career&group=hitting`
- `/people/{batterId}/stats?stats=vsPlayerTotal&opposingPlayerId={pitcherId}&group=hitting` (career BvP)
- `/people/{playerId}` (names)

BvP fetches use in-memory `bvpCache` (60 min TTL), not Next.js `revalidate` on that request.

## Commands

```bash
npm run dev       # localhost:3000
npm run build     # production build
npm run lint      # ESLint
npm test          # Jest (lib/)
npx vercel --prod # deploy
```

## Tests

Unit tests in `__tests__/` cover `lib/stats.ts`, `lib/utils.ts`, `lib/cache.ts`. Run with `npm test`. No component or route tests.
