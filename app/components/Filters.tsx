'use client'
import { useId, useState, useEffect, useRef } from 'react'
import type { FilterState, MatchupResult } from '@/lib/types'
import { DEFAULT_FILTERS } from '@/lib/types'
import { generateCSV, generateRecommendedDoublesCSV } from '@/lib/utils'
import type { RecommendedDouble } from '@/lib/utils'


interface Props {
  date: string
  filters: FilterState
  onApply: (filters: FilterState) => void
  matchups: MatchupResult[]
  topPlays?: MatchupResult[]
  recommendedDoubles?: RecommendedDouble[]
}

const DEFAULT_OPS_VALUE = 0.950
const DEFAULT_H_VALUE = 7

export default function Filters({ date, filters, onApply, matchups, topPlays, recommendedDoubles = [] }: Props) {
  const minOpsId = useId()
  const minHId = useId()
  const [opsDisplay, setOpsDisplay] = useState(
    filters.minOPS !== null ? filters.minOPS.toFixed(3) : DEFAULT_OPS_VALUE.toFixed(3)
  )
  const [opsEnabled, setOpsEnabled] = useState(filters.minOPS !== null)
  const [hDisplay, setHDisplay] = useState(
    filters.minH !== null ? String(filters.minH) : String(DEFAULT_H_VALUE)
  )
  const [hEnabled, setHEnabled] = useState(filters.minH !== null)
  const [flash, setFlash] = useState<'apply' | 'reset' | 'export' | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showExportMenu) return
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showExportMenu])

  const flashFor = (key: 'apply' | 'reset' | 'export') => {
    setFlash(key)
    setTimeout(() => setFlash(null), 1500)
  }

  const handleApply = () => {
    onApply({
      minOPS: opsEnabled ? Number(opsDisplay) : null,
      minH: hEnabled ? Number(hDisplay) : null,
    })
    flashFor('apply')
  }

  const handleReset = () => {
    setOpsDisplay(DEFAULT_OPS_VALUE.toFixed(3))
    setOpsEnabled(false)
    setHDisplay(String(DEFAULT_H_VALUE))
    setHEnabled(false)
    onApply(DEFAULT_FILTERS)
    flashFor('reset')
  }

  const downloadCSV = (rows: MatchupResult[], label: string) => {
    const csv = generateCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bvp-${label}-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
    flashFor('export')
  }

  const downloadRecommendedDoublesCSV = (doubles: RecommendedDouble[]) => {
    const csv = generateRecommendedDoublesCSV(doubles)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bvp-recommended-doubles-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
    flashFor('export')
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">

        {/* ── Fixed requirement chips ───────────────────────── */}
        <div className="flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
          <span className="text-xs uppercase tracking-wider text-gray-600 font-semibold mr-0.5 hidden sm:inline">
            Filters
          </span>

          {/* 15 AB chip */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-800 border border-gray-700 text-xs font-mono text-gray-300">
            15 AB
          </span>

          {/* .300 AVG chip */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-800 border border-gray-700 text-xs font-mono text-gray-300">
            .300 AVG
          </span>
        </div>

        {/* ── Divider ───────────────────────────────────────── */}
        <div className="w-px h-5 bg-gray-800 mx-0.5 hidden sm:block" />

        <div className="grid grid-cols-2 gap-2 sm:contents">
          {/* ── OPS filter (optional) ─────────────────────────── */}
          {opsEnabled ? (
            <div className="inline-flex min-w-0 items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-950/60 border border-blue-800/50">
              <label htmlFor={minOpsId} className="text-xs uppercase tracking-wider text-blue-400 font-semibold whitespace-nowrap">
                OPS ≥
              </label>
              <input
                id={minOpsId}
                type="number"
                value={opsDisplay}
                step="0.001"
                onChange={e => setOpsDisplay(e.target.value)}
                onBlur={e => setOpsDisplay(Number(e.target.value).toFixed(3))}
                className="w-14 bg-transparent text-blue-200 text-xs font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setOpsEnabled(false)}
                className="text-blue-600 hover:text-blue-400 transition-colors ml-0.5 leading-none touch-manipulation"
                title="Remove OPS filter"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOpsEnabled(true)}
              className="inline-flex min-w-0 items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-gray-500 hover:text-gray-300 border border-dashed border-gray-700 hover:border-gray-500 transition-colors touch-manipulation"
            >
              <span className="text-gray-600">+</span>
              OPS filter
            </button>
          )}

          {/* ── Hits filter (optional) ────────────────────────── */}
          {hEnabled ? (
            <div className="inline-flex min-w-0 items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-950/60 border border-blue-800/50">
              <label htmlFor={minHId} className="text-xs uppercase tracking-wider text-blue-400 font-semibold whitespace-nowrap">
                H ≥
              </label>
              <input
                id={minHId}
                type="number"
                value={hDisplay}
                step="1"
                min="1"
                onChange={e => setHDisplay(e.target.value)}
                onBlur={e => setHDisplay(String(Math.max(1, Math.round(Number(e.target.value))))) }
                className="w-8 bg-transparent text-blue-200 text-xs font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setHEnabled(false)}
                className="text-blue-600 hover:text-blue-400 transition-colors ml-0.5 leading-none touch-manipulation"
                title="Remove hits filter"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setHEnabled(true)}
              className="inline-flex min-w-0 items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-gray-500 hover:text-gray-300 border border-dashed border-gray-700 hover:border-gray-500 transition-colors touch-manipulation"
            >
              <span className="text-gray-600">+</span>
              Hits filter
            </button>
          )}
        </div>

        {/* ── Spacer ────────────────────────────────────────── */}
        <div className="hidden flex-1 sm:block" />

        {/* ── Action buttons ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-start">
          <button
            type="button"
            onClick={handleApply}
            className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-all touch-manipulation ${
              flash === 'apply'
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {flash === 'apply' ? '✓ Applied' : 'Apply'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className={`w-full px-4 py-2 text-sm font-medium rounded-lg border transition-all touch-manipulation ${
              flash === 'reset'
                ? 'border-green-700 text-green-400'
                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
            }`}
          >
            {flash === 'reset' ? '✓ Reset' : 'Reset'}
          </button>

          <div ref={exportRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setShowExportMenu(prev => !prev)}
              disabled={matchups.length === 0 && !topPlays?.length && recommendedDoubles.length === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg border transition-all disabled:opacity-40 touch-manipulation ${
                flash === 'export'
                  ? 'border-green-700 text-green-400'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              {flash === 'export' ? '✓ Exported' : 'Export'}
              {flash !== 'export' && (
                <svg className="w-3 h-3 text-gray-600" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 8 2 4h8L6 8Z"/>
                </svg>
              )}
            </button>

            {showExportMenu && (
              <div className="absolute bottom-full mb-2 right-0 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-20">
                <button
                  type="button"
                  disabled={recommendedDoubles.length === 0}
                  onClick={() => recommendedDoubles.length > 0 && downloadRecommendedDoublesCSV(recommendedDoubles)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <div className={`text-sm font-medium ${recommendedDoubles[0]?.isSmash ? 'text-orange-400' : 'text-yellow-400'}`}>
                    {recommendedDoubles.length > 1 ? 'Daily + Secondary Doubles' : recommendedDoubles[0]?.isSmash ? 'Smash Double' : 'Daily Double'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{recommendedDoubles.length} double{recommendedDoubles.length === 1 ? '' : 's'}{recommendedDoubles.length > 0 ? ` • ${recommendedDoubles.length * 2} legs` : ''}</div>
                </button>
                <div className="border-t border-gray-800" />
                <button
                  type="button"
                  disabled={!topPlays?.length}
                  onClick={() => topPlays?.length && downloadCSV(topPlays, 'top4')}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="text-sm font-medium text-gray-200">Top 4 Plays</div>
                  <div className="text-xs text-gray-500 mt-0.5">{topPlays?.length ?? 0} rows</div>
                </button>
                <div className="border-t border-gray-800" />
                <button
                  type="button"
                  disabled={matchups.length === 0}
                  onClick={() => matchups.length && downloadCSV(matchups, 'full-list')}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="text-sm font-medium text-gray-200">Full List</div>
                  <div className="text-xs text-gray-500 mt-0.5">{matchups.length} rows</div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
