# MLB BvP

Built for the FanDuel **Player Hits (1+)** prop, and for **Total Bases (1+)** or **Hits (1+)** on **Bet365** and **theScore Bet**. These props mean the same thing at the same odds. Any single, double, triple, or homer wins. This tool surfaces today's best historical matchups ranked by **career BvP batting average**, weighted by sample size for reliability.

**Live:** [bvp-betting.vercel.app](https://bvp-betting.vercel.app)

## How to use it for best results

**Best bet: take the recommended doubles.** When all four Top 4 plays qualify, the board gives you two 2-leg parlays. If only two or three plays qualify, it falls back to the single strongest double on the slate.

**If it says Smash Double, even better.** A Smash Double is the first recommended double whenever both legs have a career OPS above .950 and at least 7 hits against their pitcher. When one exists, it is locked into the first slot and the remaining two Top 4 plays become the second double.

**Prefer lower risk?** Pick your favorites out of the Top 4 Plays and take them as singles. Less risk per bet than a parlay, with a smaller payout to match.

**Consistency is everything for EV.** The edge here is statistical. It compounds over time. The more consistently you take these plays, the higher your expected value will be. Treat it like a system, not a tip.

**Confirmed lineups make the hit chance more accurate.** Hit chance is calculated using an expected at-bats number that adjusts based on where the batter sits in the order. Until lineups are official, the app projects a batting slot from recent lineup history when possible. Plays marked **confirmed** are stronger because that number is exact. Lineups usually drop 3–4 hours before first pitch.

## How it works

1. Loads the schedule and probable pitchers for the date. Postponed, cancelled, and suspended games are automatically excluded.
2. Builds each lineup: official order from the schedule or boxscore when available, otherwise the top 9 active players by career plate appearances.
3. Fetches career BvP for each batter vs the opposing starter, then excludes rows below 15 AB or .300 AVG.
4. Computes AVG, OPS, SLG, OBP, and XBH from the split.
5. Splits results into **Upcoming**, **In progress**, and **Settled** tables based on game status from the MLB API. The qualifying player list for each game is frozen at game start, so no new players can enter or leave mid-game.
6. In-progress rows show whether each batter has gotten a hit yet (HIT / pending). Settled rows show the final result (HIT / NO HIT).
7. Data refreshes silently in the background every 5 minutes, and faster while any upcoming lineup is still estimated, with no manual refresh needed.
7. Sorts tables client-side (default: **AVG desc**).

**Why BvP for this prop:** Any hit (single through homer) wins. This app uses career hit stats vs that specific pitcher. Walks/HBP do not count as hits.

## Ranking and scoring

**Primary score:** `AVG × min(AB / 30, 1)` is the career batting average against this pitcher, weighted by how many at-bats back it up. More at-bats means more trust in the number. Tiebreakers: raw AVG, then AB.

**Hit chance %:** Estimated probability of recording at least one hit, using a regressed AVG and expected at-bats based on lineup position.

```
adjusted AVG = (AB / (AB + 50)) × AVG + (50 / (AB + 50)) × 0.320
hit chance   = 1 − (1 − adjusted AVG) ^ (expected AB)
```

## Recommended Doubles and Smash Double

When **four** plays populate the Top 4 card, the app recommends **two doubles**. If any pair qualifies as a **Smash Double**, that pair is forced into the first slot and the other two legs become the second double. If no smash pair exists, the app evaluates the possible Top 4 splits and orders the two doubles by pair strength.

When only **two or three** plays qualify, the app shows just the single best available 2-leg parlay.

The **Smash Double** requires both legs to carry a career OPS above .950 and at least 7 hits against their pitcher. The hit floor ensures the high OPS reflects genuine contact rather than a small-sample fluke.

If one or more legs are already in progress, the recommended doubles section remains visible so you can track the bet or export it. In-progress legs are marked and dimmed.

## Date navigation

Today and the next two days are available. The arrows move one day at a time within that range.

## Filters

| Filter | Default | Meaning |
|--------|---------|---------|
| Min AB | 15 | Career AB vs this pitcher |
| Min AVG | .300 | Batting average |
| Min OPS | Off | Optional OPS filter (toggle on/off) |

All active filters apply at once (AND logic). Filters apply to the Upcoming, In progress, and Settled tables.

## Export CSV

The Export CSV button (desktop only) offers three options:

- **Recommended Doubles / Smash Double**: one or two 2-leg parlay recommendations
- **Top 4 Plays**: top 4 upcoming plays by primary score
- **Full List**: all upcoming and in-progress rows that pass the current filters

## Confidence

Sample size (career AB vs this pitcher):

- **High** (green): 25+ AB
- **Medium** (yellow): 20–24 AB
- **Low** (red): 15–19 AB

## Data quality

- The API sometimes returns team-level aggregates instead of true individual BvP. Any raw stat line shared by **three or more** batters on the same team against the same pitcher is dropped.
- When a game is upcoming, the qualifying matchups for that game are snapshotted to KV. Once the game starts, only players from that pre-game snapshot appear in the In progress and Settled tables, so no new players can enter mid-game.
- If no pre-game snapshot exists for a game (e.g. the server first saw it already in progress), that game is omitted from In progress and Settled rather than showing unverified data.
- Lineup data is always fetched fresh (no caching) so scratches and late lineup changes propagate within a short response-cache window, and estimated upcoming rows refresh faster until lineups are confirmed.

## Mobile layout

The site is fully responsive. On small screens:

- **Top 4 Plays** renders each entry as a two-row card.
- **Recommended Doubles / Smash Double** shows each leg as a clean two-row card (name + AVG on top, pitcher + OPS + AB + hit % below).
- **Tables** switch to a vertical card list with sort chips for AVG, AB, and Time.
- **Export CSV** is hidden on mobile. Use desktop for CSV export.
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

Without these, the app falls back to a process-local in-memory store. It now respects TTLs, but cached data is still isolated to the current dev server process.

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
  utils.ts         Filters, sort, CSV, scoring, recommended doubles logic
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
