'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { MatchupResult } from '@/lib/types'
import { formatTime, expectedAtBats, hitProbability, regressedAvg, resolveLineupPosition, suggestRecommendedDoubles, TOP_PLAYS_LIMIT } from '@/lib/utils'
import type { RecommendedDouble } from '@/lib/utils'
import { getLineupBadgeText, getLineupBadgeTitle } from '@/app/components/lineupBadge'
import { fmtOdds } from '@/lib/odds'
import InfoTooltip from './InfoTooltip'
import ScoringLogicContent from './ScoringLogicContent'

interface Props {
  matchups: MatchupResult[]
  overrideRecommendedDoubles?: RecommendedDouble[]
  now: number
  slateLockedAt?: string | null
}
const CONFIDENCE_COLORS = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-red-400',
}

const LINEUP_BADGE_STYLES = {
  confirmed: 'bg-gray-800 text-gray-300',
  estimated: 'bg-amber-900/40 text-amber-400',
} as const

export default function TopPlays({ matchups, overrideRecommendedDoubles, now, slateLockedAt = null }: Props) {
  const [isDesktopLogicOpen, setIsDesktopLogicOpen] = useState(true)
  const score = (m: MatchupResult) => m.avg * Math.min(m.ab / 30, 1)
  const isSlateLocked = slateLockedAt !== null
  const canBackfillLockedSlots = isSlateLocked && matchups.length < TOP_PLAYS_LIMIT

  const enriched = matchups.map(m => {
    const expectedAB = expectedAtBats(resolveLineupPosition(m))
    const hitPct = hitProbability(regressedAvg(m.avg, m.ab), expectedAB)
    return { m, expectedAB, hitPct }
  })

  const topPlays = [...enriched]
    .sort((a, b) => score(b.m) - score(a.m) || b.m.avg - a.m.avg || b.m.ab - a.m.ab)
    .slice(0, TOP_PLAYS_LIMIT)

  const internalRecommendedDoubles = suggestRecommendedDoubles(topPlays.map(item => item.m))
  const recommendedDoubles = overrideRecommendedDoubles !== undefined ? overrideRecommendedDoubles : internalRecommendedDoubles
  const hasTwoDoubles = recommendedDoubles.length > 1

  const isStarted = (leg: MatchupResult) => new Date(leg.gameTime).getTime() <= now

  const getDoubleLabel = (double: RecommendedDouble, index: number) => {
    if (double.isSmash) return 'Smash Double'
    if (!hasTwoDoubles) return 'Daily Double'
    return index === 0 ? 'Daily Double' : 'Secondary Double'
  }

  const getDoubleTooltip = () => {
    if (hasTwoDoubles) {
      return isSlateLocked
        ? canBackfillLockedSlots
          ? 'Started plays stay tracked after the slate\'s first scheduled pitch, but the upcoming board still re-ranks the best available options and can fill open slots as later lineups confirm. Recommended doubles update with that live upcoming board.'
          : 'Started plays stay tracked after the slate\'s first scheduled pitch, while the upcoming board keeps preferring the best available confirmed or estimated options. If a Smash Double exists on that live board, it takes the lead slot and the remaining two legs become the Secondary Double.'
        : 'Before first pitch, the board shows the current Top 4 candidates, including estimated-lineup plays when lineups are not posted yet. The board keeps preferring the best available options as lineups firm up.'
    }

    return isSlateLocked
      ? canBackfillLockedSlots
        ? 'Started plays stay tracked after first pitch, but the upcoming board still re-ranks the best available options and can fill open slots as later lineups confirm. Until then, the board shows the strongest available 2-leg parlay from the live upcoming board.'
        : 'Started plays stay tracked after first pitch, while the upcoming board keeps preferring the best available options. When fewer than four live upcoming plays qualify, the board shows the strongest available 2-leg parlay only.'
      : 'Before first pitch, the board shows the current Top 4 candidates, including estimated-lineup plays when lineups are not posted yet. The board keeps preferring the best available options as lineups firm up.'
  }

  const getDoubleSubcopy = (double: RecommendedDouble, index: number) => {
    if (double.isSmash) return 'Top qualifying smash pair from the locked Top 4.'
    if (!hasTwoDoubles) return 'Best available 2-leg parlay from the locked Top 4.'
    if (recommendedDoubles[0]?.isSmash && index === 1) return 'Second-best optional pair from the locked Top 4 after the Smash Double.'
    return index === 0 ? 'Top non-smash pair from the locked Top 4.' : 'Optional second pair from the locked Top 4.'
  }

  const header = (
    <div className="mb-4">
      <div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Top 4 Plays</h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {isSlateLocked
              ? canBackfillLockedSlots
                ? 'Started plays stay tracked after first pitch, but the upcoming board still keeps the best available four options and can fill open slots as later lineups confirm.'
                : 'Started plays stay tracked after first pitch while the upcoming board keeps preferring the best available options.'
              : 'Before first pitch, the board shows the current Top 4 candidates. Estimated-lineup plays can appear until official lineups post, and the board keeps preferring the best available options as confirmations come in.'}
          </p>
        </div>
      </div>
      <Link
        href="/scoring-logic"
        className="sm:hidden inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
      >
        <span>Show Me the Math</span>
        <span aria-hidden="true">→</span>
      </Link>
      <div className="relative hidden overflow-hidden rounded-[1.75rem] border border-slate-700/90 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.10),_transparent_24%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(3,10,28,0.94))] p-5 text-slate-200 shadow-[0_20px_60px_rgba(2,6,23,0.32)] sm:block">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div />
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-200">
            Scoring and Selection Logic
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsDesktopLogicOpen(open => !open)}
              aria-label={isDesktopLogicOpen ? 'Collapse scoring and selection logic' : 'Expand scoring and selection logic'}
              className="group inline-flex items-center gap-2 rounded-full border border-slate-600/70 bg-slate-950/75 px-3 py-2 text-slate-300 shadow-[0_10px_30px_rgba(2,6,23,0.28)] backdrop-blur-sm transition-all duration-300 hover:border-sky-400/50 hover:bg-slate-900/95 hover:text-white"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300 transition-colors duration-300 group-hover:text-white">
                {isDesktopLogicOpen ? 'Collapse' : 'Expand'}
              </span>
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-out ${isDesktopLogicOpen ? 'rotate-180' : 'rotate-0'}`}
                aria-hidden="true"
              >
                <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className={`grid transition-all duration-500 ease-out ${isDesktopLogicOpen ? 'mt-4 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <ScoringLogicContent />
          </div>
        </div>
      </div>
    </div>
  )

  if (topPlays.length === 0) {
    return (
      <div className="mb-4 rounded-lg bg-gray-900 p-4">
        {header}
        <p className="text-sm text-gray-500">
          {isSlateLocked
            ? 'No tracked Top 4 plays are still upcoming for this date.'
            : 'No Top 4 candidates are currently upcoming for this date.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-lg bg-gray-900 p-4">
      {header}
      <ol className="-mx-4 divide-y divide-gray-800/40 px-0 sm:mx-0 sm:space-y-2 sm:divide-y-0 sm:px-0">
        {topPlays.map(({ m, expectedAB, hitPct }, i) => {
          return (
          <li key={`${m.batterId}-${m.pitcherId}-${m.gameTime}`} className="px-4 py-2 sm:px-0 sm:py-0">
            <div className="sm:hidden">
              <div className="flex items-center gap-2">
                <span className="w-4 shrink-0 font-mono text-xs text-sky-400">{i + 1}.</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{m.batterName}</span>
                <span className={`shrink-0 font-mono text-sm font-bold ${CONFIDENCE_COLORS[m.confidence]}`}>{m.avg.toFixed(3)}</span>
              </div>
              <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2 pl-6">
                <span className="min-w-0 flex-1 truncate text-xs text-gray-400">vs {m.pitcherName}</span>
                <span
                  className={`inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${LINEUP_BADGE_STYLES[m.lineupSource]}`}
                  title={getLineupBadgeTitle(m)}
                >
                  {getLineupBadgeText(m)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 pl-6 text-[11px]">
                <span className="shrink-0 font-mono text-gray-400">Est. {expectedAB.toFixed(1)} AB</span>
                <span className="shrink-0 text-xs font-semibold text-green-300">{(hitPct * 100).toFixed(2)}%</span>
                {m.consensusHitOddsAmerican != null && (
                  <span className="shrink-0 font-mono text-xs text-gray-500" title={m.bookCount ? `${m.bookCount} books` : undefined}>
                    {fmtOdds(m.consensusHitOddsAmerican)}
                  </span>
                )}
                <span className="shrink-0 text-xs text-gray-600">{formatTime(m.gameTime)}</span>
              </div>
            </div>
            <div className="hidden items-baseline gap-3 text-sm sm:flex">
              <span className="w-4 font-mono text-sky-400">{i + 1}.</span>
              <span className="font-medium text-white">{m.batterName}</span>
              <span
                className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${LINEUP_BADGE_STYLES[m.lineupSource]}`}
                title={getLineupBadgeTitle(m)}
              >
                {getLineupBadgeText(m)}
              </span>
              <span className="text-gray-400">vs {m.pitcherName}</span>
              <span className={`font-mono font-bold ${CONFIDENCE_COLORS[m.confidence]}`}>{m.avg.toFixed(3)} AVG</span>
              <span className="font-mono text-gray-500">{m.ab} AB</span>
              <span className="select-none text-gray-700">·</span>
              <span className="font-mono text-gray-400">Est. {expectedAB.toFixed(1)} AB</span>
              <span className="font-semibold text-green-300">{(hitPct * 100).toFixed(2)}%</span>
              {m.consensusHitOddsAmerican != null && (
                <>
                  <span className="select-none text-gray-700">·</span>
                  <span className="font-mono text-sm text-gray-400" title={m.bookCount ? `${m.bookCount} books` : undefined}>
                    {fmtOdds(m.consensusHitOddsAmerican)}
                  </span>
                </>
              )}
              <span className="ml-auto text-xs text-gray-600">{formatTime(m.gameTime)}</span>
            </div>
          </li>
          )
        })}
      </ol>

      {recommendedDoubles.length > 0 ? (
        <div className="mt-4 space-y-3">
          {recommendedDoubles.map((double, index) => {
            const anyLegStarted = isStarted(double.first) || isStarted(double.second)
            const unconfirmedLegs = [double.first, double.second].filter(leg => leg.lineupSource === 'estimated').length
            const toneClasses = double.isSmash
              ? 'border-orange-500/50 bg-orange-950/20'
              : index === 0
                ? 'border-gray-800 bg-gray-950'
                : 'border-slate-800 bg-slate-950/80'
            const accentClasses = double.isSmash
              ? 'text-orange-400'
              : index === 0
                ? 'text-yellow-400'
                : 'text-slate-300'

            return (
              <div key={`${double.first.batterId}-${double.second.batterId}-${index}`} className={`rounded-lg border p-3 text-sm ${toneClasses}`}>
                <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <div className={`flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider ${accentClasses}`}>
                    {getDoubleLabel(double, index)}
                    <InfoTooltip width="w-64" align="left" text={getDoubleTooltip()} />
                  </div>
                  <div className={`text-[10px] ${anyLegStarted ? 'text-gray-500' : double.isSmash ? 'text-orange-400/70' : 'text-gray-500'}`}>
                    {anyLegStarted || (isSlateLocked && !canBackfillLockedSlots)
                      ? 'Locked from the official Top 4 at first pitch.'
                      : isSlateLocked
                        ? 'Locked plays stay fixed; open slots can still fill on later confirmations.'
                        : getDoubleSubcopy(double, index)}
                  </div>
                </div>

                <div className="mt-2 space-y-2">
                  {([
                    { leg: double.first, prob: double.firstProbability },
                    { leg: double.second, prob: double.secondProbability },
                  ] as const).map(({ leg, prob }, legIndex) => {
                    const legStarted = isStarted(leg)
                    return (
                      <div key={leg.batterId} className={legStarted ? 'opacity-50' : ''}>
                        <div className="hidden items-baseline gap-3 text-sm sm:flex">
                          <span className="w-4 shrink-0 font-mono text-xs text-gray-500">#{legIndex + 1}</span>
                          <span className="font-medium text-white">{leg.batterName}</span>
                          <span className="text-xs text-gray-500">vs {leg.pitcherName}</span>
                          {legStarted && <span className="rounded border border-amber-400/40 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide leading-none text-amber-400">In Progress</span>}
                          <span className={`font-mono font-bold ${CONFIDENCE_COLORS[leg.confidence]}`}>{leg.avg.toFixed(3)} AVG</span>
                          <span className={`font-mono text-xs ${double.isSmash ? 'text-orange-300' : 'text-gray-500'}`}>{leg.ops.toFixed(3)} OPS</span>
                          <span className="font-mono text-xs text-gray-600">{leg.ab} AB</span>
                          <span className="text-xs font-semibold text-green-300">{(prob * 100).toFixed(2)}% hit chance</span>
                          {leg.consensusHitOddsAmerican != null && (
                            <>
                              <span className="select-none text-gray-700">·</span>
                              <span className="font-mono text-xs text-gray-400" title={leg.bookCount ? `${leg.bookCount} books` : undefined}>
                                {fmtOdds(leg.consensusHitOddsAmerican)}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="sm:hidden">
                          <div className="flex items-center gap-2">
                            <span className="w-4 shrink-0 font-mono text-xs text-gray-500">#{legIndex + 1}</span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{leg.batterName}</span>
                            <span className={`shrink-0 font-mono text-sm font-bold ${CONFIDENCE_COLORS[leg.confidence]}`}>{leg.avg.toFixed(3)} AVG</span>
                          </div>
                          <div className="mt-0.5 pl-6">
                            <span className="text-xs text-gray-500">vs {leg.pitcherName}</span>
                            {legStarted && <span className="ml-2 rounded border border-amber-400/40 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide leading-none text-amber-400">In Progress</span>}
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-3 pl-6">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className={`shrink-0 font-mono text-xs ${double.isSmash ? 'text-orange-300' : 'text-gray-400'}`}>{leg.ops.toFixed(3)} OPS</span>
                              <span className="shrink-0 font-mono text-xs text-gray-500">{leg.h}/{leg.ab}</span>
                            </div>
                            <span className="shrink-0 text-right text-xs font-semibold text-green-300">{(prob * 100).toFixed(2)}% hit chance</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className={`mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t pt-2 ${double.isSmash ? 'border-orange-500/20' : 'border-gray-800'}`}>
                  <span className="font-semibold text-green-300">Combined: {(double.combinedProbability * 100).toFixed(2)}%</span>
                  {double.consensusParlayOddsAmerican != null && <span className="font-mono text-xs text-sky-300">Odds: {fmtOdds(double.consensusParlayOddsAmerican)}</span>}
                  {anyLegStarted && <span className="text-xs text-gray-500">This card remains fixed from the official Top 4 locked at first pitch.</span>}
                </div>

                {!anyLegStarted && unconfirmedLegs > 0 && (
                  <div className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-500/70">
                    <span className="mt-px shrink-0">⚠</span>
                    <span>
                      {unconfirmedLegs === 2
                        ? 'Lineups not confirmed yet. Hit chance will update once batting order is set.'
                        : 'One lineup is not confirmed yet. Hit chance for that leg may shift once batting order is set.'}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Daily Double</span>
            <InfoTooltip width="w-64" text="When four Top 4 plays qualify, the app can show two doubles. If any pair qualifies as a Smash Double, that pair is shown first and the remaining two legs become the Secondary Double. With only two or three qualified plays, the app shows just the strongest available pair as the Daily Double." />
          </div>
          <p className="text-gray-500">{topPlays.length < 2 ? 'Not enough qualified plays to form a Daily Double. Fewer than 2 matchups meet the 15 AB / .300 AVG requirements today.' : 'No Daily Double is available from the current upcoming slate.'}</p>
        </div>
      )}
    </div>
  )
}
