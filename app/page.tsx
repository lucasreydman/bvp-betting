import ClientShell from './components/ClientShell'
import Footer from './components/Footer'

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">MLB BvP</h1>
        <p className="text-gray-400 text-sm mt-1 max-w-2xl text-balance">
          Career batter vs pitcher stats for the{' '}
          <span className="text-gray-300">batter to get a hit prop</span>
          {'. '}Today&apos;s MLB slate, sorted by AVG against this pitcher. Top 5 Plays ranked by AVG weighted for sample size.
        </p>
      </header>
      <ClientShell />
      <Footer />
    </main>
  )
}
