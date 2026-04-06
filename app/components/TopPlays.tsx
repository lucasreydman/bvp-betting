import type { ReactNode } from 'react'
import type { MatchupResult } from '@/lib/types'
import { formatTime, expectedAtBats, hitProbability, regressedAvg, resolveLineupPosition, suggestDailyDouble } from '@/lib/utils'
import type { DailyDouble } from '@/lib/utils'
import { getLineupBadgeText, getLineupBadgeTitle } from '@/app/components/lineupBadge'
import { fmtOdds } from '@/lib/odds'
import InfoTooltip from './InfoTooltip'
import { Formula, Fraction, MATH_FONT_STACK, Sup } from './Formula'

interface Props {
  matchups: MatchupResult[]
  overrideDailyDouble?: DailyDouble | null
  now: number
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

function FormulaBlock({
  title,
  accent,
  children,
}: {
  title: string
  accent: string
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800/90 bg-slate-950/70 p-3.5">
      <div className={`mb-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] ${accent}`}>{title}</div>
      <div className="flex flex-1 flex-col gap-2.5 text-slate-200 leading-[1.45]">{children}</div>
    </div>
  )
}

export default function TopPlays({ matchups, overrideDailyDouble, now }: Props) {
  const score = (m: MatchupResult) => m.avg * Math.min(m.ab / 30, 1)

  const enriched = matchups.map(m => {
    const expectedAB = expectedAtBats(resolveLineupPosition(m))
    const hitPct = hitProbability(regressedAvg(m.avg, m.ab), expectedAB)
    return { m, expectedAB, hitPct }
  })

  const top5 = [...enriched]
    .sort((a, b) => score(b.m) - score(a.m) || b.m.avg - a.m.avg || b.m.ab - a.m.ab)
    .slice(0, 5)

  const internalDailyDouble = suggestDailyDouble(top5.map(item => item.m))
  const dailyDouble = overrideDailyDouble !== undefined ? overrideDailyDouble : internalDailyDouble

  const isStarted = (leg: MatchupResult) => new Date(leg.gameTime).getTime() <= now
  const anyLegStarted = dailyDouble ? isStarted(dailyDouble.first) || isStarted(dailyDouble.second) : false
  const unconfirmedLegs = dailyDouble
    ? [dailyDouble.first, dailyDouble.second].filter(leg => leg.lineupSource === 'estimated').length
    : 0

  const header = (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Top 5 Plays</h2>
      </div>
      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xs text-slate-300 sm:hidden">
        <div className="mb-3 text-[11px] uppercase tracking-[0.25em] text-slate-400 font-semibold">How Top Plays are ranked</div>
        <div className="space-y-3 leading-5">
          <p>
            <span className="text-sky-400 font-semibold">Primary score:</span>
            <span className="text-sky-400"> career batting average against this pitcher, weighted by how many at-bats back it up. More at-bats = more trust in the number.</span>
            <InfoTooltip width="w-64" align="left" text="For singles bets, go by primary score. It directly rewards both a strong average and a large sample. The higher the score, the more reliable the historical edge. Hit chance % is better for parlay legs, where raw probability matters more than sample confidence." />
          </p>
          <Formula className="pl-3 text-slate-300">
            <span>score</span>
            <span>=</span>
            <span>AVG</span>
            <span>×</span>
            <span>confidence</span>
          </Formula>
          <Formula className="pl-3 text-slate-300">
            <span>confidence</span>
            <span>=</span>
            <span>min(</span>
            <Fraction top={<span>AB</span>} bottom={<span>30</span>} />
            <span>, 1)</span>
          </Formula>
          <p>
            <span className="text-green-300 font-semibold">Hit chance %:</span>
            <span className="text-green-300"> estimated chance of ≥1 hit using a regressed AVG and expected at-bats.</span>
            <InfoTooltip width="w-72" text="Hit chance uses a regressed AVG that pulls toward .320 (the conditional mean of pre-filtered matchups) based on sample size. Smaller samples get pulled more. A higher raw AVG matters more here than ABs, which is the opposite of the ranking score (AVG × confidence). This is why a lower-ranked play can have a higher hit % and get picked for the parlay." />
          </p>
          <div className="pl-3 text-slate-300 sm:hidden" style={{ fontFamily: '"Cambria Math", "STIX Two Text", "Times New Roman", serif' }}>
            <div className="text-[0.88rem] leading-5">adjusted AVG =</div>
            <Formula className="mt-1 text-slate-300">
              <Fraction top={<span>AB</span>} bottom={<span>AB + 50</span>} />
              <span>×</span>
              <span>AVG</span>
              <span>+</span>
              <Fraction top={<span>50</span>} bottom={<span>AB + 50</span>} />
              <span>×</span>
              <span>0.320</span>
            </Formula>
          </div>
          <Formula className="pl-3 text-slate-300 hidden sm:flex">
            <span>adjusted AVG</span>
            <span>=</span>
            <Fraction top={<span>AB</span>} bottom={<span>AB + 50</span>} />
            <span>×</span>
            <span>AVG</span>
            <span>+</span>
            <Fraction top={<span>50</span>} bottom={<span>AB + 50</span>} />
            <span>×</span>
            <span>0.320</span>
          </Formula>
          <Formula className="pl-3 text-slate-300">
            <span>P(≥1 hit)</span>
            <span>=</span>
            <span>1 − (1 − adjusted AVG)</span>
            <Sup>expected at-bats</Sup>
          </Formula>
        </div>
      </div>
      <div
        className="hidden sm:block overflow-hidden rounded-[1.75rem] border border-slate-700/90 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.10),_transparent_28%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(2,6,23,0.92))] p-5 text-slate-200"
        style={{ fontFamily: MATH_FONT_STACK }}
      >
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Top 5 formulas</div>
            <div className="mt-1 text-lg text-white">Scoring and selection logic used in this card</div>
          </div>
          <div className="max-w-sm shrink-0 text-right text-[11px] leading-5 text-slate-400">
            <div>AVG = career BvP batting average</div>
            <div>AB = career at-bats vs this pitcher</div>
            <div>P = probability of at least one hit</div>
            <div>E[AB] = expected at-bats from batting slot</div>
          </div>
        </div>

        <div className="grid auto-rows-fr gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <FormulaBlock title="Ranking" accent="text-sky-300">
            <Formula className="text-slate-100 leading-6">
              <span>score</span>
              <span>=</span>
              <span>AVG</span>
              <span>×</span>
              <span>confidence</span>
            </Formula>
            <Formula className="text-slate-300 leading-6">
              <span>confidence</span>
              <span>=</span>
              <span>min(</span>
              <Fraction top={<span>AB</span>} bottom={<span>30</span>} />
              <span>, 1)</span>
            </Formula>
            <Formula className="text-slate-400 text-[0.8rem] leading-5">
              <span>sort</span>
              <span>=</span>
              <span>score ↓, AVG ↓, AB ↓</span>
            </Formula>
          </FormulaBlock>

          <FormulaBlock title="Regression" accent="text-emerald-300">
            <Formula className="text-slate-100 leading-6">
              <span>adjusted AVG</span>
              <span>=</span>
              <Fraction top={<span>AB</span>} bottom={<span>AB + 50</span>} />
              <span>×</span>
              <span>AVG</span>
              <span>+</span>
              <Fraction top={<span>50</span>} bottom={<span>AB + 50</span>} />
              <span>×</span>
              <span>0.320</span>
            </Formula>
            <Formula className="text-slate-400 text-[0.8rem] leading-5">
              <span>w</span>
              <span>=</span>
              <Fraction top={<span>AB</span>} bottom={<span>AB + 50</span>} />
            </Formula>
            <Formula className="text-slate-400 text-[0.8rem] leading-5">
              <span>adjusted AVG</span>
              <span>=</span>
              <span>w × AVG + (1 − w) × 0.320</span>
            </Formula>
          </FormulaBlock>

          <FormulaBlock title="Expected At-Bats" accent="text-amber-300">
            <div className="text-[0.88rem] leading-5 text-slate-100">
              <div>slot = confirmed slot</div>
              <div>or estimated slot</div>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-[0.84rem] leading-5 text-slate-300 content-start">
              <div>E[AB] = 4.45, slot ≤ 3</div>
              <div>E[AB] = 4.25, slot = 4</div>
              <div>E[AB] = 4.05, 5 ≤ slot ≤ 6</div>
              <div>E[AB] = 3.85, slot ≥ 7</div>
            </div>
          </FormulaBlock>

          <FormulaBlock title="Hit Chance" accent="text-lime-300">
            <Formula className="text-slate-100 leading-6">
              <span>P(≥1 hit)</span>
              <span>=</span>
              <span>1 − (1 − adjusted AVG)</span>
              <Sup>E[AB]</Sup>
            </Formula>
            <Formula className="text-slate-400 text-[0.8rem] leading-5">
              <span>Top 5 hit %</span>
              <span>=</span>
              <span>100 × P(≥1 hit)</span>
            </Formula>
          </FormulaBlock>

          <FormulaBlock title="Recommended Double" accent="text-yellow-300">
            <Formula className="text-slate-100 leading-6">
              <span>P(double)</span>
              <span>=</span>
              <span>P₁ × P₂</span>
            </Formula>
            <Formula className="text-slate-300 leading-6">
              <span>best double</span>
              <span>=</span>
              <span>arg max</span>
              <span>(P₁ × P₂)</span>
              <span>, legs from Top 5</span>
            </Formula>
            <Formula className="text-slate-400 text-[0.8rem] leading-5">
              <span>P₁, P₂</span>
              <span>=</span>
              <span>the two legs&apos; hit probabilities</span>
            </Formula>
          </FormulaBlock>

          <FormulaBlock title="Smash Double" accent="text-orange-300">
            <div className="space-y-0.5 text-[0.9rem] leading-6 text-slate-100">
              <div>smash = (OPS₁ &gt; .950 ∧ H₁ ≥ 7)</div>
              <div className="pl-16 text-slate-300">and</div>
              <div className="pl-14">(OPS₂ &gt; .950 ∧ H₂ ≥ 7)</div>
            </div>
          </FormulaBlock>
        </div>
      </div>
    </div>
  )

  if (top5.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 mb-4">
        {header}
        <p className="text-gray-500 text-sm">No upcoming games with data for this date.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      {header}
      <ol className="divide-y divide-gray-800/40 sm:divide-y-0 sm:space-y-2 -mx-4 sm:mx-0 px-0 sm:px-0">
        {top5.map(({ m, expectedAB, hitPct }, i) => (
          <li key={`${m.batterId}-${m.pitcherId}-${m.gameTime}`} className="px-4 py-2 sm:px-0 sm:py-0">
            {/* Mobile: 2-row layout */}
            <div className="sm:hidden">
              <div className="flex items-center gap-2">
                <span className="text-sky-400 w-4 shrink-0 font-mono text-xs">{i + 1}.</span>
                <span className="text-white font-medium text-sm flex-1 min-w-0 truncate">{m.batterName}</span>
                <span className="text-gray-400 text-[11px] shrink-0 font-mono">Est. {expectedAB.toFixed(1)} AB</span>
                <span className={`font-mono font-bold text-sm shrink-0 ${CONFIDENCE_COLORS[m.confidence]}`}>
                  {m.avg.toFixed(3)}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-6 mt-0.5 min-w-0">
                <span className="text-gray-400 text-xs flex-1 min-w-0 truncate">vs {m.pitcherName}</span>
                <span
                  className={`inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${LINEUP_BADGE_STYLES[m.lineupSource]}`}
                  title={getLineupBadgeTitle(m)}
                >
                  {getLineupBadgeText(m)}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-6 mt-1">
                <span className="text-green-300 text-xs shrink-0 font-semibold">{(hitPct * 100).toFixed(2)}%</span>
                {m.consensusHitOddsAmerican != null && (
                  <span
                    className="text-gray-500 text-xs shrink-0 font-mono"
                    title={m.bookCount ? `${m.bookCount} books` : undefined}
                  >
                    {fmtOdds(m.consensusHitOddsAmerican)}
                  </span>
                )}
                <span className="text-gray-600 text-xs shrink-0">{formatTime(m.gameTime)}</span>
              </div>
            </div>
            {/* Desktop: single row */}
            <div className="hidden sm:flex items-baseline gap-3 text-sm">
              <span className="text-sky-400 w-4 font-mono">{i + 1}.</span>
              <span className="text-white font-medium">{m.batterName}</span>
              <span
                className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${LINEUP_BADGE_STYLES[m.lineupSource]}`}
                title={getLineupBadgeTitle(m)}
              >
                {getLineupBadgeText(m)}
              </span>
              <span className="text-gray-400">vs {m.pitcherName}</span>
              <span className={`font-mono font-bold ${CONFIDENCE_COLORS[m.confidence]}`}>
                {m.avg.toFixed(3)} AVG
              </span>
              <span className="text-gray-500 font-mono">{m.ab} AB</span>
              <span className="text-gray-700 select-none">·</span>
              <span className="text-gray-400 font-mono">Est. {expectedAB.toFixed(1)} AB</span>
              <span className="text-green-300 font-semibold">{(hitPct * 100).toFixed(2)}%</span>
              {m.consensusHitOddsAmerican != null && (
                <>
                  <span className="text-gray-700 select-none">·</span>
                  <span
                    className="text-gray-400 font-mono text-sm"
                    title={m.bookCount ? `${m.bookCount} books` : undefined}
                  >
                    {fmtOdds(m.consensusHitOddsAmerican)}
                  </span>
                </>
              )}
              <span className="text-gray-600 text-xs ml-auto">{formatTime(m.gameTime)}</span>
            </div>
          </li>
        ))}
      </ol>

      {dailyDouble ? (
        <div className={`mt-4 rounded-lg border p-3 text-sm ${dailyDouble.isSmash ? 'border-orange-500/50 bg-orange-950/20' : 'border-gray-800 bg-gray-950'}`}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-2">
            <div className={`flex items-center gap-1 whitespace-nowrap uppercase tracking-wider text-[10px] font-semibold ${dailyDouble.isSmash ? 'text-orange-400' : 'text-yellow-400'}`}>
              {dailyDouble.isSmash ? 'Smash Double' : 'Recommended Double'}
              <InfoTooltip width="w-56" align="left" text="These legs are chosen from the filtered Top 5 upcoming plays by highest combined hit probability, not by list rank. Ranking uses AVG × confidence, while hit chance uses regressed AVG plus expected at-bats. Before games start, this is the top 2-leg recommendation within that group. After games begin, it updates with the remaining upcoming slate." />
            </div>
            {anyLegStarted ? (
              <div className="text-[10px] text-gray-500">Current recommendation updates as the upcoming slate changes.</div>
            ) : (
              <div className={`text-[10px] ${dailyDouble.isSmash ? 'text-orange-400/70' : 'text-yellow-400/70'}`}>
                {dailyDouble.isSmash ? 'Both legs have OPS > .950 and 7+ hits vs this pitcher.' : 'Current recommended 2-leg parlay.'}
              </div>
            )}
          </div>

          <div className="mt-2 space-y-2">
            {([
              { leg: dailyDouble.first, prob: dailyDouble.firstProbability },
              { leg: dailyDouble.second, prob: dailyDouble.secondProbability },
            ] as const).map(({ leg, prob }, i) => {
              const legStarted = isStarted(leg)
              return (
                <div key={leg.batterId} className={legStarted ? 'opacity-50' : ''}>
                  {/* Desktop: single row */}
                  <div className="hidden sm:flex items-baseline gap-3 text-sm">
                    <span className="text-gray-500 font-mono text-xs w-4 shrink-0">#{i + 1}</span>
                    <span className="text-white font-medium">{leg.batterName}</span>
                    <span className="text-gray-500 text-xs">vs {leg.pitcherName}</span>
                    {legStarted && <span className="text-[9px] font-bold text-amber-400 border border-amber-400/40 rounded px-1 py-0.5 uppercase tracking-wide leading-none">In Progress</span>}
                    <span className={`font-mono font-bold ${CONFIDENCE_COLORS[leg.confidence]}`}>{leg.avg.toFixed(3)} AVG</span>
                    <span className={`font-mono text-xs ${dailyDouble.isSmash ? 'text-orange-300' : 'text-gray-500'}`}>{leg.ops.toFixed(3)} OPS</span>
                    <span className="text-gray-600 font-mono text-xs">{leg.ab} AB</span>
                    <span className="text-green-300 font-semibold text-xs">{(prob * 100).toFixed(2)}% hit chance</span>
                    {leg.consensusHitOddsAmerican != null && (
                      <>
                        <span className="text-gray-700 select-none">·</span>
                        <span className="text-gray-400 font-mono text-xs" title={leg.bookCount ? `${leg.bookCount} books` : undefined}>
                          {fmtOdds(leg.consensusHitOddsAmerican)}
                        </span>
                      </>
                    )}
                  </div>
                  {/* Mobile: stacked rows */}
                  <div className="sm:hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-mono text-xs w-4 shrink-0">#{i + 1}</span>
                      <span className="text-white font-medium text-sm flex-1 min-w-0 truncate">{leg.batterName}</span>
                      <span className={`font-mono font-bold text-sm shrink-0 ${CONFIDENCE_COLORS[leg.confidence]}`}>{leg.avg.toFixed(3)} AVG</span>
                    </div>
                    <div className="pl-6 mt-0.5">
                      <span className="text-gray-500 text-xs">vs {leg.pitcherName}</span>
                      {legStarted && <span className="ml-2 text-[9px] font-bold text-amber-400 border border-amber-400/40 rounded px-1 py-0.5 uppercase tracking-wide leading-none">In Progress</span>}
                    </div>
                    <div className="flex items-center justify-between gap-3 pl-6 mt-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`font-mono text-xs shrink-0 ${dailyDouble.isSmash ? 'text-orange-300' : 'text-gray-400'}`}>{leg.ops.toFixed(3)} OPS</span>
                        <span className="text-gray-500 font-mono text-xs shrink-0">{leg.h}/{leg.ab}</span>
                      </div>
                      <span className="text-green-300 font-semibold text-xs shrink-0 text-right">{(prob * 100).toFixed(2)}% hit chance</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className={`mt-3 pt-2 border-t flex flex-wrap items-baseline gap-x-3 gap-y-1 ${dailyDouble.isSmash ? 'border-orange-500/20' : 'border-gray-800'}`}>
            <span className="text-green-300 font-semibold">Combined: {(dailyDouble.combinedProbability * 100).toFixed(2)}%</span>
            <span className="text-gray-500 text-xs">
              {anyLegStarted
                ? `This card reflects the current recommendation from the filtered Top 5 remaining in the upcoming slate.`
                : dailyDouble.isSmash
                  ? `Top current 2-leg recommendation within the filtered Top 5 by combined hit probability.`
                  : `Current top recommendation from the filtered Top 5 upcoming plays by combined hit probability.`}
            </span>
          </div>
          {!anyLegStarted && unconfirmedLegs > 0 && (
            <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-500/70 leading-relaxed">
              <span className="shrink-0 mt-px">⚠</span>
              <span>
                {unconfirmedLegs === 2
                  ? 'Lineups not confirmed yet. Hit chance will update once batting order is set.'
                  : 'One lineup is not confirmed yet. Hit chance for that leg may shift once batting order is set.'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-gray-400 uppercase tracking-wider text-[10px] font-semibold">Recommended Double</span>
            <InfoTooltip width="w-64" text="A Recommended Double is the current 2-leg parlay built from the filtered Top 5 upcoming plays with the highest combined hit probability. If both legs also have career OPS above .950 and at least 7 hits against their pitcher, it upgrades to a Smash Double." />
          </div>
          <p className="text-gray-500">{top5.length < 2 ? 'Not enough qualified plays to form a recommended double. Fewer than 2 matchups meet the 15 AB / .300 AVG requirements today.' : 'No recommended double is available from the current upcoming slate.'}</p>
        </div>
      )}
    </div>
  )
}
