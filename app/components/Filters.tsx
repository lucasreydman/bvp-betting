'use client'
import { useId, useState, useEffect, useRef } from 'react'
import type { FilterState, MatchupResult } from '@/lib/types'
import { DEFAULT_FILTERS } from '@/lib/types'
import { formatLocalDate, generateCSV } from '@/lib/utils'
import type { DailyDouble } from '@/lib/utils'


interface Props {
  filters: FilterState
  onApply: (filters: FilterState) => void
  matchups: MatchupResult[]
  top5?: MatchupResult[]
  dailyDouble?: DailyDouble | null
}

const DEFAULT_OPS_VALUE = 0.950
const DEFAULT_H_VALUE = 7

export default function Filters({ filters, onApply, matchups, top5, dailyDouble }: Props) {
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
    a.download = `bvp-${label}-${formatLocalDate()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
    flashFor('export')
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 mb-4">
      <div className="flex flex-wrap items-center gap-2">

        {/* ── Fixed requirement chips ───────────────────────── */}
        <div className="flex items-center gap-1.5">
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

        {/* ── OPS filter (optional) ─────────────────────────── */}
        {opsEnabled ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/60 border border-blue-800/50">
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
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-gray-500 hover:text-gray-300 border border-dashed border-gray-700 hover:border-gray-500 transition-colors touch-manipulation"
          >
            <span className="text-gray-600">+</span>
            OPS filter
          </button>
        )}

        {/* ── Hits filter (optional) ────────────────────────── */}
        {hEnabled ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/60 border border-blue-800/50">
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
              onBlur={e => setHDisplay(String(Math.max(1, Math.round(Number(e.target.value)))))}
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
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-gray-500 hover:text-gray-300 border border-dashed border-gray-700 hover:border-gray-500 transition-colors touch-manipulation"
          >
            <span className="text-gray-600">+</span>
            Hits filter
          </button>
        )}

        {/* ── Spacer ────────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ── Action buttons ────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApply}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all touch-manipulation ${
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
            className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-all touch-manipulation ${
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
              disabled={matchups.length === 0 && !top5?.length && !dailyDouble}
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
                  disabled={!dailyDouble}
                  onClick={() => dailyDouble && downloadCSV([dailyDouble.first, dailyDouble.second], 'recommended-double')}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <div className={`text-sm font-medium ${dailyDouble?.isSmash ? 'text-orange-400' : 'text-sky-400'}`}>
                    {dailyDouble?.isSmash ? 'Smash Double' : 'Recommended Double'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">2 legs</div>
                </button>
                <div className="border-t border-gray-800" />
                <button
                  type="button"
                  disabled={!top5?.length}
                  onClick={() => top5?.length && downloadCSV(top5, 'top5')}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="text-sm font-medium text-gray-200">Top 5 Plays</div>
                  <div className="text-xs text-gray-500 mt-0.5">{top5?.length ?? 0} rows</div>
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
