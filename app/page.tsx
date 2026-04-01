import ClientShell from './components/ClientShell'
import Footer from './components/Footer'

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">MLB BvP</h1>
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
        <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-semibold">How to use this for best results</div>
        <p>
          <span className="text-white font-semibold">Check it in the morning</span>
          <span className="text-slate-300"> before any games start. Once games begin, those legs are no longer available to bet.</span>
        </p>
        <p>
          <span className="text-yellow-400 font-semibold">Best bet: take the Daily Double.</span>
          <span className="text-slate-300"> Parlay the two recommended legs together. If both hit, you double your money. It pays +100 or better, and the legs are chosen to give you the highest combined probability of both hitting on that day's slate.</span>
        </p>
        <p>
          <span className="text-white font-semibold">Prefer lower risk?</span>
          <span className="text-slate-300"> Take one to five of the Top 5 Plays as singles instead. Each is a straight bet that the batter records at least one hit. You win less per bet, but you win more often.</span>
        </p>
        <p>
          <span className="text-sky-400 font-semibold">Consistency is everything for EV.</span>
          <span className="text-slate-300"> The edge here is statistical — it compounds over time. The more consistently you take these plays, the higher your expected value will be. Skipping days or cherry-picking erodes that edge. Treat it like a system, not a tip.</span>
        </p>
      </div>

      <ClientShell />
      <Footer />
    </main>
  )
}
