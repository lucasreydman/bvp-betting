# MLB BvP

A small web app for **research**: career batter vs pitcher (BvP) stats from the [MLB Stats API](https://statsapi.mlb.com) for the games on a chosen day. Results are sorted by **OPS** (then AVG, SLG, AB). This is not betting advice or a picks service.

**Live:** [bvp-betting.vercel.app](https://bvp-betting.vercel.app)

## How it works

1. Loads the schedule and probable pitchers for the date.
2. Builds each lineup: official order from the boxscore when available, otherwise the top 9 active players by career plate appearances.
3. Fetches career BvP for each batter vs the opposing starter (minimum 10 AB to show a row).
4. Computes OPS, AVG, SLG, OBP, and XBH from the split.
5. Ranks by OPS → AVG → SLG → AB. **Top 5 by OPS** highlights the best upcoming rows.
6. Splits the UI into **Upcoming** and **In progress** after first pitch; refresh updates which bucket a game is in.

**Total bases / props:** Many books count only hit bases toward TB (not walks). The app still ranks on OPS/AVG/SLG from BvP as a general hitting snapshot; it does not model walk-only plate appearances.

## Filters

| Filter | Default | Meaning |
|--------|---------|--------|
| Min AB | 10 | Career AB vs this pitcher |
| Min OPS | .950 | On-base plus slugging |
| Min SLG | .425 | Slugging |
| Min AVG | .275 | Batting average |

All four minimums apply at once (AND). The same rules apply to Upcoming and In progress. **Export CSV** includes rows from both sections that pass the filters.

## Confidence

Sample size (career AB vs this pitcher):

- **High** (green): 30+ AB  
- **Medium** (yellow): 15–29 AB  
- **Low** (orange): 10–14 AB  

## Data quality

The API sometimes returns team-level aggregates instead of true individual BvP. After building the list, any raw stat line shared by **five or more** batters on the same team against the same pitcher is dropped. Smaller duplicate groups (2–4) are kept so real ties are not stripped.

## Stack

- **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4**
- **MLB Stats API** (no auth)
- Hosted on **Vercel**

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run build
```

## Project layout

```
app/
  api/matchups/   Schedule → lineups → BvP
  api/bvp/        Single BvP lookup (debug)
  api/schedule/   Schedule JSON for a date
  components/     UI
lib/
  types.ts, stats.ts, utils.ts, mlb-api.ts, cache.ts
```

## License

MIT
