# MLB BvP: Design Spec (historical)

**Date:** 2026-03-30
**Status:** Approved

---

## Overview

A web app that scans daily MLB batter vs. pitcher (BvP) matchups and ranks them for total bases betting. Pulls live data from the free MLB Stats API, filters by configurable thresholds using AND logic, and ranks plays by SLG (the most relevant stat for total bases props). Deployed to Vercel.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Data Source:** MLB Stats API (`https://statsapi.mlb.com`) — free, no auth required
- **Deployment:** Vercel
- **No database** — all data fetched fresh and cached in-memory

---

## Architecture & Data Flow

```
Browser
  └─ GET /api/matchups?date=YYYY-MM-DD
       │
       ├─ 1. Fetch schedule + probable pitchers (15min TTL)
       ├─ 2. For each game: fetch confirmed lineup OR fall back to top-9 active roster by PA (15min TTL)
       ├─ 3. For each batter × pitcher pair: fetch BvP career stats (60min in-memory TTL)
       ├─ 4. Calculate AVG/SLG/OBP/OPS from raw counting stats
       └─ 5. Return assembled MatchupResult[] to browser

Browser renders:
  ├─ TopPlays card (top 5 by SLG, min 10 AB — independent of user filter)
  ├─ Filter controls (client-side state, no re-fetch on change)
  └─ MatchupTable (client-side filter + sort on full dataset)
```

**Key decisions:**
- Filters run entirely client-side on the full returned dataset — instant feedback, no re-fetching
- Every `MatchupResult` carries `lineupSource: "confirmed" | "estimated"` displayed as a badge
- Date picker allows ±3 days from today
- BvP matchups with fewer than 10 AB are **excluded server-side** before the response is returned (not sent to the browser at all)
- BvP matchups where AB = 0 (e.g. batter only walked) are excluded server-side to avoid division-by-zero in stat formulas
- Top Plays card uses a fixed minimum of 10 AB and is **completely filter-free** — it ignores all user filter thresholds including minHR
- Doubleheaders: both games are included as separate entries in results, distinguished by `gameTime`. No deduplication. `gamesScanned` counts game-slots, not team pairs.

---

## Data Types

```typescript
interface MatchupResult {
  batterId: number
  batterName: string
  batterTeam: string
  batterTeamId: number
  pitcherId: number
  pitcherName: string
  pitcherTeam: string
  gameTime: string           // ISO string, displayed in ET
  isHome: boolean
  lineupSource: "confirmed" | "estimated"
  lineupPosition?: number    // batting order position (1-9) if confirmed lineup; undefined for estimated lineups

  // Raw counting stats from MLB API
  ab: number
  h: number
  doubles: number
  triples: number
  hr: number
  bb: number
  hbp: number
  sf: number
  k: number
  rbi: number

  // Calculated stats
  avg: number    // H / AB
  slg: number    // (1B + 2B*2 + 3B*3 + HR*4) / AB
  obp: number    // (H + BB + HBP) / (AB + BB + HBP + SF)
  ops: number    // OBP + SLG
  xbh: number    // 2B + 3B + HR

  confidence: "high" | "medium" | "low"  // 30+ AB, 15-29 AB, 10-14 AB
}

interface FilterState {
  minAB: number    // default: 15
  minOPS: number   // default: 0.950
  minSLG: number   // default: 0.500
  minAVG: number   // default: 0.300
  minHR: number    // default: 1
}

interface MatchupsResponse {
  date: string
  fetchedAt: string
  gamesScanned: number           // total game-slots scanned (counts each game in a doubleheader separately)
  gamesSkipped: number           // games skipped due to missing probable pitcher
  matchupsFound: number          // count of MatchupResult[] entries returned (after server-side AB < 10 exclusion)
  results: MatchupResult[]
}

// Lightweight response for the date picker endpoint
interface ScheduleResponse {
  date: string
  gamesFound: number
  pitchersConfirmed: number      // how many games have both probable pitchers set
  games: Array<{
    gamePk: number
    gameTime: string             // ISO string
    homeTeam: string
    awayTeam: string
    homeProbablePitcher?: string
    awayProbablePitcher?: string
  }>
}
```

**Stat formulas:**
- Singles = H − 2B − 3B − HR
- SLG = (1B + 2B×2 + 3B×3 + HR×4) / AB
- OBP = (H + BB + HBP) / (AB + BB + HBP + SF)
- OPS = OBP + SLG
- **Division-by-zero guard:** Any matchup with AB = 0 is excluded before stat calculation. If (AB + BB + HBP + SF) = 0, OBP is treated as 0 (edge case: batter faced pitcher with only SF — extremely rare).

---

## API Routes

### `GET /api/matchups?date=YYYY-MM-DD`
Main orchestration endpoint. Returns `MatchupsResponse`.

**Internal phases:**
1. Fetch schedule → extract games with both probable pitchers confirmed (skip games missing a pitcher)
2. Fetch lineup per team → use confirmed if available, otherwise top-9 active roster players by **career plate appearances** (career PA used because current-season PA is 0 at season start; career PA provides a stable ranking proxy year-round)
3. `Promise.allSettled` over all batter × pitcher pairs:
   - If the BvP endpoint returns an **empty stats array** (batter has never faced the pitcher): silently excluded
   - If the BvP endpoint returns data but **AB = 0** (e.g. batter only walked against this pitcher): silently excluded before stat calculation to prevent division-by-zero
   - Network/timeout failures: silently dropped, do not break other results
4. Calculate derived stats, assign confidence levels
5. **Server-side exclusion:** remove any remaining matchup with AB < 10
6. Return filtered dataset

