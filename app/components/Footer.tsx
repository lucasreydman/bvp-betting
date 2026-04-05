import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-12 border-t border-gray-800 pt-8 pb-10 text-xs text-gray-500 space-y-6">

      {/* Methodology - 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Why AVG?</h3>
          <p className="leading-relaxed">
            This prop wins on any hit, from a single through a homer, so slugging and walks don&apos;t factor in. AVG is the direct measure:{' '}
            <span className="text-gray-400 font-mono">P(1+ hit) = 1 − (1 − AVG)ⁿ</span> where n is
            expected at-bats based on the batter&apos;s confirmed lineup slot or, before lineups post, a projected slot from recent lineup history. A .300 BvP AVG still works out to roughly a 79–82% hit probability, above typical book lines of 60–63%.
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Minimum requirements</h3>
          <p className="leading-relaxed">
            Only matchups with at least 15 career AB and a .300+ BvP AVG are shown. Below 15 AB
            the margin of error (±.145) is wide enough that a single at-bat can swing the average
            significantly. The .300 floor ensures every listed matchup reflects a historically
            meaningful edge over the pitcher.
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Confidence &amp; Top 5</h3>
          <p className="leading-relaxed">
            Confidence reflects sample size: <span className="text-green-500">green</span> = 25+ AB,{' '}
            <span className="text-yellow-500">yellow</span> = 20–24 AB,{' '}
            <span className="text-red-500">red</span> = 15–19 AB.
            Top 5 Plays ranks by{' '}
            <span className="text-gray-400 font-mono">AVG × min(AB / 30, 1)</span>, so a .350 in 30 AB
            scores higher than a .500 in 15 AB. Larger samples carry less variance and are generally more reliable at the same AVG.
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Optional filters</h3>
          <p className="leading-relaxed">
            Both are optional and don&apos;t change the core logic. They narrow the list for personal conviction.{' '}
            <span className="text-gray-400">OPS</span> filters out batters who hit for average but produce little overall offense; walks and slugging matter less here than raw hit rate.{' '}
            <span className="text-gray-400">Hits</span> targets batters with more demonstrated contact against the pitcher, beyond just AVG and AB.
          </p>
        </div>
      </div>

      {/* Branding */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-800">
        <p>
          Built by{' '}
          <a
            href="https://lucasreydman.xyz/"
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
          &copy; {year} Lucas Reydman. All rights reserved.{' '}
          <Link href="/disclaimer" className="text-gray-400 hover:text-white transition-colors">
            Disclaimer
          </Link>
        </p>
      </div>

    </footer>
  )
}
