import ClientShell from './components/ClientShell'

export default function Home() {
  const today = new Date().toISOString().split('T')[0]
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          MLB BvP Total Bases Tool
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Career batter vs pitcher stats — ranked by SLG for total bases betting
        </p>
      </header>
      <ClientShell initialDate={today} />
    </main>
  )
}
