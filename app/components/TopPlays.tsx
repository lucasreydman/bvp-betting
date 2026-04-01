import type { MatchupResult } from '@/lib/types'
import { formatTime, expectedAtBats, hitProbability, regressedAvg, suggestDailyDouble } from '@/lib/utils'
import type { DailyDouble } from '@/lib/utils'

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
          </p>
          <p className="text-slate-400 pl-3">adjusted AVG = (AB / (AB + 50)) × AVG + (50 / (AB + 50)) × 0.260</p>
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
                <span className={`font-mono font-bold text-sm shrink-0 ${CONFIDENCE_COLORS[m.confidence]}`}>
                  {m.avg.toFixed(3)}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-6 mt-0.5">
                <span className="text-gray-400 text-xs flex-1 min-w-0 truncate">vs {m.pitcherName}</span>
                <span className="text-gray-500 text-xs shrink-0 font-mono">{m.ab} AB</span>
                <span className="text-gray-400 text-xs shrink-0">Est. {expectedAB.toFixed(1)} AB</span>
                <span className="text-green-300 text-xs shrink-0 font-semibold" title="Chance of at least one hit, using regressed AVG and expected ABs.">{(hitPct * 100).toFixed(0)}%</span>
                <span className="text-gray-600 text-xs shrink-0">{formatTime(m.gameTime)}</span>
              </div>
            </div>
            {/* Desktop: single row */}
            <div className="hidden sm:flex items-baseline gap-3 text-sm">
              <span className="text-sky-400 w-4 font-mono">{i + 1}.</span>
              <span className="text-white font-medium">{m.batterName}</span>
              <span className="text-gray-400">vs {m.pitcherName}</span>
              <span className={`font-mono font-bold ${CONFIDENCE_COLORS[m.confidence]}`}>
                {m.avg.toFixed(3)} AVG
              </span>
              <span className="text-gray-500 font-mono">{m.ops.toFixed(3)} OPS</span>
              <span className="text-gray-500 font-mono">{m.ab} AB</span>
              <span className="text-gray-400 font-mono">Est. {expectedAB.toFixed(1)} AB</span>
              <span className="text-green-300 font-semibold" title="Chance of at least one hit, using regressed AVG and expected ABs.">{(hitPct * 100).toFixed(0)}%</span>
              <span className="text-gray-600 text-xs ml-auto">{formatTime(m.gameTime)}</span>
            </div>
          </li>
        ))}
      </ol>

      {dailyDouble ? (
        <div className={`mt-4 rounded-lg border p-3 text-sm ${dailyDouble.isSmash ? 'border-orange-500/50 bg-orange-950/20' : 'border-gray-800 bg-gray-950'}`}>
          <div className="flex items-baseline gap-2 mb-1">
            <div className={`uppercase tracking-wider text-[10px] font-semibold ${dailyDouble.isSmash ? 'text-orange-400' : 'text-yellow-400'}`}>
              {dailyDouble.isSmash ? 'Smash Double' : 'Daily Double'}
            </div>
            {anyLegStarted ? (
              <div className="text-[10px] text-gray-500">In progress. Export available below.</div>
            ) : (
              <div className={`text-[10px] ${dailyDouble.isSmash ? 'text-orange-400/70' : 'text-yellow-400/70'}`}>
                {dailyDouble.isSmash ? 'Both legs elite OPS (>.950) — strongest possible parlay' : 'Parlay these two legs for +100 or better'}
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
                <div key={leg.batterId} className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${legStarted ? 'opacity-50' : ''}`}>
                  <span className="text-gray-500 font-mono text-xs w-4 shrink-0">#{i + 1}</span>
                  <span className="text-white font-medium">{leg.batterName}</span>
                  <span className="text-gray-500">vs {leg.pitcherName}</span>
                  <span className={`font-mono font-bold text-xs ${CONFIDENCE_COLORS[leg.confidence]}`}>{leg.avg.toFixed(3)} AVG</span>
                  <span className={`font-mono text-xs ${dailyDouble.isSmash ? 'text-orange-300' : 'text-gray-400'}`}>{leg.ops.toFixed(3)} OPS</span>
                  <span className="text-gray-500 font-mono text-xs">{leg.ab} AB</span>
                  <span className="text-green-300 font-semibold text-xs">{(prob * 100).toFixed(0)}% hit chance</span>
                  {legStarted && <span className="text-[9px] font-bold text-amber-400 border border-amber-400/40 rounded px-1 py-0.5 uppercase tracking-wide leading-none">In Progress</span>}
                </div>
              )
            })}
          </div>

          <div className={`mt-3 pt-2 border-t flex flex-wrap items-baseline gap-x-3 gap-y-1 ${dailyDouble.isSmash ? 'border-orange-500/20' : 'border-gray-800'}`}>
            <span className="text-green-300 font-semibold">Combined: {(dailyDouble.combinedProbability * 100).toFixed(1)}%</span>
            <span className="text-gray-500 text-xs">
              {anyLegStarted
                ? `This was today's recommended parlay before games started.`
                : dailyDouble.isSmash
                  ? `Both legs carry career OPS above .950 against their pitchers — that's elite historical production on both sides of the parlay, not just strong AVG.`
                  : `Chosen from today's top plays: highest combined hit probability with both legs on different pitchers.`}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-gray-400 uppercase tracking-wider text-[10px] font-semibold">Daily Double</span>
            <span className="relative group inline-flex items-center">
              <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full border border-gray-600 text-gray-500 text-[9px] font-bold cursor-default leading-none select-none hover:border-gray-400 hover:text-gray-300 transition-colors">i</span>
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
                <span className="block bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-[11px] leading-4 shadow-xl">
                  A Daily Double is a 2-leg parlay built from the top plays with the highest combined hit probability, keeping both legs on different pitchers. If both legs also carry an OPS above .950, it upgrades to a Smash Double.
                  <span className="block absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 overflow-hidden">
                    <span className="block w-2 h-2 bg-gray-800 border-r border-b border-gray-700 rotate-45 -translate-y-1/2"></span>
                  </span>
                </span>
              </span>
            </span>
          </div>
          <p className="text-gray-500">{top5.length < 2 ? 'Not enough qualified plays to form a parlay. Try lowering the Min AB or Min AVG filter to see more matchups.' : 'No double recommendation available for the current top plays.'}</p>
        </div>
      )}
    </div>
  )
}
