import type { MatchupResult } from '@/lib/types'
import { formatET } from '@/lib/utils'

interface Props {
  matchups: MatchupResult[]
}

const CONFIDENCE_COLORS = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-orange-400',
}

export default function TopPlays({ matchups }: Props) {
  const top5 = [...matchups]
    .sort((a, b) => b.ops - a.ops || b.avg - a.avg || b.slg - a.slg || b.ab - a.ab)
    .slice(0, 5)

  if (top5.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Top 5 Plays Today</h2>
        <p className="text-gray-500 text-sm">No qualifying matchups found for this date.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Top 5 Plays Today</h2>
      <ol className="space-y-2">
        {top5.map((m, i) => (
          <li key={`${m.batterId}-${m.pitcherId}`} className="flex items-baseline gap-3 text-sm">
            <span className="text-gray-500 w-4 font-mono">{i + 1}.</span>
            <span className="text-white font-medium">{m.batterName}</span>
            <span className="text-gray-400">vs {m.pitcherName}</span>
            <span className={`font-mono font-bold ${CONFIDENCE_COLORS[m.confidence]}`}>
              {m.ops.toFixed(3)} OPS
            </span>
            <span className="text-gray-500 font-mono">{m.avg.toFixed(3)} AVG</span>
            <span className="text-gray-500 font-mono">{m.slg.toFixed(3)} SLG</span>
            <span className="text-gray-600 text-xs">({m.ab} AB)</span>
            <span className="text-gray-600 text-xs ml-auto">{formatET(m.gameTime)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
