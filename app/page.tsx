import Link from 'next/link'
import type { Metadata } from 'next'
import ClientShell from './components/ClientShell'
import Footer from './components/Footer'
import { getSiteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Batter vs Pitcher Stats and MLB Hit Props',
  description:
    'Daily batter versus pitcher stats, BVP betting angles, and MLB hit props ranked by career matchup data. Find MLB BVP stats, official Top 4 plays, and recommended doubles in one board.',
  alternates: {
    canonical: '/',
  },
}

const siteUrl = getSiteUrl()

const faqItems = [
  {
    question: 'What does BVP mean in MLB betting?',
    answer:
      'BVP means batter versus pitcher. In MLB betting, BVP stats show how a hitter has performed historically against the starting pitcher he is facing today. This site focuses on career BvP stats that matter for the player to record a hit market.',
  },
  {
    question: 'How does batter versus pitcher betting work?',
    answer:
      'Batter versus pitcher betting usually means using matchup history as one input when betting MLB hit props, total bases, or same-game parlays. MLB BvP Betting ranks qualified matchups by batting average weighted by sample size so you can compare strong historical edges quickly.',
  },
  {
    question: 'Why use BVP stats for MLB hit props?',
    answer:
      'BVP stats are useful for MLB hit props because any hit cashes the bet. Career batting average, hit count, and sample size versus a specific pitcher can be more directly relevant to a 1+ hits prop than broader power stats alone.',
  },
  {
    question: 'What makes these MLB batter versus pitcher stats different?',
    answer:
      'This board filters out weak samples, attaches consensus sportsbook odds, adjusts hit probability for lineup position, and freezes the official Top 4 at first pitch so the tracked plays stay consistent throughout the slate.',
  },
]

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MLB BvP Betting',
    url: siteUrl,
    description:
      'Daily MLB batter versus pitcher stats and BVP betting board for hit props, ranked by career matchup data.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'MLB Batter vs Pitcher Stats and Hit Props',
    url: siteUrl,
    description:
      'Daily batter versus pitcher stats, BVP betting angles, and MLB hit props ranked by career batting average weighted by sample size.',
    isPartOf: {
      '@type': 'WebSite',
      name: 'MLB BvP Betting',
      url: siteUrl,
    },
    about: [
      { '@type': 'Thing', name: 'Batter versus pitcher stats' },
      { '@type': 'Thing', name: 'BVP stats' },
      { '@type': 'Thing', name: 'MLB hit props' },
      { '@type': 'Thing', name: 'BVP betting' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  },
]

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">MLB BvP Betting</h1>
        <p className="text-gray-400 text-sm mt-1 max-w-full text-balance">
          Daily <span className="text-white font-semibold">batter versus pitcher stats</span> for the <span className="text-white font-semibold">Player to Record a Hit</span> prop (1+ hits / over 0.5 hits).
          Matchups are ranked by career BvP batting average weighted by sample size, with consensus odds from major U.S. sportsbooks attached to each play.
        </p>
      </header>

      <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xs text-slate-300 space-y-3 leading-5">
        <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-semibold">How to use this system</div>
        <p>
          <span className="text-white font-semibold">The page stays current automatically.</span>
          <span className="text-slate-300"> Data refreshes every 5 minutes, and faster while any lineup is still estimated. Before first pitch, the board shows the current Top 4 candidates, including estimated-lineup plays when official lineups are not posted yet. At the slate&apos;s first scheduled pitch, the official Top 4 locks from the confirmed plays available at that cutoff. Once those games start, players move to In Progress, then Settled with a final result. Check back after lineups post (usually 3–4 hours before first pitch) for exact hit chances.</span>
        </p>
        <p>
          <span className="text-yellow-400 font-semibold">Best bet: take the recommended double.</span>
          <span className="text-slate-300"> When all four locked plays populate, the board can give you two 2-leg parlays, but the first non-smash card is the Daily Double and is the main recommendation. If only two or three locked plays qualify, it falls back to the strongest single double. Before first pitch, these are provisional pairings from the current candidate board. After the lock, they stay fixed to the official Top 4.</span>
        </p>
        <p>
          <span className="text-orange-400 font-semibold">If it says Smash Double, even better.</span>
          <span className="text-slate-300"> A Smash Double is the lead card whenever both legs have a career OPS above .950 and at least 7 hits against their pitcher. The hit floor ensures the high OPS reflects real contact, not a small-sample fluke. When one exists, it takes priority over the Daily Double and the remaining two top plays form the Secondary Double.</span>
        </p>
        <p>
          <span className="text-slate-300 font-semibold">Want more action? Take the Secondary Double!</span>
          <span className="text-slate-300"> When four locked plays qualify, the board can show a second 2-leg parlay alongside the lead card. It is the next-best split of the official Top 4 and is optional, not the main recommendation.</span>
        </p>
        <p>
          <span className="text-white font-semibold">Prefer lower risk?</span>
          <span className="text-slate-300"> Pick your favorites from the Top 4 and take them as singles. Less risk per bet than a parlay, with a smaller payout to match. The list is capped at four on purpose so the board stays focused on the strongest edges instead of drifting into weaker volume plays.</span>
        </p>
        <p>
          <span className="text-green-300 font-semibold">Confirmed lineups make the hit chance more accurate.</span>
          <span className="text-slate-300"> Hit chance uses expected at-bats, which adjusts by lineup position. Until lineups are official, the app projects a batting slot from recent lineup history when it can. Plays marked </span>
          <span className="text-white font-semibold">confirmed</span>
          <span className="text-slate-300"> use the exact number. Lineups usually post 3–4 hours before first pitch.</span>
        </p>
        <p>
          <span className="text-sky-400 font-semibold">The edge is statistical, not guaranteed.</span>
          <span className="text-slate-300"> BvP averages reflect career history, not a prediction. Use this as one input among many, and only bet what you&apos;re comfortable losing.</span>
        </p>
      </div>

      <ClientShell />

      <section className="mb-8 mt-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-slate-300 shadow-[0_20px_50px_rgba(2,6,23,0.22)]">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">MLB batter versus pitcher stats for daily hit props</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              MLB BvP Betting is built for people searching for <span className="text-slate-200">batter versus pitcher stats</span>, <span className="text-slate-200">BVP stats</span>, and
              <span className="text-slate-200"> MLB hit props</span> in one place. The board pulls career hitter versus pitcher matchup data for today&apos;s slate, filters out weak samples, and ranks the best MLB BVP spots by batting average weighted by sample size.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              If you are looking for <span className="text-slate-200">MLB BVP betting</span> angles, the site is specifically designed around the 1+ hit market. It attaches consensus odds, flags confirmed versus estimated lineups, and keeps the official Top 4 plays fixed at first pitch so the tracked board does not drift after lock.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">How this helps with batter versus pitcher betting</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Batter versus pitcher betting works best when the matchup history is strong enough to matter. That is why the board only shows hitters with at least <span className="font-mono text-slate-200">15 AB</span> and a
              <span className="font-mono text-slate-200"> .300 AVG</span> against the opposing starter. Once a matchup qualifies, the app adds hit probability context and recommended doubles for bettors who want a focused card instead of a giant list.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              The methodology is fully transparent. You can review the <Link href="/scoring-logic" className="text-sky-300 transition-colors hover:text-sky-200">BvP scoring guide</Link> to see how the model ranks plays, then use the
              <Link href="/disclaimer" className="ml-1 text-sky-300 transition-colors hover:text-sky-200">disclaimer</Link> as a reminder that MLB hit props are still probabilistic, not guaranteed outcomes.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6">
          <h2 className="text-lg font-semibold tracking-tight text-white">FAQ</h2>
          <div className="mt-4 space-y-3">
            {faqItems.map(item => (
              <details key={item.question} className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-100">{item.question}</summary>
                <p className="mt-2 text-sm leading-7 text-slate-400">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
