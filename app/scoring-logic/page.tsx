import Link from 'next/link'
import ScoringLogicContent from '@/app/components/ScoringLogicContent'
import { MATH_FONT_STACK } from '@/app/components/Formula'

export default function ScoringLogicPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">Scoring Guide</div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">Scoring and Selection Logic</h1>
          <p className="mt-1 text-sm text-slate-400">How Top 4 plays, the Daily Double, the Secondary Double, and Smash Double selection are calculated.</p>
        </div>
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Back
        </Link>
      </div>

      <div
        className="rounded-[1.75rem] border border-slate-700/90 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.08),_transparent_24%),linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(3,10,28,0.94))] p-4 text-slate-200 shadow-[0_20px_60px_rgba(2,6,23,0.32)] sm:p-5"
        style={{ fontFamily: MATH_FONT_STACK }}
      >
        <ScoringLogicContent />
      </div>
    </main>
  )
}