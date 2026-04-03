import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-12 border-t border-gray-800 pt-8 pb-10 text-xs text-gray-500 space-y-6">

      {/* Methodology — 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Why AVG?</h3>
          <p className="leading-relaxed">
            This prop wins on any hit (single through homer), so slugging and walks don&apos;t factor in. AVG is the direct measure:{' '}
            <span className="text-gray-400 font-mono">P(1+ hit) = 1 − (1 − AVG)ⁿ</span> where n is
            expected at-bats (4.1 unconfirmed; 3.85–4.45 by lineup position once confirmed). A .300 BvP AVG translates to roughly a 73–77% hit
            probability — well above most book implied odds of 60–63%.
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Defaults are recommended</h3>
          <p className="leading-relaxed">
            The defaults (15 AB, .300 AVG) are set to show only reliable, meaningful matchups out of
            the box. All filters are customizable. Dropping min AB to 10 reveals smaller samples
            shown in <span className="text-red-500">red</span>: real data, but with a margin of
            error wide enough (±.145) that a single fluky at-bat can swing the AVG significantly.
            Raising min AVG tightens the list to the strongest historical matchups only.
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Confidence &amp; Top 5</h3>
          <p className="leading-relaxed">
            Confidence reflects sample size: <span className="text-green-500">green</span> = 30+ AB,{' '}
            <span className="text-yellow-500">yellow</span> = 15–29 AB,{' '}
            <span className="text-red-500">red</span> = 10–14 AB (visible when min AB is lowered).
            Top 5 Plays ranks by{' '}
            <span className="text-gray-400 font-mono">AVG × min(AB / 30, 1)</span>, so a .350 in
            30 AB scores higher than a .500 in 8 AB. Lowering min AB can shift the top 5, but
            smaller samples carry wider variance and are not automatically better bets.
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Optional OPS filter</h3>
          <p className="leading-relaxed">
            OPS is not the right primary metric for this prop: walks inflate it and slugging
            overweights extra-base hits. It can still work as a secondary quality check. Setting a minimum OPS filters out batters who hit for average but produce little overall offense. Enable it with the{' '}
            <span className="text-gray-400">+ OPS filter</span> button above the table.
          </p>
        </div>
      </div>

      {/* Branding */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-800">
        <p>
          Built by{' '}
          <a
            href="https://lucasreydman.github.io/cv/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 font-medium hover:text-white transition-colors"
          >Lucas Reydman</a>
          {' · '}
          Data from the{' '}
          <a
            href="https://github.com/toddrob99/MLB-StatsAPI"
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
        <p>
          &copy; {year} Lucas Reydman.{' '}
          <Link href="/disclaimer" className="text-gray-500 hover:text-gray-400 transition-colors">
            Disclaimer
          </Link>
        </p>
      </div>

    </footer>
  )
}
