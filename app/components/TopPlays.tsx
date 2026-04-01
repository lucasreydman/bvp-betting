import type { MatchupResult } from '@/lib/types'
import { formatTime, expectedAtBats, hitProbability, regressedAvg, suggestDoublePairs } from '@/lib/utils'

interface Props {
  matchups: MatchupResult[]
}

const CONFIDENCE_COLORS = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-red-400',
}

export default function TopPlays({ matchups }: Props) {
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

  const suggestedPairs = suggestDoublePairs(top5.map(item => item.m))

  const header = (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Top 5 Plays</h2>
      </div>
      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xs text-slate-300">
        <div className="mb-3 text-[11px] uppercase tracking-[0.25em] text-slate-400 font-semibold">How Top Plays are ranked</div>
        <div className="space-y-3 leading-5">
          <p>
            <span className="text-white font-semibold">Primary score:</span>
            <span className="text-slate-300"> score = AVG × confidence</span>
          </p>
          <p className="text-slate-400 pl-3">confidence = min(AB / 30, 1)</p>
          <p>
            <span className="text-white font-semibold">Hit chance %:</span>
            <span className="text-slate-300"> estimated chance of ≥1 hit using a regressed AVG and expected ABs.</span>
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
                <span className="text-gray-500 w-4 shrink-0 font-mono text-xs">{i + 1}.</span>
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
              <span className="text-gray-500 w-4 font-mono">{i + 1}.</span>
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

      <div className="mt-4 rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm">
        <div className="text-gray-400 uppercase tracking-wider text-[10px] font-semibold mb-2">Suggested doubles</div>
        {suggestedPairs.length > 0 ? (
          <div className="flex flex-col gap-3 text-sm text-gray-200">
            {suggestedPairs.map((pair, index) => (
              <div key={`${pair.first.batterId}-${pair.second.batterId}`} className="rounded-lg border border-gray-800 bg-gray-900 p-3">
                <div className="text-gray-300 font-medium">Double {index + 1}</div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
                  <span className="font-medium text-white">{pair.first.batterName}</span>
                  <span className="text-gray-500">vs {pair.first.pitcherName}</span>
                  <span className="text-gray-400">+</span>
                  <span className="font-medium text-white">{pair.second.batterName}</span>
                  <span className="text-gray-500">vs {pair.second.pitcherName}</span>
                </div>
                <div className="text-green-300 font-semibold mt-1">
                  Combined chance ≈ {(pair.combinedProbability * 100).toFixed(1)}%
                </div>
              </div>
            ))}
            <div className="text-gray-500">Each pair is chosen to maximize combined hit probability while keeping both legs on different pitchers. The second pair is the next best non-overlapping double, so it does not reuse a batter from the first pair.</div>
          </div>
        ) : (
          <p className="text-gray-500">No clean double recommendation found for the current top plays.</p>
        )}
      </div>
    </div>
  )
}
