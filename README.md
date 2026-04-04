# MLB BvP

Built for the FanDuel **Player Hits (1+)** prop, and for **Total Bases (1+)** or **Hits (1+)** on **Bet365** and **theScore Bet**. These props mean the same thing at the same odds. Any single, double, triple, or homer wins. This tool surfaces today's best historical matchups ranked by **career BvP batting average**, weighted by sample size for reliability.

**Live:** [bvp-betting.vercel.app](https://bvp-betting.vercel.app)

## How to use it for best results

**Best bet: take the Daily Double.** Parlay the two recommended legs together for +100 or better. The legs are chosen to give you the highest combined probability of both hitting on that day's slate.

**If it says Smash Double, even better.** A Smash Double is a Daily Double where both legs also have a career OPS above .950 against their pitcher. Same bet, higher conviction.

**Prefer lower risk?** Pick your favorites out of the Top 5 Plays and take them as singles. Less risk per bet than a parlay, with a smaller payout to match.

**Consistency is everything for EV.** The edge here is statistical. It compounds over time. The more consistently you take these plays, the higher your expected value will be. Treat it like a system, not a tip.

**Confirmed lineups make the hit chance more accurate.** Hit chance is calculated using an expected at-bats number that adjusts based on where the batter sits in the order. Until lineups are official, a generic estimate is used. Plays marked **confirmed** are stronger because that number is exact. Lineups usually drop 3–4 hours before first pitch.

## How it works

1. Loads the schedule and probable pitchers for the date. Postponed, cancelled, and suspended games are automatically excluded.
2. Builds each lineup: official order from the schedule or boxscore when available, otherwise the top 9 active players by career plate appearances.
3. Fetches career BvP for each batter vs the opposing starter (minimum 10 AB to show a row).
4. Computes AVG, OPS, SLG, OBP, and XBH from the split.
5. Splits results into **Upcoming**, **In progress**, and **Settled** tables based on game status from the MLB API. The qualifying player list for each game is frozen at game start — no new players can enter or leave mid-game.
6. In-progress rows show whether each batter has gotten a hit yet (HIT / —). Settled rows show the final result (HIT / NO HIT).
7. Data refreshes silently in the background every 5 minutes — no manual refresh needed.
7. Sorts tables client-side (default: **AVG desc**).

**Why BvP for this prop:** Any hit (single through homer) wins. This app uses career hit stats vs that specific pitcher; walks/HBP do not count as hits.

## Ranking and scoring

**Primary score:** `AVG × min(AB / 30, 1)` — career batting average against this pitcher, weighted by how many at-bats back it up. More at-bats means more trust in the number. Tiebreakers: raw AVG, then AB.

**Hit chance %:** Estimated probability of recording at least one hit, using a regressed AVG and expected at-bats based on lineup position.

```
adjusted AVG = (AB / (AB + 50)) × AVG + (50 / (AB + 50)) × 0.260
hit chance   = 1 − (1 − adjusted AVG) ^ (expected AB)
```

## Daily Double and Smash Double

The **Daily Double** is a single 2-leg parlay recommendation built from the Top 5 Plays. Both legs must have at least 15 AB and a .300+ career AVG against their pitcher to qualify. It picks the pair with the highest combined hit probability while keeping both legs on different pitchers.

The **Smash Double** is a Daily Double where both legs also carry a career OPS above .950 against their pitcher. The historical edge is stronger on both sides of the parlay. Every Smash Double win also counts as a Daily Double win.

If one or more legs are already in progress, the Daily Double card remains visible so you can track the bet or export it. In-progress legs are marked and dimmed.

## Date navigation

Today and tomorrow are available. The forward arrow peeks at tomorrow's probable matchups; the back arrow returns to today.

## Filters

| Filter | Default | Meaning |
|--------|---------|---------|
| Min AB | 15 | Career AB vs this pitcher |
| Min AVG | .300 | Batting average |
| Min OPS | Off | Optional OPS filter (toggle on/off) |

All active filters apply at once (AND logic). Filters apply to the Upcoming table only — In progress and Settled tables show all qualifying rows regardless of filter settings.

## Export CSV

The Export CSV button (desktop only) offers three options:

- **Daily Double / Smash Double** — 2-leg parlay recommendation
- **Top 5 Plays** — top 5 upcoming plays by primary score
- **Full List** — all rows that pass the current filters

## Confidence

Sample size (career AB vs this pitcher):

- **High** (green): 30+ AB
- **Medium** (yellow): 15–29 AB
- **Low** (red): 10–14 AB

## Data quality

- The API sometimes returns team-level aggregates instead of true individual BvP. Any raw stat line shared by **three or more** batters on the same team against the same pitcher is dropped.
- When a game is upcoming, the qualifying matchups for that game are snapshotted to KV. Once the game starts, only players from that pre-game snapshot appear in the In progress and Settled tables — no new players can enter mid-game.
- If no pre-game snapshot exists for a game (e.g. the server first saw it already in progress), that game is omitted from In progress and Settled rather than showing unverified data.
- Lineup data is always fetched fresh (no caching) so scratches and late lineup changes propagate within the 5-minute response cache window.

## Mobile layout

The site is fully responsive. On small screens:

- **Top 5 Plays** renders each entry as a two-row card.
- **Daily Double / Smash Double** shows each leg as a clean two-row card (name + AVG on top, pitcher + OPS + AB + hit % below).
- **Tables** switch to a vertical card list with sort chips for AVG, AB, and Time.
- **Export CSV** is hidden on mobile — use desktop for CSV export.
- Team names are shown as abbreviations (NYY, LAD, SF, etc.).
- **Tooltips** are tap-to-open on touch devices and close when tapping outside.

## Time zones

Game times render in the viewer's local browser time zone.

## Stack

- **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4**
- **MLB Stats API** (no auth)
- **Upstash Redis** (via Vercel KV) for 5-minute response cache
- **Vercel Analytics** for traffic tracking
- Hosted on **Vercel**

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy Vercel KV credentials into `.env.local` (from the Vercel dashboard) for caching to work locally:

```
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
```

Without these, the app falls back to an in-memory store for the duration of the server process.

```bash
npm test
npm run build
```

## Project layout

```
app/
  api/matchups/    Schedule -> lineups -> BvP; 5-min KV response cache
  api/bvp/         Single BvP lookup (debug)
  api/schedule/    Schedule JSON for a date
  components/      UI
lib/
  types.ts         Shared types (MatchupResult, FilterState, SortState, ...)
  stats.ts         calcStats, assignConfidence, parseSplit
  utils.ts         Filters, sort, CSV, scoring, Daily Double logic
  mlb-api.ts       MLB Stats API fetch helpers
  cache.ts         In-memory TTL cache
  kv.ts            Vercel KV wrapper with in-memory fallback
```

## KV schema

| Key | Value | TTL | Purpose |
|-----|-------|-----|---------|
| `matchups-response:{date}` | `MatchupsResponse` | 5 min | Full compiled matchups response; absorbs concurrent load |
| `game-qualifying:{gamePk}` | `MatchupResult[]` | 24 hr | Pre-game snapshot of qualifying matchups; frozen at game start for in-progress/settled display |

## Disclaimer

For informational purposes only. Not financial or gambling advice. See [/disclaimer](https://bvp-betting.vercel.app/disclaimer) for full terms.

## License

MIT
