import type { ReactNode } from 'react'
import { Formula, Fraction, Sup } from './Formula'

function FormulaBlock({
  title,
  accent,
  children,
}: {
  title: string
  accent: string
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col rounded-[1.35rem] border border-slate-700/60 bg-[linear-gradient(180deg,rgba(2,6,23,0.9),rgba(3,10,28,0.72))] p-4 shadow-[inset_0_1px_0_rgba(148,163,184,0.06)]">
      <div className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] ${accent}`}>{title}</div>
      <div className="flex flex-1 flex-col gap-2.5 text-[0.96rem] text-slate-100 leading-[1.55]">{children}</div>
    </div>
  )
}

export default function ScoringLogicContent() {
  return (
    <div className="pb-1">
      <div className="mb-4 flex flex-nowrap items-center justify-center gap-2 text-left text-[11px] leading-5 text-slate-200">
        <span className="inline-flex min-w-0 items-center gap-1 rounded-full border border-slate-700/70 bg-slate-950/80 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(148,163,184,0.06)]">
          <span className="font-semibold text-sky-300">AVG</span>
          <span className="text-slate-400">= career BvP batting average</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1 rounded-full border border-slate-700/70 bg-slate-950/80 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(148,163,184,0.06)]">
          <span className="font-semibold text-cyan-300">AB</span>
          <span className="text-slate-400">= career at-bats vs this pitcher</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1 rounded-full border border-slate-700/70 bg-slate-950/80 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(148,163,184,0.06)]">
          <span className="font-semibold text-lime-300">P</span>
          <span className="text-slate-400">= probability of at least one hit</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1 rounded-full border border-slate-700/70 bg-slate-950/80 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(148,163,184,0.06)]">
          <span className="font-semibold text-amber-300">E[AB]</span>
          <span className="text-slate-400">= expected at-bats from batting slot</span>
        </span>
      </div>

      <div className="grid auto-rows-fr gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <FormulaBlock title="Ranking" accent="text-sky-300">
          <Formula className="text-slate-50 leading-6">
            <span>score</span>
            <span>=</span>
            <span>AVG</span>
            <span>×</span>
            <span>confidence</span>
          </Formula>
          <Formula className="text-slate-200 leading-6">
            <span>confidence</span>
            <span>=</span>
            <span>min(</span>
            <Fraction top={<span>AB</span>} bottom={<span>30</span>} />
            <span>, 1)</span>
          </Formula>
          <Formula className="text-slate-400 text-[0.82rem] leading-5">
            <span>sort</span>
            <span>=</span>
            <span>score ↓, AVG ↓, AB ↓</span>
          </Formula>
        </FormulaBlock>

        <FormulaBlock title="Regression" accent="text-emerald-300">
          <Formula className="text-slate-50 leading-6">
            <span>adjusted AVG</span>
            <span>=</span>
            <Fraction top={<span>AB</span>} bottom={<span>AB + 50</span>} />
            <span>×</span>
            <span>AVG</span>
            <span>+</span>
            <Fraction top={<span>50</span>} bottom={<span>AB + 50</span>} />
            <span>×</span>
            <span>0.320</span>
          </Formula>
          <Formula className="text-slate-400 text-[0.82rem] leading-5">
            <span>w</span>
            <span>=</span>
            <Fraction top={<span>AB</span>} bottom={<span>AB + 50</span>} />
          </Formula>
          <Formula className="text-slate-400 text-[0.82rem] leading-5">
            <span>adjusted AVG</span>
            <span>=</span>
            <span>w × AVG + (1 − w) × 0.320</span>
          </Formula>
        </FormulaBlock>

        <FormulaBlock title="Expected At-Bats" accent="text-amber-300">
          <div className="text-[0.95rem] leading-6 text-slate-50">
            <div>slot = confirmed slot</div>
            <div>or estimated slot</div>
          </div>
          <div className="grid content-start grid-cols-2 gap-x-5 gap-y-1.5 text-[0.88rem] leading-5 text-slate-200">
            <div>E[AB] = 4.45, slot ≤ 3</div>
            <div>E[AB] = 4.25, slot = 4</div>
            <div>E[AB] = 4.05, 5 ≤ slot ≤ 6</div>
            <div>E[AB] = 3.85, slot ≥ 7</div>
          </div>
        </FormulaBlock>

        <FormulaBlock title="Hit Chance" accent="text-lime-300">
          <Formula className="text-slate-50 leading-6">
            <span>P(≥1 hit)</span>
            <span>=</span>
            <span>1 − (1 − adjusted AVG)</span>
            <Sup>E[AB]</Sup>
          </Formula>
          <Formula className="text-slate-400 text-[0.82rem] leading-5">
            <span>Top 4 hit %</span>
            <span>=</span>
            <span>100 × P(≥1 hit)</span>
          </Formula>
        </FormulaBlock>

        <FormulaBlock title="Double Selection" accent="text-yellow-300">
          <Formula className="text-slate-50 leading-6">
            <span>P(double)</span>
            <span>=</span>
            <span>P₁ × P₂</span>
          </Formula>
          <Formula className="text-slate-200 leading-6">
            <span>with 4 plays</span>
            <span>=</span>
            <span>best Top 4 split</span>
          </Formula>
          <Formula className="text-slate-400 text-[0.82rem] leading-5">
            <span>with 2-3 plays</span>
            <span>=</span>
            <span>best single pair only</span>
          </Formula>
        </FormulaBlock>

        <FormulaBlock title="Smash Priority" accent="text-orange-300">
          <div className="space-y-0.5 text-[0.95rem] leading-6 text-slate-50">
            <div>smash = (OPS₁ &gt; .950 ∧ H₁ ≥ 7)</div>
            <div className="pl-16 text-slate-300">and</div>
            <div className="pl-14">(OPS₂ &gt; .950 ∧ H₂ ≥ 7)</div>
          </div>
          <Formula className="text-slate-400 text-[0.82rem] leading-5">
            <span>if smash exists</span>
            <span>=</span>
            <span>smash first, leftovers second</span>
          </Formula>
        </FormulaBlock>
      </div>
    </div>
  )
}