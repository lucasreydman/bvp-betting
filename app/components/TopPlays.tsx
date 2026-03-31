import type { MatchupResult } from '@/lib/types'
import { formatTime } from '@/lib/utils'

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
  const top5 = [...matchups]
    .sort((a, b) => score(b) - score(a) || b.avg - a.avg || b.ab - a.ab)
    .slice(0, 5)

  const header = (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Top 5 Plays</h2>
      <div className="relative group">
        <span className="text-gray-600 hover:text-gray-400 text-xs cursor-default select-none border border-gray-700 rounded-full w-4 h-4 inline-flex items-center justify-center leading-none">i</span>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
          Ranked by <span className="text-white font-medium">AVG × confidence</span>, where confidence scales linearly from 0 to 1 as AB goes from 0 to 30. A .350 AVG in 30 AB scores higher than a .500 AVG in 10 AB. Tiebreaker: raw AVG, then AB.
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
      <ol className="space-y-2">
        {top5.map((m, i) => (
          <li key={`${m.batterId}-${m.pitcherId}-${m.gameTime}`} className="flex items-baseline gap-3 text-sm">
            <span className="text-gray-500 w-4 font-mono">{i + 1}.</span>
            <span className="text-white font-medium">{m.batterName}</span>
            <span className="text-gray-400">vs {m.pitcherName}</span>
            <span className={`font-mono font-bold ${CONFIDENCE_COLORS[m.confidence]}`}>
              {m.avg.toFixed(3)} AVG
            </span>
            <span className="text-gray-500 font-mono">{m.ops.toFixed(3)} OPS</span>
            <span className="text-gray-600 text-xs">({m.ab} AB)</span>
            <span className="text-gray-600 text-xs ml-auto">{formatTime(m.gameTime)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
