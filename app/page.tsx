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
      <ClientShell />
      <Footer />
    </main>
  )
}
