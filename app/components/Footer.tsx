export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-12 border-t border-gray-800 pt-8 pb-10 text-xs text-gray-500 space-y-6">

      {/* Methodology */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Why AVG?</h3>
          <p className="leading-relaxed">
            For a batter to get a hit prop, any hit (single through homer) wins the bet — so slugging
            and walks are irrelevant. Batting average is the direct measure:{' '}
            <span className="text-gray-400 font-mono">P(1+ hit) = 1 − (1 − AVG)ⁿ</span> where n is
            at-bats in the game (~3.5 on average). A .300 BvP AVG implies ~70% hit probability per
            game — above most book implied odds of 60–63%.
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Why 15 AB minimum?</h3>
          <p className="leading-relaxed">
            At 10 AB, the margin of error on an AVG estimate is ±.145 — wide enough to make the
            number nearly meaningless. 15 AB cuts that to ±.118 and aligns with the medium confidence
            threshold. The default view shows only matchups with enough history to trust. Drop it to
            10 if you want to include smaller samples (shown in red).
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Confidence &amp; Top 5</h3>
          <p className="leading-relaxed">
            Confidence reflects sample size: <span className="text-green-500">green</span> = 30+ AB,{' '}
            <span className="text-yellow-500">yellow</span> = 15–29 AB,{' '}
            <span className="text-red-500">red</span> = 10–14 AB. Top 5 Plays ranks by{' '}
            <span className="text-gray-400 font-mono">AVG × min(AB / 30, 1)</span> — rewarding both
            a high average and a large enough sample to trust it. A .350 in 30 AB scores higher than
            a .500 in 8 AB.
          </p>
        </div>
      </div>

      {/* Branding */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-800">
        <p>
          Built by{' '}
          <span className="text-gray-400 font-medium">Lucas Reydman</span>
          {' · '}
          Data from the{' '}
          <a
            href="https://statsapi.mlb.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            MLB Stats API
          </a>
          {' · '}
          <a
            href="https://github.com/lucasreydman/bvp-betting"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </p>
        <p>&copy; {year} Lucas Reydman. For informational purposes only.</p>
      </div>

    </footer>
  )
}
