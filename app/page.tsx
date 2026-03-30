import ClientShell from './components/ClientShell'

export default function Home() {
  const today = new Date().toISOString().split('T')[0]
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">MLB BvP</h1>
        <p className="text-gray-400 text-sm mt-1 max-w-2xl text-balance">
          For the{' '}
          <span className="text-gray-300">1+ total bases prop</span>
          {': '}Career batter vs pitcher stats for today&apos;s slate from MLB, ranked by OPS (then AVG, SLG, AB).
          Walks usually don&apos;t count toward TB.
        </p>
      </header>
      <ClientShell initialDate={today} />
    </main>
  )
}
