# MLB BvP

Built for **1+ total bases** prop betting: career batter vs pitcher (BvP) stats from the [MLB Stats API](https://statsapi.mlb.com) for each day’s games. Rows are sorted by **OPS** (then AVG, SLG, AB) so you can spot strong hit-based matchups before first pitch.

**Live:** [bvp-betting.vercel.app](https://bvp-betting.vercel.app)

## How it works

1. Loads the schedule and probable pitchers for the date.
2. Builds each lineup: official order from the boxscore when available, otherwise the top 9 active players by career plate appearances.
3. Fetches career BvP for each batter vs the opposing starter (minimum 10 AB to show a row).
4. Computes OPS, AVG, SLG, OBP, and XBH from the split.
5. Ranks by OPS → AVG → SLG → AB. **Top 5 by OPS** highlights the best upcoming rows for scanning 1+ TB spots.
6. Splits the UI into **Upcoming** and **In progress** after first pitch; refresh updates which bucket a game is in.

**Why BvP for 1+ TB:** The prop pays on hit total bases (singles and up). Most books do not count walks or HBP toward TB. This app uses career hit stats vs that pitcher, not walk outcomes.

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
