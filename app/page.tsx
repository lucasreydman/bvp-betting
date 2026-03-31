import ClientShell from './components/ClientShell'
import Footer from './components/Footer'

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">MLB BvP</h1>
        <p className="text-gray-400 text-sm mt-1 max-w-2xl text-balance">
          Career batter vs pitcher stats for the{' '}
          <span className="text-gray-300">To Record a Hit</span>
          {' prop (called '}
          <span className="text-gray-300">&ldquo;To Record a Hit&rdquo;</span>
          {' on FanDuel, '}
          <span className="text-gray-300">&ldquo;To Get a Hit&rdquo;</span>
          {' on Bet365 and theScore Bet). Any single, double, triple, or homer wins. This tool surfaces today&apos;s best historical matchups ranked by career BvP batting average — the stat that directly predicts hit probability — weighted by sample size for reliability.
        </p>
      </header>
      <ClientShell />
      <Footer />
    </main>
  )
}
