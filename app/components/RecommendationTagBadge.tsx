import type { RecommendationTag } from '@/lib/types'

const TAG_STYLES: Record<RecommendationTag, string> = {
  SMASH: 'border border-orange-500/30 bg-orange-950/60 text-orange-300',
  RD: 'border border-emerald-500/30 bg-emerald-950/60 text-emerald-300',
  SD: 'border border-sky-500/30 bg-sky-950/60 text-sky-300',
  T4: 'border border-slate-600/60 bg-slate-900/80 text-slate-300',
}

const TAG_TITLES: Record<RecommendationTag, string> = {
  SMASH: 'Part of the Smash Double',
  RD: 'Part of the primary recommended double',
  SD: 'Part of the secondary recommended double',
  T4: 'Top 4 play that is not currently in a recommended double',
}

interface Props {
  tag?: RecommendationTag
}

export default function RecommendationTagBadge({ tag }: Props) {
  if (!tag) return null

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${TAG_STYLES[tag]}`}
      title={TAG_TITLES[tag]}
    >
      {tag}
    </span>
  )
}