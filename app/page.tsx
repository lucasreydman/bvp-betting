import ClientShell from './components/ClientShell'
import Footer from './components/Footer'

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">MLB BvP Betting</h1>
        <p className="text-gray-400 text-sm mt-1 max-w-full text-balance">
          Career batter vs pitcher stats for the <span className="text-white font-semibold">Player to Record a Hit</span> prop (1+ hits / over 0.5 hits). 
          Matchups are ranked by career BvP batting average weighted by sample size, with consensus odds from major U.S. sportsbooks attached to each play.
        </p>
      </header>

      <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xs text-slate-300 space-y-3 leading-5">
        <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-semibold">How to use this system</div>
        <p>
          <span className="text-white font-semibold">The page stays current automatically.</span>
          <span className="text-slate-300"> Data refreshes every 5 minutes, and faster while any lineup is still estimated. Top 4 and the recommended doubles show the current upcoming slate only. Once a game starts, players move to In Progress, then Settled with a final result. Check back after lineups post (usually 3–4 hours before first pitch) for exact hit chances.</span>
        </p>
        <p>
          <span className="text-yellow-400 font-semibold">Best bet: take the recommended doubles.</span>
          <span className="text-slate-300"> When all four plays populate, the board gives you two 2-leg parlays. If only two or three plays qualify, it falls back to the strongest single double. Before games start, these are the best current pairings on the board. After games begin, they reflect the remaining upcoming slate.</span>
        </p>
        <p>
          <span className="text-orange-400 font-semibold">If it says Smash Double, even better.</span>
          <span className="text-slate-300"> A Smash Double is the first recommended double whenever both legs have a career OPS above .950 and at least 7 hits against their pitcher. The hit floor ensures the high OPS reflects real contact, not a small-sample fluke. When one exists, it gets locked in first and the remaining two top plays form the second double.</span>
        </p>
        <p>
          <span className="text-white font-semibold">Prefer lower risk?</span>
          <span className="text-slate-300"> Pick your favorites from the Top 4 and take them as singles. Less risk per bet than a parlay, with a smaller payout to match. The list is capped at four on purpose so the board stays focused on the strongest edges instead of drifting into weaker volume plays.</span>
        </p>
        <p>
          <span className="text-green-300 font-semibold">Confirmed lineups make the hit chance more accurate.</span>
          <span className="text-slate-300"> Hit chance uses expected at-bats, which adjusts by lineup position. Until lineups are official, the app projects a batting slot from recent lineup history when it can. Plays marked </span>
          <span className="text-white font-semibold">confirmed</span>
          <span className="text-slate-300"> use the exact number. Lineups usually post 3–4 hours before first pitch.</span>
        </p>
        <p>
          <span className="text-sky-400 font-semibold">The edge is statistical, not guaranteed.</span>
          <span className="text-slate-300"> BvP averages reflect career history, not a prediction. Use this as one input among many, and only bet what you&apos;re comfortable losing.</span>
        </p>
      </div>

      <ClientShell />
      <Footer />
    </main>
  )
}
