# MLB BvP

Built for the FanDuel **Player Hits (1+)** prop, and for **Total Bases (1+)** or **Hits (1+)** on **Bet365** and **theScore Bet**. These props mean the same thing at the same odds. Any single, double, triple, or homer wins. This tool surfaces today's best historical matchups ranked by **career BvP batting average**, weighted by sample size for reliability.

**Live:** [bvp-betting.vercel.app](https://bvp-betting.vercel.app)

## How to use it for best results

**Best bet: take the recommended double.** Before first pitch, the board shows the current Top 4 candidates, including estimated-lineup plays when official lineups are not posted yet. At the slate's first scheduled pitch, the official Top 4 locks from the confirmed plays available at that cutoff. If all four locked plays qualify, the board can show two 2-leg parlays, but the first non-smash card is the Daily Double and is the main recommendation. If only two or three locked plays qualify, it falls back to the single strongest double on the slate.

**If it says Smash Double, even better.** A Smash Double is the lead card whenever both legs have a career OPS above .950 and at least 7 hits against their pitcher. When one exists, it takes priority over the Daily Double and the remaining two Top 4 plays become the Secondary Double.

**Want more action? Take the Secondary Double if available.** When four locked Top 4 plays qualify, the board can show a second optional 2-leg parlay alongside the lead card.

**Prefer lower risk?** Pick your favorites out of the Top 4 Plays and take them as singles. Less risk per bet than a parlay, with a smaller payout to match.

**Consistency is everything for EV.** The edge here is statistical. It compounds over time. The more consistently you take these plays, the higher your expected value will be. Treat it like a system, not a tip.

**Confirmed lineups make the hit chance more accurate.** Hit chance is calculated using an expected at-bats number that adjusts based on where the batter sits in the order. Until lineups are official, the app projects a batting slot from recent lineup history when possible. Plays marked **confirmed** are stronger because that number is exact. Lineups usually drop 3–4 hours before first pitch.

## How it works

1. Loads the schedule and probable pitchers for the date. Postponed, cancelled, and suspended games are automatically excluded.
2. Builds each lineup: official order from the schedule or boxscore when available, otherwise the top 9 active players by career plate appearances.
3. Fetches career BvP for each batter vs the opposing starter, then excludes rows below 15 AB or .300 AVG.
4. Computes AVG, OPS, SLG, OBP, and XBH from the split.
5. Before the slate's first scheduled pitch, the API returns the current Top 4 candidate board, which can include estimated-lineup plays. At first pitch, it freezes a slate-wide official Top 4 snapshot from the confirmed qualifying plays available at that cutoff. Only those tracked plays continue into **Upcoming**, **In progress**, and **Settled**.
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

When **four** locked plays populate the Top 4 card, the app recommends **two doubles**. If any pair qualifies as a **Smash Double**, that pair is forced into the first slot and the other two legs become the second double. If no smash pair exists, the app evaluates the possible Top 4 splits and orders the two doubles by pair strength.

When only **two or three** plays qualify, the app shows just the single best available 2-leg parlay.

The **Smash Double** requires both legs to carry a career OPS above .950 and at least 7 hits against their pitcher. The hit floor ensures the high OPS reflects genuine contact rather than a small-sample fluke.

If one or more legs are already in progress, the recommended doubles section remains visible so you can track the bet or export it. In-progress legs are marked and dimmed.

## Recommendation tags

Recommendation tags now live in the matchup tables so tagged players stay identifiable as they move from **Upcoming** to **In progress** to **Settled**.

- **SMASH**: leg of the Smash Double
- **DD**: leg of the Daily Double, or the only non-smash double when there is just one
- **SD**: leg of the secondary double when two doubles are shown
- **T4**: official locked Top 4 play, including ones that also belong to SMASH, DD, or SD

## Date navigation

Today and tomorrow are available. The arrows move one day at a time within that range.

The active slate day rolls over on the **Pacific** calendar day, not at the viewer's local midnight. Game times still render in the viewer's local browser time zone.

## Filters

| Filter | Default | Meaning |
|--------|---------|---------|
| Min AB | 15 | Career AB vs this pitcher |
| Min AVG | .300 | Batting average |
| Min OPS | Off | Optional OPS filter (toggle on/off) |

The 15 AB and .300 AVG minimums are hard floors. On mobile they render as locked chips above the optional controls; on desktop they are implied rather than shown as separate pills.

All active filters apply at once (AND logic). Filters apply to the Upcoming, In progress, and Settled tables.

## Export CSV

The Export CSV button (desktop only) offers three options:

- **Daily / Secondary / Smash Double**: one or two 2-leg parlay recommendations
- **Top 4 Plays**: the official tracked Top 4 or, before lock, the current Top 4 candidate board
- **Full List**: all upcoming and in-progress rows that pass the current filters

## Confidence

Sample size (career AB vs this pitcher):

- **High** (green): 21+ AB
- **Medium** (yellow): 18–20 AB
- **Low** (red): 15–17 AB

## Data quality

- The API sometimes returns team-level aggregates instead of true individual BvP. Any raw stat line shared by **three or more** batters on the same team against the same pitcher is dropped.
- Before the slate lock, the Top 4 board can include estimated-lineup rows so future dates still surface provisional candidates.
- At the slate's first scheduled pitch, the API freezes a slate-wide `slate-top4:{date}` snapshot from the confirmed qualifying plays available at that cutoff. No later lineup confirmations can replace those tracked players.
- Upcoming games still write per-game qualifying snapshots to KV. Once those tracked players start, only players from those pre-game snapshots appear in the In progress and Settled tables, so no new players can enter mid-game.
- If no pre-game snapshot exists for a game (e.g. the server first saw it already in progress), that game is omitted from In progress and Settled rather than showing unverified data.
- Lineup data is always fetched fresh (no caching) so scratches and late lineup changes propagate within a short response-cache window, and estimated upcoming rows refresh faster until lineups are confirmed.

## Mobile layout

The site is fully responsive. On small screens:

- **Top 4 Plays** renders each entry as a two-row card.
- **Daily / Secondary / Smash Double** shows each leg as a clean two-row card (name + AVG on top, pitcher + OPS + AB + hit % below).
- **Scoring logic** moves to a dedicated Show Me the Math page linked from Top 4 instead of rendering the full explainer inline.
- **Tables** switch to a vertical card list with sort chips for AVG, AB, and Time.
- **Min AB** and **Min AVG** show as locked full-width chips above the optional mobile filters.
- **Export CSV** is hidden on mobile. Use desktop for CSV export.
- Team names are shown as abbreviations (NYY, LAD, SF, etc.).
- **Tooltips** are tap-to-open on touch devices and close when tapping outside.

## Time zones

Game times render in the viewer's local browser time zone. The selected slate date uses the Pacific calendar day.

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

To enable Discord notifications, add:

```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_NOTIFIER_SECRET=choose-a-random-secret
CRON_SECRET=use-the-same-secret-here
```

The notifier route lives at `/api/notifications/discord`. On this repo it is scheduled by GitHub Actions every 5 minutes, because Vercel Hobby does not support sub-daily cron jobs. Keep `CRON_SECRET` and `DISCORD_NOTIFIER_SECRET` set to the same value in Vercel so both scheduled and manual requests use the same bearer secret. If `DISCORD_WEBHOOK_URL` is missing, the route falls back to a dry-run preview mode so you can inspect the messages without posting anything.

Discord alerts now use their own pregame freeze window so bettors get the board before the site's official first-pitch lock. The site still freezes the official tracked Top 4 at first pitch, but Discord freezes a separate `discord-top4:{date}` snapshot from the best confirmed plays available a configurable number of minutes earlier and uses that same snapshot for the later leg-hit and double-hit posts.

Optional notifier timing env:

```
DISCORD_NOTIFICATION_LEAD_MINUTES=25
```

Manual test URLs:

```bash
# Preview messages without posting
http://localhost:3000/api/notifications/discord?dryRun=1

# Clear sent-event dedupe state for the slate date
http://localhost:3000/api/notifications/discord?reset=1&secret=your-secret
```

The notifier currently posts four simple event types from the Discord-specific frozen snapshot:

- pregame Top 4 alert board lock
- locked Daily / Secondary / Smash Double cards
- individual leg hit
- double hit once both legs have recorded a hit

GitHub Actions secret required for the scheduler:

```
DISCORD_NOTIFIER_SECRET=the-same-secret-you-set-in-Vercel
```

```bash
npm test
npm run build
```

## Project layout

```
app/
  api/matchups/    Schedule -> lineups -> BvP -> first-pitch Top 4 lock; short pre-lock KV cache
  api/bvp/         Single BvP lookup (debug)
  api/schedule/    Schedule JSON for a date
  scoring-logic/   Mobile scoring explainer page
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
| `matchups-response:{date}` | `MatchupsResponse` | 30 sec pre-lock, 5 min post-lock | Full compiled matchups response; short-lived before first pitch so confirmed lineups can refresh into the candidate board |
| `slate-top4:{date}` | `SlateTopPlaysSnapshot` | 36 hr | Official Top 4 snapshot frozen at the slate's first scheduled pitch |
| `discord-top4:{date}` | `DiscordTopPlaysSnapshot` | 72 hr | Discord-only alert snapshot frozen before first pitch from confirmed plays available at the earlier cutoff |
| `game-qualifying:{gamePk}` | `MatchupResult[]` | 36 hr | Pre-game snapshot of qualifying matchups for tracked-player carryover into in-progress/settled display |

## Disclaimer

For informational purposes only. Not financial or gambling advice. See [/disclaimer](https://bvp-betting.vercel.app/disclaimer) for full terms.

## License

MIT
