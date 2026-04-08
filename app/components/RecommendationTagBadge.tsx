import type { RecommendationTag } from '@/lib/types'

const TAG_STYLES: Record<RecommendationTag, string> = {
  SMASH: 'border border-orange-500/30 bg-orange-950/60 text-orange-300',
  DD: 'border border-emerald-500/30 bg-emerald-950/60 text-emerald-300',
  SD: 'border border-sky-500/30 bg-sky-950/60 text-sky-300',
  T4: 'border border-slate-600/60 bg-slate-900/80 text-slate-300',
}

const TAG_TITLES: Record<RecommendationTag, string> = {
  SMASH: 'Part of the Smash Double',
  DD: 'Part of the Daily Double',
  SD: 'Part of the Secondary Double',
  T4: 'Official Top 4 tracked play',
}

interface Props {
  tags?: RecommendationTag[]
  variant?: 'default' | 'compact'
}

export default function RecommendationTagBadge({ tags, variant = 'default' }: Props) {
  if (!tags || tags.length === 0) return null

  const isCompact = variant === 'compact'

  return (
    <span className={`inline-flex items-center gap-1 ${isCompact ? 'max-w-full overflow-hidden whitespace-nowrap' : 'flex-wrap'}`}>
      {tags.map(tag => (
        <span
          key={tag}
          className={`inline-flex shrink-0 items-center rounded font-semibold uppercase ${isCompact ? 'px-1 py-0.5 text-[9px] tracking-[0.14em]' : 'px-1.5 py-0.5 text-[10px] tracking-[0.18em]'} ${TAG_STYLES[tag]}`}
          title={TAG_TITLES[tag]}
        >
          {tag}
        </span>
      ))}
    </span>
  )
}