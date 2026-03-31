import type { MatchupResult } from '@/lib/types'
import GameTimeCell from './GameTimeCell'

interface Props {
  matchup: MatchupResult
  gameKind: 'upcoming' | 'inProgress'
}

const CONFIDENCE_ROW_COLORS = {
  high: 'border-green-900/40 bg-green-950/20',
  medium: 'border-yellow-900/40 bg-yellow-950/10',
  low: 'border-red-900/40 bg-red-950/10',
}

const CONFIDENCE_TEXT_COLORS = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-red-400',
}

const fmt3 = (n: number) => n.toFixed(3)

export default function MatchupRow({ matchup: m, gameKind }: Props) {
  return (
    <tr className={`border-t ${CONFIDENCE_ROW_COLORS[m.confidence]} hover:bg-gray-800/50 transition-colors`}>
      <td className="px-3 py-2 font-medium text-white whitespace-nowrap">
        {m.batterName}
        {m.lineupPosition && (
          <span className="ml-1 text-gray-500 text-xs">#{m.lineupPosition}</span>
        )}
      </td>
      <td className="px-3 py-2 text-gray-300 text-sm align-top break-words min-w-[13rem] max-w-[16rem]">
        {m.batterTeam}
      </td>
      <td className="px-3 py-2 text-gray-400 text-sm align-top min-w-[17rem] max-w-[22rem]">
        <span className="break-words">
          {m.pitcherName}{' '}
          <span className="text-gray-600 text-xs">({m.pitcherTeam})</span>
        </span>
      </td>
      <td className={`px-3 py-2 font-mono text-sm font-bold ${CONFIDENCE_TEXT_COLORS[m.confidence]}`}>
        {fmt3(m.avg)}
      </td>
      <td className="px-3 py-2 font-mono text-sm text-gray-300">{m.h}</td>
      <td className="px-3 py-2 font-mono text-sm text-gray-400">{m.ab}</td>
      <td className="px-3 py-2 font-mono text-sm text-gray-500">{fmt3(m.ops)}</td>
      <td className="px-3 py-2 align-top">
        <GameTimeCell gameTime={m.gameTime} variant={gameKind} />
      </td>
      <td className="px-3 py-2">
        <span className={`inline-flex text-xs px-2 py-0.5 rounded font-medium ${
          m.lineupSource === 'confirmed'
            ? 'bg-gray-800 text-gray-400'
            : 'bg-amber-900/40 text-amber-400'
        }`}>
          {m.lineupSource === 'confirmed' ? 'Confirmed' : 'Estimated'}
        </span>
      </td>
    </tr>
  )
}
