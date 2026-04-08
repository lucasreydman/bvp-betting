import type { ReactNode } from 'react'
import { Formula, Fraction, Sup } from './Formula'

function SymbolCard({
  label,
  title,
  description,
  accent,
}: {
  label: string
  title: string
  description: string
  accent: string
}) {
  return (
    <div className="rounded-[1.15rem] border border-slate-700/70 bg-slate-950/80 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(148,163,184,0.06)]">
      <div className={`text-[0.95rem] font-semibold ${accent}`}>{label}</div>
      <div className="mt-1 text-[0.82rem] font-semibold leading-5 text-slate-100">{title}</div>
      <p className="mt-1.5 text-[0.77rem] leading-5 text-slate-400">{description}</p>
    </div>
  )
}

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
    <div className="flex flex-col rounded-[1.25rem] border border-slate-700/60 bg-[linear-gradient(180deg,rgba(2,6,23,0.9),rgba(3,10,28,0.72))] p-4 shadow-[inset_0_1px_0_rgba(148,163,184,0.06)] sm:rounded-[1.35rem]">
      <div className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] sm:tracking-[0.28em] ${accent}`}>{title}</div>
      <div className="flex flex-1 flex-col gap-2.5 text-[0.92rem] leading-[1.6] text-slate-100 sm:text-[0.96rem] sm:leading-[1.55]">{children}</div>
    </div>
  )
}

export default function ScoringLogicContent() {
  return (
    <div className="pb-1">
      <div className="mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Key Symbols</div>
        <p className="mt-1 text-sm leading-6 text-slate-400">These are the inputs that appear throughout the formulas below.</p>
      </div>

      <div className="mb-4 grid grid-cols-2 items-start gap-2.5 lg:grid-cols-4">
        <SymbolCard
          label="AVG"
          title="Career BvP batting"
          description="The batter's historical batting average against today's pitcher. Higher is better."
          accent="text-sky-300"
        />
        <SymbolCard
          label="AB"
          title="Career sample size"
          description="Official at-bats against this pitcher. More AB means the matchup history is more trustworthy."
          accent="text-cyan-300"
        />
        <SymbolCard
          label="P"
          title="Hit probability"
          description="Estimated chance the batter records at least one hit after regression and batting order adjustments."
          accent="text-lime-300"
        />
        <SymbolCard
          label="E[AB]"
          title="Expected at-bats"
          description="Projected chances based on confirmed lineup slot, or an estimated slot when lineup is not yet official."
          accent="text-amber-300"
        />
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-2 xl:grid-cols-3">
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
          <p className="text-[0.8rem] leading-5 text-slate-400">The ranking score rewards both a strong AVG and enough AB to trust the matchup.</p>
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
          <p className="text-[0.8rem] leading-5 text-slate-400">Small samples get pulled toward .320 so a hot but tiny BvP line does not overpower the board.</p>
        </FormulaBlock>

        <FormulaBlock title="Expected At-Bats" accent="text-amber-300">
          <div className="text-[0.92rem] leading-6 text-slate-50 sm:text-[0.95rem]">
            <div>slot = confirmed slot</div>
            <div>or estimated slot</div>
          </div>
          <div className="grid content-start grid-cols-1 gap-x-5 gap-y-1.5 text-[0.88rem] leading-5 text-slate-200 sm:grid-cols-2">
            <div>E[AB] = 4.45, slot ≤ 3</div>
            <div>E[AB] = 4.25, slot = 4</div>
            <div>E[AB] = 4.05, 5 ≤ slot ≤ 6</div>
            <div>E[AB] = 3.85, slot ≥ 7</div>
          </div>
          <p className="text-[0.8rem] leading-5 text-slate-400">Batters near the top of the order are projected for more trips to the plate, which lifts hit probability.</p>
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
          <p className="text-[0.8rem] leading-5 text-slate-400">This is the probability-style view of the matchup, which is why it is useful for building doubles.</p>
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
          <p className="text-[0.8rem] leading-5 text-slate-400">When four plays qualify, the board compares the possible pairings and promotes the strongest lead double.</p>
        </FormulaBlock>

        <FormulaBlock title="Smash Priority" accent="text-orange-300">
          <div className="space-y-0.5 text-[0.92rem] leading-6 text-slate-50 sm:text-[0.95rem]">
            <div>smash = (OPS₁ &gt; .950 ∧ H₁ ≥ 7)</div>
            <div className="pl-6 text-slate-300 sm:pl-16">and</div>
            <div className="pl-4 sm:pl-14">(OPS₂ &gt; .950 ∧ H₂ ≥ 7)</div>
          </div>
          <Formula className="text-slate-400 text-[0.82rem] leading-5">
            <span>if smash exists</span>
            <span>=</span>
            <span>smash first, leftovers second</span>
          </Formula>
          <p className="text-[0.8rem] leading-5 text-slate-400">A Smash Double overrides the normal ordering because both legs clear the stronger OPS and hit-history thresholds.</p>
        </FormulaBlock>
      </div>
    </div>
  )
}