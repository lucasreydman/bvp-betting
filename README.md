# MLB BvP Total Bases Tool

A daily betting research tool that surfaces the best **1+ total bases** plays by ranking every batter vs pitcher matchup on the day's schedule using career head-to-head stats from the MLB Stats API.

**Live:** [bvp-betting.vercel.app](https://bvp-betting.vercel.app)

## How It Works

1. Pulls the day's schedule and probable pitchers from the MLB Stats API
2. Resolves each team's lineup — confirmed batting order from the boxscore when available, otherwise estimated from the top 9 active roster players by career plate appearances
3. Fetches career BvP (batter vs pitcher) splits for every batter–pitcher pair (minimum 10 AB)
4. Calculates OPS, AVG, SLG, OBP, and XBH from the raw split
5. Displays results ranked by **OPS → AVG → SLG → AB**
6. Games that have already started move to an **In Progress** section automatically on refresh — qualifying plays stay visible for reference even after first pitch

**Total bases props:** Most books count only bases from hits (walks/HBP do not count toward TB). This tool still ranks by OPS/AVG/SLG from BvP as a general hitting-strength signal — it does not model walk-only PAs.

## Filters

| Filter | Default | Description |
|--------|---------|-------------|
| Min AB | 10 | Minimum career at-bats against this pitcher |
| Min OPS | .950 | On-base plus slugging |
| Min SLG | .425 | Slugging percentage |
| Min AVG | .275 | Batting average |

All filters are AND logic — a matchup must pass every threshold to appear. Filters apply to both the Qualifying Matchups and In Progress sections.

## Confidence Levels

Confidence is based on sample size (career AB vs this pitcher):

- **High** (green) — 30+ AB
- **Medium** (yellow) — 15–29 AB
- **Low** (orange) — 10–14 AB

## Data Quality

The MLB Stats API occasionally returns team-aggregate stats instead of individual BvP records (e.g. when a pitcher has only faced a team once). After building the list, any **stat line** that appears for **five or more** batters on the same team against the same pitcher (identical raw counting stats) is treated as bad data and those rows are dropped. Smaller duplicate clusters (2–4 batters) are left in place so borderline real ties are not removed.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS v4**
- **MLB Stats API** (free, no auth required)
- Deployed on **Vercel**

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test        # unit tests
npm run build   # production build
```

## Project Structure

```
app/
  api/matchups/   Main data endpoint — schedule → lineups → BvP stats
  api/bvp/        Single batter vs pitcher lookup (debug)
  api/schedule/   Raw schedule for a date
  components/     All UI components
lib/
  types.ts        Shared types and filter defaults
  stats.ts        parseSplit(), calcStats(), assignConfidence()
  utils.ts        applyFilters(), sortMatchups(), generateCSV()
  mlb-api.ts      MLB Stats API fetch functions
  cache.ts        In-memory TTL cache
```

## License

MIT
