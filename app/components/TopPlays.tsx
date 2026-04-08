import type { ReactNode } from 'react'
import type { MatchupResult } from '@/lib/types'
import { formatTime, expectedAtBats, hitProbability, regressedAvg, resolveLineupPosition, suggestRecommendedDoubles } from '@/lib/utils'
import type { RecommendedDouble } from '@/lib/utils'
import { getLineupBadgeText, getLineupBadgeTitle } from '@/app/components/lineupBadge'
import { fmtOdds } from '@/lib/odds'
import InfoTooltip from './InfoTooltip'
import { Formula, Fraction, MATH_FONT_STACK, Sup } from './Formula'

interface Props {
  matchups: MatchupResult[]
  overrideRecommendedDoubles?: RecommendedDouble[]
  now: number
}

const TOP_PLAYS_LIMIT = 4

const CONFIDENCE_COLORS = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-red-400',
}

const LINEUP_BADGE_STYLES = {
  confirmed: 'bg-gray-800 text-gray-300',
  estimated: 'bg-amber-900/40 text-amber-400',
} as const

const RECOMMENDATION_BADGE_STYLES = {
  smash: 'bg-orange-950/60 text-orange-300 border border-orange-500/30',
  primary: 'bg-yellow-950/60 text-yellow-300 border border-yellow-500/30',
  secondary: 'bg-sky-950/60 text-sky-300 border border-sky-500/30',
  single: 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30',
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

export default function TopPlays({ matchups, overrideRecommendedDoubles, now }: Props) {
  const score = (m: MatchupResult) => m.avg * Math.min(m.ab / 30, 1)

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
    if (!hasTwoDoubles) return 'Recommended Double'
    return index === 0 ? 'Primary Double' : 'Secondary Double'
  }

  const getDoubleTooltip = () => {
    if (hasTwoDoubles) {
      return 'When all four Top 4 plays qualify, the app recommends two doubles. If any pair qualifies as a Smash Double, that pair is forced into the first slot and the remaining two legs become the second double. If no smash pair exists, the app chooses the strongest overall split of the Top 4 and orders the two doubles by strength.'
    }

    return 'When only two or three Top 4 plays qualify, the app shows the single strongest available 2-leg parlay. Smash Double rules still apply if that pair clears OPS above .950 and at least 7 hits against the pitcher.'
  }

  const getDoubleSubcopy = (double: RecommendedDouble, index: number) => {
    if (double.isSmash) return 'Forced to the top because both legs clear the Smash Double threshold.'
    if (!hasTwoDoubles) return 'Best available 2-leg parlay from the current Top 4.'
    if (recommendedDoubles[0]?.isSmash && index === 1) return 'Remaining pair after locking in the Smash Double first.'
    return index === 0 ? 'Stronger of the two available Top 4 pairings.' : 'Second-best pairing from the current Top 4 split.'
  }

  const recommendationBadges = new Map<string, { text: string; style: string }>()
  for (const [index, double] of recommendedDoubles.entries()) {
    const badge = double.isSmash
      ? { text: 'Smash', style: RECOMMENDATION_BADGE_STYLES.smash }
      : !hasTwoDoubles
        ? { text: 'Best', style: RECOMMENDATION_BADGE_STYLES.single }
        : index === 0
          ? { text: 'D1', style: RECOMMENDATION_BADGE_STYLES.primary }
          : { text: 'D2', style: RECOMMENDATION_BADGE_STYLES.secondary }

    for (const leg of [double.first, double.second]) {
      recommendationBadges.set(`${leg.batterId}:${leg.pitcherId}:${leg.gameTime}`, badge)
    }
  }

  const header = (
    <div className="mb-4">
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Top 4 Plays</h2>
        </div>
        <p className="mt-1 max-w-2xl text-xs text-gray-500">Capped at four to keep the board concentrated on the strongest historical edges and avoid padding the slate with lower-conviction plays.</p>
        {recommendedDoubles.length > 0 && <p className="mt-1 max-w-2xl text-[11px] text-gray-600">Pair badges on each play show where that leg lands in the recommended doubles.</p>}
      </div>
      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xs text-slate-300 sm:hidden">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">How Top Plays are ranked</div>
        <div className="space-y-3 leading-5">
          <p>
            <span className="font-semibold text-sky-400">Primary score:</span>
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
            <span className="font-semibold text-green-300">Hit chance %:</span>
            <span className="text-green-300"> estimated chance of ≥1 hit using a regressed AVG and expected at-bats.</span>
            <InfoTooltip width="w-72" text="Hit chance uses a regressed AVG that pulls toward .320 based on sample size. Smaller samples get pulled more. A higher raw AVG matters more here than ABs, which is the opposite of the ranking score. That is why a lower-ranked play can still land in the top recommended double." />
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
          <Formula className="hidden pl-3 text-slate-300 sm:flex">
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
        className="hidden overflow-hidden rounded-[1.75rem] border border-slate-700/90 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.10),_transparent_28%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(2,6,23,0.92))] p-5 text-slate-200 sm:block"
        style={{ fontFamily: MATH_FONT_STACK }}
      >
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Top 4 formulas</div>
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
            <div className="grid content-start grid-cols-2 gap-x-5 gap-y-1 text-[0.84rem] leading-5 text-slate-300">
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
              <span>Top 4 hit %</span>
              <span>=</span>
              <span>100 × P(≥1 hit)</span>
            </Formula>
          </FormulaBlock>

          <FormulaBlock title="Recommended Doubles" accent="text-yellow-300">
            <Formula className="text-slate-100 leading-6">
              <span>P(double)</span>
              <span>=</span>
              <span>P₁ × P₂</span>
            </Formula>
            <Formula className="text-slate-300 leading-6">
              <span>with 4 plays</span>
              <span>=</span>
              <span>best Top 4 split</span>
            </Formula>
            <Formula className="text-slate-400 text-[0.8rem] leading-5">
              <span>with 2-3 plays</span>
              <span>=</span>
              <span>best single pair only</span>
            </Formula>
          </FormulaBlock>

          <FormulaBlock title="Smash Priority" accent="text-orange-300">
            <div className="space-y-0.5 text-[0.9rem] leading-6 text-slate-100">
              <div>smash = (OPS₁ &gt; .950 ∧ H₁ ≥ 7)</div>
              <div className="pl-16 text-slate-300">and</div>
              <div className="pl-14">(OPS₂ &gt; .950 ∧ H₂ ≥ 7)</div>
            </div>
            <Formula className="text-slate-400 text-[0.8rem] leading-5">
              <span>if smash exists</span>
              <span>=</span>
              <span>smash first, leftovers second</span>
            </Formula>
          </FormulaBlock>
        </div>
      </div>
    </div>
  )

  if (topPlays.length === 0) {
    return (
      <div className="mb-4 rounded-lg bg-gray-900 p-4">
        {header}
        <p className="text-sm text-gray-500">No upcoming games with data for this date.</p>
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-lg bg-gray-900 p-4">
      {header}
      <ol className="-mx-4 divide-y divide-gray-800/40 px-0 sm:mx-0 sm:space-y-2 sm:divide-y-0 sm:px-0">
        {topPlays.map(({ m, expectedAB, hitPct }, i) => {
          const pairingBadge = recommendationBadges.get(`${m.batterId}:${m.pitcherId}:${m.gameTime}`)

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
                {pairingBadge && (
                  <span className={`inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${pairingBadge.style}`}>
                    {pairingBadge.text}
                  </span>
                )}
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
              {pairingBadge && (
                <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${pairingBadge.style}`}>
                  {pairingBadge.text}
                </span>
              )}
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
                  {anyLegStarted ? (
                    <div className="text-[10px] text-gray-500">Current recommendation updates as the upcoming slate changes.</div>
                  ) : (
                    <div className={`text-[10px] ${double.isSmash ? 'text-orange-400/70' : 'text-gray-500'}`}>{getDoubleSubcopy(double, index)}</div>
                  )}
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
                  <span className="text-xs text-gray-500">{anyLegStarted ? 'This card reflects the current recommendation from the filtered Top 4 remaining in the upcoming slate.' : getDoubleSubcopy(double, index)}</span>
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
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Recommended Doubles</span>
            <InfoTooltip width="w-64" text="When four Top 4 plays qualify, the app recommends two doubles. If any pair qualifies as a Smash Double, that pair is shown first and the remaining two legs become the second double. With only two or three qualified plays, the app shows just the strongest available double." />
          </div>
          <p className="text-gray-500">{topPlays.length < 2 ? 'Not enough qualified plays to form a recommended double. Fewer than 2 matchups meet the 15 AB / .300 AVG requirements today.' : 'No recommended doubles are available from the current upcoming slate.'}</p>
        </div>
      )}
    </div>
  )
}
