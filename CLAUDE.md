# MLB BvP

Next.js 16 / React 19 app. App Router only (no pages router). Tailwind v4 (no config file; `@import "tailwindcss"` in CSS).

Public-facing copy: **"to record a hit / to get a hit"** prop betting; career BvP for today's slate, surfaced by career BvP batting average weighted by sample size (AVG × min(AB/30, 1)). Walks/HBP do not count as hits.

## Architecture

```
app/
  page.tsx               # Server component
  layout.tsx             # Root layout, metadata, OG tags, Vercel Analytics
  opengraph-image.tsx    # Dynamic 1200x630 OG image (edge runtime)
  scoring-logic/
    page.tsx             # Dedicated scoring explainer page for mobile CTA
  disclaimer/
    page.tsx             # Disclaimer + responsible gambling page
  api/
    matchups/route.ts    # Main endpoint: all BvP pairs for a date; 5-min KV response cache
    bvp/route.ts         # Debug: single batter vs pitcher lookup
    schedule/route.ts    # Schedule for a date
  components/
    ClientShell.tsx      # Root client component; owns state; auto-refreshes every 5 min (silent) + re-renders every 60s
    DatePicker.tsx       # Today through tomorrow nav, UTC-safe date arithmetic
    StatusBar.tsx        # Last updated, games scanned, refresh; stacks vertically on mobile
    Filters.tsx          # Locked mobile chips for Min AB/AVG + optional OPS/H filters; Apply / Reset / Export CSV (CSV hidden on mobile)
    TopPlays.tsx         # First-pitch-locked Top 4 tracker; shows confirmed candidates pre-lock, then official tracked plays only; daily/secondary/smash double cards
    ScoringLogicContent.tsx # Shared scoring explainer used by desktop Top Plays and /scoring-logic
    MatchupTable.tsx     # Sortable table (sm+) + card list (mobile); sort chips on mobile; TEAM_ABBR map for mobile cards; recommendation tags render beside batter names
    MatchupRow.tsx       # Single <tr> row; used only in the sm+ table path; renders recommendation tags in desktop rows
    RecommendationTagBadge.tsx # Shared badge for SMASH / DD / SD / T4 table tags
    InfoTooltip.tsx      # Hover/tap tooltip used in top plays
    GameTimeCell.tsx     # Game time display cell used in table rows
    LoadingSkeleton.tsx  # Loading state with elapsed timer and progress messages
lib/
  types.ts    # MatchupResult, FilterState, DEFAULT_FILTERS, SortState, MatchupsResponse
  stats.ts    # calcStats(), assignConfidence(), parseSplit()
  utils.ts    # applyFilters(), sortMatchups(), generateCSV(), formatTime(), suggestRecommendedDoubles(), hitProbability(), regressedAvg(), expectedAtBats()
  mlb-api.ts       # MLB Stats API fetch helpers
  game-status.ts   # Pure helpers: getGameStatus(), computeHitResult()
  cache.ts         # createCache<T>(ttlMs), in-memory TTL cache
  kv.ts            # Vercel KV wrapper with in-memory fallback; kvGet/kvSet(key, value, ttlSeconds?)/kvDel
```

## Data Flow

1. `ClientShell` fetches `/api/matchups?date=YYYY-MM-DD` on mount and date change.
2. Route checks `matchups-response:{date}` and returns immediately if found. Before first pitch this cache is short-lived so confirmed lineups can update the candidate board; after lock it returns to the normal 5-minute TTL.
3. On cache miss: separates games by `getGameStatus(detailedState)` → upcoming vs in-progress/settled. For upcoming: loads lineups then BvP in batches of 20 with 200 ms delays. For in-progress/settled: reads frozen per-game KV snapshots.
4. Server excludes rows with fewer than 15 AB or below .300 AVG, then dedupes rows where **3+** batters on the same team vs the same pitcher share identical raw stats. After dedup, writes per-game KV snapshots (`game-qualifying:{gamePk}`, 36h TTL) for confirmed upcoming games.
5. Before the slate's first scheduled pitch, the API returns the current Top 4 candidate board, which can include estimated-lineup plays. At first pitch, it freezes `slate-top4:{date}` from the confirmed qualifying plays available at that cutoff.
6. For in-progress/settled games, server reads the pre-game per-game snapshot, filters to the locked Top 4 keys, and attaches live hit counts from `fetchBoxscoreHitting`. `computeHitResult` stamps each row `win/loss/pending`.
7. Client receives only the tracked set with server-set `gameStatus` (`upcoming | inProgress | settled`) plus `slateLockedAt`. `ClientShell` splits rows by `gameStatus`; filters apply within that tracked set.
8. `TopPlays` and the first table use upcoming tracked rows only; second table is **In progress**; third table is **Settled**.
9. CSV export includes upcoming and in-progress tracked rows that pass filters.
10. `applyFilters` and `sortMatchups` run each render (pure, fast; on the order of a handful of tracked rows).
11. `ClientShell` silently re-fetches data every 5 min and re-renders every 60s.

