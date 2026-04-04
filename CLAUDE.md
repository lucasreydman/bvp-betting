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
  components/
    ClientShell.tsx      # Root client component; owns state; auto-refreshes every 5 min (silent) + re-renders every 60s
    DatePicker.tsx       # Today + tomorrow nav, UTC-safe date arithmetic
    StatusBar.tsx        # Last updated, games scanned, refresh; stacks vertically on mobile
    Filters.tsx          # Min AB + Min AVG + optional OPS filter; Apply / Reset / Export CSV (CSV hidden on mobile)
    TopPlays.tsx         # Top 5 by AVG×confidence (AB-scaled); upcoming only; 2-row card layout on mobile; Daily Double/Smash Double card
    MatchupTable.tsx     # Sortable table (sm+) + card list (mobile); sort chips on mobile; TEAM_ABBR map for mobile cards
    MatchupRow.tsx       # Single <tr> row; used only in the sm+ table path
    InfoTooltip.tsx      # Hover/tap tooltip used in top plays
    GameTimeCell.tsx     # Game time display cell used in table rows
    LoadingSkeleton.tsx  # Loading state with elapsed timer and progress messages
lib/
  types.ts    # MatchupResult, FilterState, DEFAULT_FILTERS, SortState, MatchupsResponse
  stats.ts    # calcStats(), assignConfidence(), parseSplit()
  utils.ts    # applyFilters(), sortMatchups(), generateCSV(), formatTime(), suggestDailyDouble(), hitProbability(), regressedAvg(), expectedAtBats()
  mlb-api.ts       # MLB Stats API fetch helpers
  game-status.ts   # Pure helpers: getGameStatus(), computeHitResult()
  cache.ts         # createCache<T>(ttlMs), in-memory TTL cache
  kv.ts            # Vercel KV wrapper with in-memory fallback; kvGet/kvSet(key, value, ttlSeconds?)/kvDel
```

## Data Flow

1. `ClientShell` fetches `/api/matchups?date=YYYY-MM-DD` on mount and date change.
2. Route checks a 5-minute KV response cache (`matchups-response:{date}`) and returns immediately if found.
3. On cache miss: separates games by `getGameStatus(detailedState)` → upcoming vs in-progress/settled. For upcoming: loads lineups then BvP in batches of 20 with 200 ms delays. For in-progress/settled: reads a frozen KV snapshot.
4. Server excludes rows with fewer than 10 AB, then dedupes rows where **3+** batters on the same team vs the same pitcher share identical raw stats. After dedup, writes per-game KV snapshots (`game-qualifying:{gamePk}`, 24h TTL) for upcoming games.
5. For in-progress/settled games, reads the pre-game KV snapshot and attaches live hit counts from `fetchBoxscoreHitting`. `computeHitResult` stamps each row `win/loss/pending`.
6. Client receives every row with a server-set `gameStatus` field (`upcoming | inProgress | settled`). `ClientShell` splits `allMatchups` by `gameStatus`; filters apply to upcoming only.
7. `TopPlays` and the first table use `upcoming` only; second table is **In progress**; third table is **Settled**.
8. CSV export includes both upcoming and in-progress rows that pass filters.
9. `applyFilters` and `sortMatchups` run each render (pure, fast; on the order of hundreds of rows).
10. `ClientShell` silently re-fetches data every 5 min and re-renders every 60s.

## Key Invariants

- **Filters:** AND logic across active filters (minAB/minAVG and optional minOPS). Filters apply to Upcoming only; In progress and Settled show all qualifying rows unfiltered.
- **Game status split:** Server-driven via `gameStatus` field on each `MatchupResult`. `getGameStatus(detailedState)` maps MLB API states → `upcoming | inProgress | settled`. Client reads `gameStatus` directly — no time-based split.
- **TopPlays:** Only `upcoming` matchups (not the full unfiltered list).
- **Default sort:** AVG desc by default (table). Top 5 card uses AVG × min(AB/30, 1) with tiebreakers raw AVG then AB.
- **Confidence:** AB vs this pitcher: high ≥30, medium 15–29, low 10–14 (green / yellow / red).
- **Caches:** Module-level only for BvP and roster/name TTL caches (not recreated inside the handler). Response-level KV cache at `matchups-response:{date}` with 5-min TTL.
- **`parseSplit(stat)`:** Single mapping from MLB stat fields to raw + calculated fields; use in both API routes.
- **Aggregate dedup:** Drop rows where `keyCounts(statKey) >= 3` for identical raw lines (same team vs same pitcher). 3+ identical BvP lines from the same team is impossible in real data.
- **`formatTime()`:** Uses `Intl.DateTimeFormat().resolvedOptions().timeZone` (browser local time, not hardcoded ET).
- **Mobile layout:** `MatchupTable` renders a card list (`sm:hidden`) and a full table (`hidden sm:block`). Cards show batter, AVG, team abbreviation vs pitcher, H/AB, lineup badge, and `GameTimeCell`. Sort chips (AVG / AB / Time) replace column-header sorting on mobile. `TopPlays` uses `sm:hidden` / `hidden sm:flex` to switch between a 2-row card and the single-row desktop layout. Daily Double / Smash Double legs use a 2-row card on all screen sizes (name+AVG row 1, pitcher+OPS+AB+hit% row 2). `StatusBar` stacks clock + "Updated" on the left with the refresh button on the right on mobile; "games scanned" text is `hidden sm:inline`.
- **Team abbreviations:** `TEAM_ABBR` map in `MatchupTable.tsx` covers all 30 MLB teams; `abbr()` falls back to initials for unknown names.
- **KV TTLs:** Response cache uses 5-min TTL. `kvSet` accepts an optional third argument `ttlSeconds`.
- **PPD/cancelled games:** Filtered in `fetchSchedule` before any lineup or BvP work. Status checked via `g.status.detailedState`.
- **Lineup sources (priority order):** 1) Schedule hydration (`lineups.homePlayers/awayPlayers`, ≥8), 2) Boxscore `batters` array (always `cache: 'no-store'`), 3) Estimated top-9 roster by career PA — **only pre-game**. Once a game has started, if no confirmed batters exist, return empty rather than estimated.
- **Date range:** Yesterday, today, and tomorrow. `DatePicker` enforces `minDate = today - 1`, `maxDate = today + 1`. Yesterday shows settled results only (reads `game-qualifying` KV snapshots; rows won't appear if the 24h TTL expired).

## KV Schema

| Key | Value | TTL | Purpose |
|-----|-------|-----|---------|
| `matchups-response:{date}` | `MatchupsResponse` | 5 min | Full compiled matchups response cache |
| `game-qualifying:{gamePk}` | `MatchupResult[]` | 36 hr | Pre-game qualifying snapshot; read for in-progress/settled games; written fire-and-forget for upcoming games after dedup |

## MLB Stats API

Base: `https://statsapi.mlb.com/api/v1`

Key endpoints:

- `/schedule?sportId=1&date=DATE&hydrate=probablePitcher,lineups` — always `cache: 'no-store'`
- `/game/{gamePk}/boxscore` — always `cache: 'no-store'` (lineup confirmation)
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

Unit tests in `__tests__/` cover `lib/stats.ts`, `lib/utils.ts`, `lib/cache.ts`, `lib/game-status.ts`. Run with `npm test`. No component or route tests.