**Rate limiting:** BvP calls batched in groups of 20 with a 200ms pause between batches.

### `GET /api/schedule?date=YYYY-MM-DD`
Returns game count, teams, probable pitchers, and game times. The date picker calls this lightweight endpoint to quickly show whether probable pitchers are available for a given date before the user commits to loading the full matchups dataset. This avoids triggering the expensive `/api/matchups` orchestration for dates with no pitchers confirmed.

### `GET /api/bvp?batterId=X&pitcherId=Y`
Single BvP lookup. Used internally by `/api/matchups`; also callable directly for debugging.

---

## Caching Strategy

| Data | Mechanism | TTL |
|------|-----------|-----|
| BvP career stats | In-memory `Map<"batterId:pitcherId", {data, fetchedAt}>` | 60 min |
| Schedule + probable pitchers | Next.js `fetch` with `revalidate` | 15 min |
| Team roster (fallback) | Next.js `fetch` with `revalidate` | 60 min |
| Game lineup | Next.js `fetch` with `revalidate` | 15 min |

---

## Component Structure

```
app/
  page.tsx                 ← Server component; passes initial date to ClientShell
  layout.tsx               ← Dark theme, fonts, metadata

  components/
    ClientShell.tsx        ← "use client" root; owns filterState + sortState + fetch logic
    TopPlays.tsx           ← Top 5 card (fixed 10 AB min, SLG descending)
    Filters.tsx            ← Threshold inputs + Apply + Reset + Export CSV
    MatchupTable.tsx       ← Sortable table with color-coded rows
    MatchupRow.tsx         ← Single row with lineup source badge
    DatePicker.tsx         ← ±3 days from today, triggers new fetch
    LoadingSkeleton.tsx    ← Shown while /api/matchups is in-flight
    StatusBar.tsx          ← Last Updated timestamp, refresh button, games scanned count

lib/
  mlb-api.ts              ← All MLB Stats API calls (typed fetch wrappers)
  cache.ts                ← In-memory TTL cache (Map-based, module-level singleton)
  stats.ts                ← AVG/SLG/OBP/OPS calculation functions
  types.ts                ← All shared TypeScript interfaces
  utils.ts                ← ET time formatting, CSV generation, confidence assignment
```

---

## UI Behavior

- **Default sort:** SLG descending. Clicking any column header toggles asc/desc.
- **Row colors:** green = high confidence (30+ AB), yellow = medium (15-29 AB), orange = low (10-14 AB)
- **Lineup badges:** amber "Estimated Lineup" badge when using roster fallback; subtle "Confirmed" when official lineup is available
- **Empty state:** If 0 results pass filters → "No matchups meet your criteria — try relaxing the filters" with a one-click Reset Filters button
- **Loading:** Skeleton UI while `/api/matchups` is in-flight
- **Date picker:** ±3 days. Selecting a new date triggers a fresh fetch.
- **Refresh button:** Forces a re-fetch (ignores client-side cache; server cache still applies)
- **CSV export:** Exports all columns for all currently-filtered and sorted results

---

## Filtering Logic

**AND logic only** — a matchup must pass every threshold simultaneously to appear. If any single filter fails, the matchup is excluded. This is intentionally stricter than tools like RotoWire which use OR logic.

All numeric filters use **greater than or equal to (≥)** semantics. For example, `minHR = 1` means HR ≥ 1 (at least one home run), not HR > 1.

Default thresholds:
| Filter | Default | Semantics |
|--------|---------|-----------|
| Min AB | 15 | AB ≥ 15 |
| Min OPS | .950 | OPS ≥ .950 |
| Min SLG | .500 | SLG ≥ .500 |
| Min AVG | .300 | AVG ≥ .300 |
| Min HR | 1 | HR ≥ 1 |

Filters are applied client-side on the full `MatchupResult[]` dataset. No API call needed on filter change.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Probable pitcher not announced | Game is skipped entirely; shown in status bar as "X games skipped — pitchers TBD" |
| No confirmed lineup yet | Fall back to top-9 active roster by PA; show "Estimated Lineup" badge |
| BvP endpoint returns no data (never faced) | Matchup silently excluded from results |
| BvP fetch fails (network/timeout) | Silently dropped via `Promise.allSettled`; does not break other results |
| MLB API down or rate limited | Show error banner: "Unable to fetch MLB data — please try again later" |
| 0 matchups qualify after filters | Show empty state with Reset Filters button |

---

## Deployment

- Deploy target: Vercel
- No environment variables required
- `vercel deploy` works out of the box
- Vercel edge caching via Next.js `fetch` revalidate headers

---

## MLB Stats API Endpoints Used

```
# Schedule with probable pitchers
GET https://statsapi.mlb.com/api/v1/schedule?sportId=1&date={date}&hydrate=probablePitcher,lineups

# BvP career stats
GET https://statsapi.mlb.com/api/v1/people/{batterId}/stats?stats=vsPlayer&opposingPlayerId={pitcherId}&group=hitting

# Active roster (fallback when no lineup)
GET https://statsapi.mlb.com/api/v1/teams/{teamId}/roster?rosterType=active

# Career stats per player — used to rank fallback roster by career PA
GET https://statsapi.mlb.com/api/v1/people/{playerId}/stats?stats=career&group=hitting
# Returns career totals including plateAppearances. Called for each player on the
# active roster when using the fallback lineup. Results cached at 60min TTL.
# Top 9 by career plateAppearances are used as the estimated batting order.

# Game boxscore (for confirmed lineup)
GET https://statsapi.mlb.com/api/v1/game/{gamePk}/boxscore
```
