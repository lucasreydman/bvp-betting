import ClientShell from './components/ClientShell'
import Footer from './components/Footer'

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">MLB BvP Betting</h1>
        <p className="text-gray-400 text-sm mt-1 max-w-full text-balance">
          Career batter vs pitcher stats for the Player Hits (1+) prop on{' '}
          <span className="text-sky-400 font-semibold">FanDuel</span>, and for{' '}
          Total Bases (1+) or Hits (1+) on{' '}
          <span className="text-emerald-400 font-semibold">Bet365</span>{' '}
          and{' '}
          <span className="text-amber-400 font-semibold">theScore Bet</span>. They all mean the same thing at the same odds. Any single, double, triple, or homer wins. This tool surfaces today’s best historical matchups ranked by career BvP batting average, weighted by sample size for reliability.
        </p>
      </header>

      <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xs text-slate-300 space-y-3 leading-5">
        <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-semibold">How to use this system for best results</div>
        <p>
          <span className="text-white font-semibold">The page stays current automatically.</span>
          <span className="text-slate-300"> Data refreshes every 5 minutes. Top 5 and the Recommended Double show the current upcoming slate only. Once a game starts, players move to In Progress, then Settled with a final result. Check back after lineups post (usually 3–4 hours before first pitch) for exact hit chances.</span>
        </p>
        <p>
          <span className="text-yellow-400 font-semibold">Best bet: take the Recommended Double.</span>
          <span className="text-slate-300"> Parlay the two recommended legs together for +100 or better. Before games start, it&apos;s the top 2-leg recommendation on the board. After games begin, it reflects the best current 2-leg recommendation from the remaining upcoming slate.</span>
        </p>
        <p>
          <span className="text-orange-400 font-semibold">If it says Smash Double, even better.</span>
          <span className="text-slate-300"> A Smash Double is a Recommended Double where both legs have a career OPS above .950 and at least 7 hits against their pitcher. The hit floor ensures the high OPS reflects real contact, not a small-sample fluke. Same recommendation, higher conviction.</span>
        </p>
        <p>
          <span className="text-white font-semibold">Prefer lower risk?</span>
          <span className="text-slate-300"> Pick your favorites from the Top 5 and take them as singles. Less risk per bet than a parlay, with a smaller payout to match.</span>
        </p>
        <p>
          <span className="text-green-300 font-semibold">Confirmed lineups make the hit chance more accurate.</span>
          <span className="text-slate-300"> Hit chance uses expected at-bats, which adjusts by lineup position. Until lineups are official, a projected lineup order is used when available. Plays marked </span>
          <span className="text-white font-semibold">confirmed</span>
          <span className="text-slate-300"> use the exact number. Lineups usually post 3–4 hours before first pitch.</span>
        </p>
        <p>
          <span className="text-sky-400 font-semibold">Consistency is everything for EV.</span>
          <span className="text-slate-300"> The edge is statistical and compounds over time. Skipping days or cherry-picking erodes it. Treat it like a system, not a tip.</span>
        </p>
      </div>

      <ClientShell />
      <Footer />
    </main>
  )
}
