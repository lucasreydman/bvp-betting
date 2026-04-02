# MLB BvP

Next.js 16 / React 19 app. App Router only (no pages router). Tailwind v4 (no config file; `@import "tailwindcss"` in CSS).

Public-facing copy: **"to record a hit / to get a hit"** prop betting; career BvP for today's slate, surfaced by career BvP batting average weighted by sample size (AVG × min(AB/30, 1)). Walks/HBP do not count as hits.

## Architecture

```
app/
  page.tsx               # Server component
  layout.tsx             # Root layout, metadata, OG tags, Vercel Analytics
  opengraph-image.tsx    # Dynamic 1200x630 OG image (edge runtime)
  disclaimer/
    page.tsx             # Disclaimer + responsible gambling page
  api/
    matchups/route.ts    # Main endpoint: all BvP pairs for a date; 5-min KV response cache
    bvp/route.ts         # Debug: single batter vs pitcher lookup
    schedule/route.ts    # Schedule for a date
    snapshot/route.ts    # Read/recompute stored Daily Double snapshot for a date
    history/route.ts     # Past Daily Double entries with outcomes for last N days
    stats/route.ts       # All-time W/L stats across Daily Double, Smash Double, Top 5 legs
  components/
    ClientShell.tsx      # Root client component; owns state
    DatePicker.tsx       # ±3 day nav, UTC-safe date arithmetic
    StatusBar.tsx        # Last updated, games scanned, refresh; stacks vertically on mobile
    Filters.tsx          # Min AB + Min AVG + optional OPS filter; Apply / Reset / Export CSV (CSV hidden on mobile)
    TopPlays.tsx         # Top 5 by AVG×confidence (AB-scaled); upcoming only; 2-row card layout on mobile
    MatchupTable.tsx     # Sortable table (sm+) + card list (mobile); sort chips on mobile; TEAM_ABBR map for mobile cards
    MatchupRow.tsx       # Single <tr> row; used only in the sm+ table path
    HistorySection.tsx   # Collapsible Daily Double history + all-time stats card
    InfoTooltip.tsx      # Hover/tap tooltip used in history and top plays
    GameTimeCell.tsx     # Game time display cell used in table rows
    LoadingSkeleton.tsx  # Loading state with elapsed timer and progress messages
lib/
  types.ts    # MatchupResult, FilterState, DEFAULT_FILTERS, SortState, HistoryEntry, AllTimeStats, StatsBucket
  stats.ts    # calcStats(), assignConfidence(), parseSplit()
  utils.ts    # applyFilters(), sortMatchups(), generateCSV(), formatTime(), suggestDailyDouble(), hitProbability(), regressedAvg(), expectedAtBats()
  mlb-api.ts  # MLB Stats API fetch helpers
  cache.ts    # createCache<T>(ttlMs), in-memory TTL cache
  kv.ts       # Vercel KV wrapper with in-memory fallback; kvGet/kvSet(key, value, ttlSeconds?)/kvDel
```

## Data Flow

1. `ClientShell` fetches `/api/matchups?date=YYYY-MM-DD` on mount and date change.
2. Route checks a 5-minute KV response cache (`matchups-response:{date}`) and returns immediately if found.
3. On cache miss: loads schedule, then lineups (boxscore or estimated top 9 by career PA), then BvP in batches of 20 with 200 ms delays.
4. Server excludes rows with fewer than 10 AB, then dedupes rows where **3+** batters on the same team vs the same pitcher share identical raw stats. Client applies filters: minAB, minAVG, and optional minOPS.
5. Client splits into `upcoming` vs `inProgress` using `Date.now()` vs `gameTime`.
6. `TopPlays` and the first table use `upcoming` only; second table is **In progress**.
7. CSV export includes both upcoming and in-progress rows that pass filters.
8. `applyFilters` and `sortMatchups` run each render (pure, fast; on the order of hundreds of rows).

## Key Invariants

- **Filters:** AND logic across active filters (minAB/minAVG and optional minOPS). Same filters apply to Upcoming and In progress.
- **Upcoming vs In progress:** Client-side split from `Date.now()` vs `m.gameTime`; refresh moves rows between sections.
- **TopPlays:** Only `upcoming` matchups (not the full unfiltered list).
- **Default sort:** AVG desc by default (table). Top 5 card uses AVG × min(AB/30, 1) with tiebreakers raw AVG then AB.
- **Confidence:** AB vs this pitcher: high ≥30, medium 15–29, low 10–14 (green / yellow / red).
- **Caches:** Module-level only for BvP and roster/name TTL caches (not recreated inside the handler). Response-level KV cache at `matchups-response:{date}` with 5-min TTL.
- **`parseSplit(stat)`:** Single mapping from MLB stat fields to raw + calculated fields; use in both API routes.
- **Aggregate dedup:** Drop rows where `keyCounts(statKey) >= 3` for identical raw lines (same team vs same pitcher). 3+ identical BvP lines from the same team is impossible in real data.
- **`formatTime()`:** Uses `Intl.DateTimeFormat().resolvedOptions().timeZone` (browser local time, not hardcoded ET).
- **Mobile layout:** `MatchupTable` renders a card list (`sm:hidden`) and a full table (`hidden sm:block`). Cards show batter, AVG, team abbreviation vs pitcher, H/AB, lineup badge, and `GameTimeCell`. Sort chips (AVG / AB / Time) replace column-header sorting on mobile. `TopPlays` uses `sm:hidden` / `hidden sm:flex` to switch between a 2-row card and the single-row desktop layout. `StatusBar` stacks clock + "Updated" on the left with the refresh button on the right on mobile; "games scanned" text is `hidden sm:inline`.
- **Team abbreviations:** `TEAM_ABBR` map in `MatchupTable.tsx` covers all 30 MLB teams; `abbr()` falls back to initials for unknown names.
- **KV TTLs:** All historical keys (`dd:`, `top5:`, `pregame:`, `outcome:`, `top5outcome:`) use a 90-day TTL. Response cache uses 5-min TTL. `kvSet` accepts an optional third argument `ttlSeconds`.

## KV Schema

| Key | Value | TTL | Purpose |
|-----|-------|-----|---------|
| `dd:{date}` | `DailyDouble` | 90 days | Pre-game Daily Double snapshot |
| `top5:{date}` | `MatchupResult[]` | 90 days | Pre-game Top 5 snapshot |
| `pregame:{date}` | `Record<"batterId:pitcherId", ParsedSplit>` | 90 days | Per-player pre-game stats (frozen once game starts) |
| `outcome:{date}` | `{firstHit, secondHit}` | 90 days | Cached Daily Double outcome |
| `top5outcome:{date}` | `(boolean \| null)[]` | 90 days | Cached hit results for each Top 5 leg |
| `matchups-response:{date}` | `MatchupsResponse` | 5 min | Full compiled matchups response cache |

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

## Assets

- `app/icon.png` — favicon; Next.js auto-serves as `/icon.png` and injects into `<head>`.

## Tests

Unit tests in `__tests__/` cover `lib/stats.ts`, `lib/utils.ts`, `lib/cache.ts`. Run with `npm test`. No component or route tests.
