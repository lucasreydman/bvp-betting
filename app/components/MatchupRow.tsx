import type { MatchupResult } from '@/lib/types'
import { teamAbbr } from '@/lib/utils'
import { fmtOdds } from '@/lib/odds'
import { getLineupBadgeText, getLineupBadgeTitle } from '@/app/components/lineupBadge'
import GameTimeCell from './GameTimeCell'

interface Props {
  matchup: MatchupResult
  gameKind: 'upcoming' | 'inProgress' | 'settled'
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

function ResultBadge({ hitResult }: { hitResult: MatchupResult['hitResult'] }) {
  if (hitResult === 'win')
    return <span className="inline-flex text-xs px-2 py-0.5 rounded font-medium bg-green-900/40 text-green-400">HIT</span>
  if (hitResult === 'loss')
    return <span className="inline-flex text-xs px-2 py-0.5 rounded font-medium bg-red-900/40 text-red-400">NO HIT</span>
  return <span className="inline-flex text-xs px-2 py-0.5 rounded font-medium bg-gray-800 text-gray-500">–</span>
}

export default function MatchupRow({ matchup: m, gameKind }: Props) {
  return (
    <tr className={`border-t ${CONFIDENCE_ROW_COLORS[m.confidence]} hover:bg-gray-800/50 transition-colors`}>
      <td className="px-3 py-2 font-medium text-white whitespace-normal sm:whitespace-nowrap break-words">
        {m.batterName}
        <span className="ml-1.5 text-gray-600 text-xs font-normal">[{teamAbbr(m.batterTeam)}]</span>
      </td>
      <td className="px-3 py-2 text-gray-400 text-sm min-w-[14rem] max-w-[22rem] break-words">
        <span className="break-words">
          {m.pitcherName}{' '}
          <span className="text-gray-600 text-xs">[{teamAbbr(m.pitcherTeam)}]</span>
        </span>
      </td>
      <td className={`px-3 py-2 font-mono text-sm font-bold ${CONFIDENCE_TEXT_COLORS[m.confidence]}`}>
        {fmt3(m.avg)}
      </td>
      <td className="px-3 py-2 font-mono text-sm text-gray-300">{m.h}</td>
      <td className="px-3 py-2 font-mono text-sm text-gray-400">{m.ab}</td>
      <td className="px-3 py-2 font-mono text-sm text-gray-500 hidden sm:table-cell">{fmt3(m.ops)}</td>
      <td className="px-3 py-2 align-top">
        <GameTimeCell gameTime={m.gameTime} variant={gameKind} />
      </td>
      <td className="px-3 py-2 hidden sm:table-cell">
        <span className={`inline-flex text-xs px-2 py-0.5 rounded font-medium ${
          m.lineupSource === 'confirmed'
            ? 'bg-gray-800 text-gray-400'
            : 'bg-amber-900/40 text-amber-400'
        }`} title={getLineupBadgeTitle(m)}>
          {getLineupBadgeText(m)}
        </span>
      </td>
      {gameKind === 'upcoming' && (
        <td className="px-3 py-2 font-mono text-sm hidden sm:table-cell whitespace-nowrap">
          {m.consensusHitOddsAmerican != null ? (
            <span
              className="text-gray-300"
              title={m.bookCount ? `${m.bookCount} books` : undefined}
            >
              {fmtOdds(m.consensusHitOddsAmerican)}
            </span>
          ) : (
            <span className="text-gray-700">—</span>
          )}
        </td>
      )}
      {gameKind !== 'upcoming' && (
        <td className="px-3 py-2">
          <ResultBadge hitResult={m.hitResult} />
        </td>
      )}
    </tr>
  )
}
