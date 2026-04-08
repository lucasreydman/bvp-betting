import type { MatchupResult } from '@/lib/types'
import { teamAbbr } from '@/lib/utils'
import { getLineupBadgeText, getLineupBadgeTitle } from '@/app/components/lineupBadge'
import GameTimeCell from './GameTimeCell'
import RecommendationTagBadge from './RecommendationTagBadge'

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
    return <span className="inline-flex text-[11px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap bg-green-900/40 text-green-400">HIT</span>
  if (hitResult === 'loss')
    return <span className="inline-flex text-[11px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap bg-red-900/40 text-red-400">NO HIT</span>
  return <span className="inline-flex text-[11px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap bg-gray-800 text-gray-500">–</span>
}

export default function MatchupRow({ matchup: m, gameKind }: Props) {
  return (
    <tr className={`border-t ${CONFIDENCE_ROW_COLORS[m.confidence]} hover:bg-gray-800/50 transition-colors`}>
      <td className="px-3 py-2 font-medium text-white whitespace-nowrap">
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          <span className="truncate">{m.batterName}</span>
          <span className="shrink-0 text-gray-600 text-[11px] font-normal">[{teamAbbr(m.batterTeam)}]</span>
          <RecommendationTagBadge tags={m.recommendationTags} variant="compact" />
        </div>
      </td>
      <td className="px-3 py-2 text-gray-400 text-sm whitespace-nowrap">
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          <span className="truncate">{m.pitcherName}</span>
          <span className="shrink-0 text-gray-600 text-[11px]">[{teamAbbr(m.pitcherTeam)}]</span>
        </div>
      </td>
      <td className={`px-3 py-2 font-mono text-sm font-bold ${CONFIDENCE_TEXT_COLORS[m.confidence]}`}>
        {fmt3(m.avg)}
      </td>
      <td className="px-3 py-2 font-mono text-sm text-gray-300">{m.h}</td>
      <td className="px-3 py-2 font-mono text-sm text-gray-400">{m.ab}</td>
      <td className="px-3 py-2 font-mono text-sm text-gray-500 hidden sm:table-cell">{fmt3(m.ops)}</td>
      <td className="px-3 py-2">
        <GameTimeCell gameTime={m.gameTime} variant={gameKind} compact />
      </td>
      <td className="px-3 py-2 hidden sm:table-cell">
        <span className={`inline-flex whitespace-nowrap text-[11px] px-2 py-0.5 rounded font-medium ${
          m.lineupSource === 'confirmed'
            ? 'bg-gray-800 text-gray-400'
            : 'bg-amber-900/40 text-amber-400'
        }`} title={getLineupBadgeTitle(m)}>
          {getLineupBadgeText(m)}
        </span>
      </td>
      {gameKind === 'upcoming' && (
        <td className="px-3 py-2 hidden sm:table-cell" aria-hidden="true">
          <span className="invisible">—</span>
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
