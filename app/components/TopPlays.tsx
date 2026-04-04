import type { MatchupResult } from '@/lib/types'
import { formatTime, expectedAtBats, hitProbability, regressedAvg, suggestDailyDouble } from '@/lib/utils'
import type { DailyDouble } from '@/lib/utils'
import InfoTooltip from './InfoTooltip'

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

export default function TopPlays({ matchups, overrideDailyDouble, now }: Props) {
  const score = (m: MatchupResult) => m.avg * Math.min(m.ab / 30, 1)

  const enriched = matchups.map(m => {
    const expectedAB = expectedAtBats(m.lineupPosition)
    const adjustedAvg = regressedAvg(m.avg, m.ab)
    const hitPct = hitProbability(adjustedAvg, expectedAB)
    return { m, expectedAB, adjustedAvg, hitPct }
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
      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xs text-slate-300">
        <div className="mb-3 text-[11px] uppercase tracking-[0.25em] text-slate-400 font-semibold">How Top Plays are ranked</div>
        <div className="space-y-3 leading-5">
          <p>
            <span className="text-sky-400 font-semibold">Primary score:</span>
            <span className="text-sky-400"> career batting average against this pitcher, weighted by how many at-bats back it up. More at-bats = more trust in the number.</span>
          </p>
          <p className="text-slate-400 pl-3">score = AVG × confidence</p>
          <p className="text-slate-400 pl-3">confidence = min(AB / 30, 1)</p>
          <p>
            <span className="text-green-300 font-semibold">Hit chance %:</span>
            <span className="text-green-300"> estimated chance of ≥1 hit using a regressed AVG and expected ABs.</span>
            <InfoTooltip width="w-72" text="Hit chance uses a regressed AVG that pulls toward .320 (the conditional mean of pre-filtered matchups) based on sample size — smaller samples get pulled more. A higher raw AVG matters more here than ABs, which is the opposite of the ranking score (AVG × confidence). This is why a lower-ranked play can have a higher hit % and get picked for the parlay." />
          </p>
          <p className="text-slate-400 pl-3">adjusted AVG = (AB / (AB + 50)) × AVG + (50 / (AB + 50)) × 0.320</p>
          <p className="text-slate-400 pl-3">hit chance = 1 − (1 − adjusted AVG)^(expected AB)</p>
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
                <span
                  className={`text-xs shrink-0 ${m.lineupSource === 'confirmed' ? 'text-green-500' : 'text-amber-500/70'}`}
                  title={m.lineupSource === 'confirmed' ? 'Lineup confirmed' : 'Lineup not yet confirmed'}
                >
                  {m.lineupSource === 'confirmed' ? '✓' : '?'}
                </span>
                <span className={`font-mono font-bold text-sm shrink-0 ${CONFIDENCE_COLORS[m.confidence]}`}>
                  {m.avg.toFixed(3)}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-6 mt-0.5">
                <span className="text-gray-400 text-xs flex-1 min-w-0 truncate">vs {m.pitcherName}</span>
                <span className="text-gray-500 text-xs shrink-0 font-mono">{m.ab} AB</span>
                <span className="text-gray-400 text-xs shrink-0">Est. {expectedAB.toFixed(1)} AB</span>
                <span className="text-green-300 text-xs shrink-0 font-semibold">{(hitPct * 100).toFixed(2)}%</span>
                <span className="text-gray-600 text-xs shrink-0">{formatTime(m.gameTime)}</span>
              </div>
            </div>
            {/* Desktop: single row */}
            <div className="hidden sm:flex items-baseline gap-3 text-sm">
              <span className="text-sky-400 w-4 font-mono">{i + 1}.</span>
              <span className="text-white font-medium">{m.batterName}</span>
              <span
                className={`text-xs ${m.lineupSource === 'confirmed' ? 'text-green-500' : 'text-amber-500/70'}`}
                title={m.lineupSource === 'confirmed' ? 'Lineup confirmed' : 'Lineup not yet confirmed'}
              >
                {m.lineupSource === 'confirmed' ? '✓' : '?'}
              </span>
              <span className="text-gray-400">vs {m.pitcherName}</span>
              <span className={`font-mono font-bold ${CONFIDENCE_COLORS[m.confidence]}`}>
                {m.avg.toFixed(3)} AVG
              </span>
              <span className="text-gray-500 font-mono">{m.ops.toFixed(3)} OPS</span>
              <span className="text-gray-500 font-mono">{m.ab} AB</span>
              <span className="text-gray-400 font-mono">Est. {expectedAB.toFixed(1)} AB</span>
              <span className="text-green-300 font-semibold">{(hitPct * 100).toFixed(2)}%</span>
              <span className="text-gray-600 text-xs ml-auto">{formatTime(m.gameTime)}</span>
            </div>
          </li>
        ))}
      </ol>

      {dailyDouble ? (
        <div className={`mt-4 rounded-lg border p-3 text-sm ${dailyDouble.isSmash ? 'border-orange-500/50 bg-orange-950/20' : 'border-gray-800 bg-gray-950'}`}>
          <div className="flex items-baseline gap-2 mb-1">
            <div className={`inline-flex items-center gap-1 uppercase tracking-wider text-[10px] font-semibold ${dailyDouble.isSmash ? 'text-orange-400' : 'text-yellow-400'}`}>
              {dailyDouble.isSmash ? 'Smash Double' : 'Daily Double'}
              <span className="normal-case tracking-normal">
                <InfoTooltip width="w-80" text="Legs are chosen by highest combined hit probability, not by list rank. Ranking uses AVG × confidence (rewards sample size). Hit chance uses regressed AVG (pulls toward .320 based on sample size, rewarding raw AVG more). A lower-ranked play with a higher raw AVG can end up with a higher hit chance and edge out the #1 play. Both legs must also face different pitchers." />
              </span>
            </div>
            {anyLegStarted ? (
              <div className="text-[10px] text-gray-500">In progress. Export available below.</div>
            ) : (
              <div className={`text-[10px] ${dailyDouble.isSmash ? 'text-orange-400/70' : 'text-yellow-400/70'}`}>
                {dailyDouble.isSmash ? 'Both legs OPS above .950. Strongest possible parlay.' : 'Parlay these two legs for +100 or better'}
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
                  {/* Row 1: index + name + AVG */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-mono text-xs w-4 shrink-0">#{i + 1}</span>
                    <span className="text-white font-medium text-sm flex-1 min-w-0 truncate">{leg.batterName}</span>
                    <span className={`font-mono font-bold text-sm shrink-0 ${CONFIDENCE_COLORS[leg.confidence]}`}>{leg.avg.toFixed(3)} AVG</span>
                  </div>
                  {/* Row 2: pitcher + OPS + AB + hit% */}
                  <div className="flex items-center gap-2 pl-6 mt-0.5">
                    <span className="text-gray-500 text-xs flex-1 min-w-0 truncate">vs {leg.pitcherName}</span>
                    <span className={`font-mono text-xs shrink-0 ${dailyDouble.isSmash ? 'text-orange-300' : 'text-gray-400'}`}>{leg.ops.toFixed(3)} OPS</span>
                    <span className="text-gray-500 font-mono text-xs shrink-0">{leg.ab} AB</span>
                    <span className="text-green-300 font-semibold text-xs shrink-0">{(prob * 100).toFixed(2)}% hit chance</span>
                    {legStarted && <span className="text-[9px] font-bold text-amber-400 border border-amber-400/40 rounded px-1 py-0.5 uppercase tracking-wide leading-none shrink-0">In Progress</span>}
                  </div>
                </div>
              )
            })}
          </div>

          <div className={`mt-3 pt-2 border-t flex flex-wrap items-baseline gap-x-3 gap-y-1 ${dailyDouble.isSmash ? 'border-orange-500/20' : 'border-gray-800'}`}>
            <span className="text-green-300 font-semibold">Combined: {(dailyDouble.combinedProbability * 100).toFixed(2)}%</span>
            <span className="text-gray-500 text-xs">
              {anyLegStarted
                ? `This was today's recommended parlay before games started.`
                : dailyDouble.isSmash
                  ? `Both legs have career OPS above .950 against their pitchers. Elite historical production on both sides of the parlay, not just strong AVG.`
                  : `Chosen from today's top plays: highest combined hit probability with both legs on different pitchers.`}
            </span>
          </div>
          {!anyLegStarted && unconfirmedLegs > 0 && (
            <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-500/70 leading-relaxed">
              <span className="shrink-0 mt-px">⚠</span>
              <span>
                {unconfirmedLegs === 2
                  ? 'Lineups not yet confirmed. Hit chance will update once batting order is set, but both matchups remain strong plays.'
                  : 'One lineup is not yet confirmed. Hit chance for that leg may shift once batting order is set, but the matchup remains a strong play.'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-gray-400 uppercase tracking-wider text-[10px] font-semibold">Daily Double</span>
            <InfoTooltip width="w-56" text="A Daily Double is a 2-leg parlay built from the top plays with the highest combined hit probability, keeping both legs on different pitchers. If both legs also have career OPS above .950, it upgrades to a Smash Double." />
          </div>
          <p className="text-gray-500">{top5.length < 2 ? 'Not enough qualified plays to form a parlay. Fewer than 2 matchups meet the 15 AB / .300 AVG requirements today.' : 'No double recommendation available for the current top plays.'}</p>
        </div>
      )}
    </div>
  )
}
