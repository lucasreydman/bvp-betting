# MLB BvP

Built for the **“to record a hit / to get a hit”** prop: career batter vs pitcher (BvP) stats from the [MLB Stats API](https://statsapi.mlb.com) for each day’s games. This tool surfaces today’s best historical matchups ranked by **career BvP batting average**, weighted by sample size for reliability.

**Live:** [bvp-betting.vercel.app](https://bvp-betting.vercel.app)

## How it works

1. Loads the schedule and probable pitchers for the date.
2. Builds each lineup: official order from the boxscore when available, otherwise the top 9 active players by career plate appearances.
3. Fetches career BvP for each batter vs the opposing starter (minimum 10 AB to show a row).
4. Computes OPS, AVG, SLG, OBP, and XBH from the split.
5. Splits the UI into **Upcoming** and **In progress** after first pitch; refresh updates which bucket a game is in.
6. Sorts tables client-side (default: **AVG desc**). The **Top 5 Plays** card uses a score of \(AVG \times \min(AB/30, 1)\) (tiebreakers: raw AVG, then AB).

**Why BvP for this prop:** Any hit (single through homer) wins. This app uses career hit stats vs that specific pitcher; walks/HBP don’t count as hits.

## Filters

| Filter | Default | Meaning |
|--------|---------|--------|
| Min AB | 15 | Career AB vs this pitcher |
| Min AVG | .300 | Batting average |
| Min OPS | Off | Optional OPS filter (toggle on/off) |

All active minimums apply at once (AND). The same rules apply to Upcoming and In progress. **Export CSV** includes rows from both sections that pass the filters (in the current sort order).

## Confidence

Sample size (career AB vs this pitcher):

- **High** (green): 30+ AB  
- **Medium** (yellow): 15–29 AB  
- **Low** (red): 10–14 AB  

## Data quality

The API sometimes returns team-level aggregates instead of true individual BvP. After building the list, any raw stat line shared by **five or more** batters on the same team against the same pitcher is dropped. Smaller duplicate groups (2–4) are kept so real ties are not stripped.

## Time zones

Game times render in the viewer’s **local browser time zone**.

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
