import Link from 'next/link'
import { Formula, Fraction, Sup } from '@/app/components/Formula'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-12 border-t border-gray-800 pt-8 pb-10 text-xs text-gray-500 space-y-6">

      {/* Methodology - 4 columns */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
        <div className="h-full">
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Why AVG?</h3>
          <p className="leading-relaxed">
            This prop cashes on any hit, so batting average is the clearest starting point. A simple approximation is{' '}
            <Formula inline className="text-gray-400 text-[0.9rem]">
              <span>P(≥1 hit)</span>
              <span>=</span>
              <span>1 − (1 − AVG)</span>
              <Sup>n</Sup>
            </Formula>.
            {' '}Here, n is expected at-bats based on lineup slot. A strong BvP AVG does not guarantee anything, but it gives a direct baseline for comparing who has the best chance to record one hit tonight.
          </p>
        </div>
        <div className="h-full">
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Minimum requirements</h3>
          <p className="leading-relaxed">
            Only matchups with at least <span className="text-gray-400 font-mono whitespace-nowrap">15</span> career AB and a <span className="text-gray-400 font-mono whitespace-nowrap">.300+</span> BvP AVG make the board. That keeps tiny samples and coin-flip histories out of the pool. The goal is not to show every batter versus pitcher stat, but to narrow the slate to matchup histories with enough evidence to matter.
          </p>
        </div>
        <div className="h-full">
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Ranking &amp; Top 4</h3>
          <p className="leading-relaxed">
            Confidence reflects sample size in career at-bats versus that pitcher: <span className="text-red-500">red</span> = 15–17 AB,{' '}
            <span className="text-yellow-500">yellow</span> = 18–20 AB,{' '}
            <span className="text-green-500">green</span> = 21+ AB.
            Top 4 Plays ranks by{' '}
            <Formula inline className="text-gray-400 text-[0.9rem]">
              <span>AVG</span>
              <span>×</span>
              <span>min(</span>
              <Fraction top={<span>AB</span>} bottom={<span>30</span>} />
              <span>, 1)</span>
            </Formula>, so bigger samples carry more trust. Before first pitch the board shows the best current candidates. After first pitch, started plays stay tracked separately while the upcoming board still prefers the best remaining options.
          </p>
        </div>
        <div className="h-full">
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Lineups &amp; filters</h3>
          <p className="leading-relaxed">
            Confirmed lineups improve the hit chance because expected at-bats depend on batting order. Until lineups are official, the app uses a projected slot when it can. The optional <span className="text-gray-400">OPS</span> and <span className="text-gray-400">Hits</span> filters do not change the core ranking, but they help you tighten the list to the kind of profile you want to bet.
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
