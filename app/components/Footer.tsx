import Link from 'next/link'
import { Formula, Fraction, Sup } from '@/app/components/Formula'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-12 border-t border-gray-800 pt-8 pb-10 text-xs text-gray-500 space-y-6">

      {/* Methodology - 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Why AVG?</h3>
          <p className="leading-relaxed">
            This prop wins on any hit, so slugging and walks don&apos;t factor in. AVG gives the clearest baseline for hit probability. One simple approximation is{' '}
            <Formula inline className="text-gray-400 text-[0.9rem]">
              <span>P(≥1 hit)</span>
              <span>=</span>
              <span>1 − (1 − AVG)</span>
              <Sup>n</Sup>
            </Formula>.
            {' '}Here, n is expected at-bats from the confirmed lineup slot or a projected slot based on recent lineup history. A .300 BvP AVG implies about{' '}
            <span className="text-gray-400 font-mono whitespace-nowrap">79–82%</span>{' '}
            to get a hit versus typical book lines around{' '}
            <span className="text-gray-400 font-mono whitespace-nowrap">60–63%</span>.
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Minimum requirements</h3>
          <p className="leading-relaxed">
            Only matchups with at least <span className="text-gray-400 font-mono whitespace-nowrap">15</span> career AB and a <span className="text-gray-400 font-mono whitespace-nowrap">.300+</span> BvP AVG are shown. Below 15 AB
            the margin of error <span className="text-gray-400 font-mono whitespace-nowrap">(±.145)</span> is wide enough that a single at-bat can swing the average
            significantly. The .300 floor ensures every listed matchup reflects a historically meaningful edge over the pitcher.
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Confidence &amp; Top 4</h3>
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
            </Formula>, so a .350 in 30 AB
            scores higher than a .500 in 15 AB. Larger samples carry less variance and are generally more reliable at the same AVG. Before first pitch the board shows only confirmed candidates, and at first pitch the official Top 4 locks for tracking.
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