## Key Invariants

- **Filters:** minAB (15) and minAVG (.300) are server-enforced hard minimums — not user-editable. Only minOPS is user-configurable (optional). OPS filter applies to all three tables (upcoming, inProgress, settled).
- **Game status split:** Server-driven via `gameStatus` field on each `MatchupResult`. `getGameStatus(detailedState)` maps MLB API states → `upcoming | inProgress | settled`. Client reads `gameStatus` directly — no time-based split.
- **TopPlays:** Before lock, shows the current Top 4 candidate board, which may include estimated-lineup plays. After lock, shows only official tracked Top 4 plays that are still upcoming.
- **Default sort:** Game time asc by default for the Upcoming and In progress tables (earliest first). Top 4 card uses AVG × min(AB/30, 1) with tiebreakers raw AVG then AB.
- **Confidence:** AB vs this pitcher: high ≥21 (green), medium 18–20 (yellow), low 15–17 (red). Server enforces 15 AB minimum so all three tiers are reachable.
- **Slate Top 4 lock:** The official tracked set freezes at the slate's first scheduled pitch, not when the fourth confirmed play appears. Use only confirmed qualifying plays available by that cutoff.
- **Caches:** Module-level only for BvP and roster/name TTL caches (not recreated inside the handler). Response-level KV cache at `matchups-response:{date}` is 30s pre-lock and 5 min post-lock.
- **`parseSplit(stat)`:** Single mapping from MLB stat fields to raw + calculated fields; use in both API routes.
- **Aggregate dedup:** Drop rows where `keyCounts(statKey) >= 3` for identical raw lines (same team vs same pitcher). 3+ identical BvP lines from the same team is impossible in real data.
- **`formatTime()`:** Uses `Intl.DateTimeFormat().resolvedOptions().timeZone` (browser local time, not hardcoded ET).
- **Slate date cutoff:** Use the Pacific calendar day (`America/Los_Angeles`) for the active slate date. Do not advance the selected board at local midnight in other time zones.
- **Mobile layout:** `MatchupTable` renders a card list (`sm:hidden`) and a full table (`hidden sm:block`). Cards show batter, AVG, team abbreviation vs pitcher, H/AB, lineup badge, and `GameTimeCell`. Sort chips (AVG / AB / Time) replace column-header sorting on mobile. `TopPlays` uses `sm:hidden` / `hidden sm:flex` to switch between a 2-row card and the single-row desktop layout. Recommended doubles / Smash Double legs use a 2-row card on all screen sizes (name+AVG row 1, pitcher+OPS+AB+hit% row 2). Mobile Top Plays links to `/scoring-logic` via a Show Me the Math CTA instead of rendering the formula block inline. `Filters` shows locked `15 AB` and `.300 AVG` chips only on mobile, sized like the other mobile controls. `StatusBar` stacks clock + "Updated" on the left with the refresh button on the right on mobile; "games scanned" text is `hidden sm:inline`.
- **Recommendation tags:** Top 4 itself does not render recommendation badges. Tags render in the matchup tables and card list so a tagged player remains trackable as they move Upcoming → In progress → Settled during the session. `T4` remains present for every locked Top 4 play, even when it also carries `SMASH`, `DD`, or `SD`.
- **Team abbreviations:** `TEAM_ABBR` map in `MatchupTable.tsx` covers all 30 MLB teams; `abbr()` falls back to initials for unknown names.
- **KV TTLs:** Response cache uses 5-min TTL. `kvSet` accepts an optional third argument `ttlSeconds`.
- **PPD/cancelled games:** Filtered in `fetchSchedule` before any lineup or BvP work. Status checked via `g.status.detailedState`.
- **Lineup sources (priority order):** 1) Schedule hydration (`lineups.homePlayers/awayPlayers`, ≥8), 2) Boxscore `batters` array (always `cache: 'no-store'`), 3) Estimated top-9 roster by career PA — **only pre-game**. Once a game has started, if no confirmed batters exist, return empty rather than estimated.
- **Date range:** Today through tomorrow. `DatePicker` enforces `minDate = today`, `maxDate = today + 1` using the Pacific slate date.

## KV Schema

| Key | Value | TTL | Purpose |
|-----|-------|-----|---------|
| `matchups-response:{date}` | `MatchupsResponse` | 30 sec pre-lock, 5 min post-lock | Full compiled tracked response cache |
| `slate-top4:{date}` | `SlateTopPlaysSnapshot` | 36 hr | Official Top 4 snapshot frozen at the slate's first scheduled pitch |
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
