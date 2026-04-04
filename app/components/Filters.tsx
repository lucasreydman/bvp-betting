'use client'
import { useId, useState, useEffect, useRef } from 'react'
import type { FilterState, MatchupResult } from '@/lib/types'
import { DEFAULT_FILTERS } from '@/lib/types'
import { formatLocalDate, generateCSV } from '@/lib/utils'
import type { DailyDouble } from '@/lib/utils'

interface Props {
  filters: FilterState
  onApply: (filters: FilterState) => void
  matchups: MatchupResult[]       // full filtered list for CSV export
  top5?: MatchupResult[]          // top 5 plays for CSV export
  dailyDouble?: DailyDouble | null  // daily double legs for CSV export
}

const DEFAULT_OPS_VALUE = 0.700

function initDisplay(f: FilterState): { minAB: string; minOPS: string; minAVG: string } {
  return {
    minAB: String(f.minAB),
    minOPS: f.minOPS !== null ? f.minOPS.toFixed(3) : DEFAULT_OPS_VALUE.toFixed(3),
    minAVG: f.minAVG.toFixed(3),
  }
}

export default function Filters({ filters, onApply, matchups, top5, dailyDouble }: Props) {
  const minAbId = useId()
  const minAvgId = useId()
  const minOpsId = useId()
  const [local, setLocal] = useState(() => initDisplay(filters))
  const [opsEnabled, setOpsEnabled] = useState(filters.minOPS !== null)
  const [flash, setFlash] = useState<'apply' | 'reset' | 'export' | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocal(initDisplay(filters))
    setOpsEnabled(filters.minOPS !== null)
  }, [filters])

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

  const set = (key: keyof typeof local, value: string) => {
    setLocal(prev => ({ ...prev, [key]: value }))
  }

  const parseLocal = (): FilterState => ({
    minAB: Number(local.minAB),
    minOPS: opsEnabled ? Number(local.minOPS) : null,
    minAVG: Number(local.minAVG),
  })

  const handleApply = () => {
    onApply(parseLocal())
    flashFor('apply')
  }

  const handleReset = () => {
    setLocal(initDisplay(DEFAULT_FILTERS))
    setOpsEnabled(DEFAULT_FILTERS.minOPS !== null)
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

  const handleToggleOPS = () => {
    setOpsEnabled(prev => !prev)
  }

  const field = (label: string, key: keyof typeof local, step: string, id: string) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-gray-400">
        {label}
      </label>
      <input
        id={id}
        type="number"
        value={local[key]}
        step={step}
        onChange={e => set(key, e.target.value)}
        onBlur={e => set(key, Number(e.target.value).toFixed(3))}
        className="w-20 bg-gray-800 text-white text-sm px-2 py-1.5 rounded border border-gray-700 focus:outline-none focus:border-blue-500 font-mono"
      />
    </div>
  )

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={minAbId} className="text-xs text-gray-400">Min AB</label>
          <input
            id={minAbId}
            type="number"
            value={local.minAB}
            step="1"
            onChange={e => set('minAB', e.target.value)}
            className="w-20 bg-gray-800 text-white text-sm px-2 py-1.5 rounded border border-gray-700 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
        {field('Min AVG', 'minAVG', '0.001', minAvgId)}
        {opsEnabled ? (
          <div className="flex flex-col gap-1">
            <label htmlFor={minOpsId} className="text-xs text-gray-400 flex items-center gap-1">
              Min OPS
              <button
                type="button"
                onClick={handleToggleOPS}
                className="text-gray-600 hover:text-gray-400 text-xs leading-none p-0.5 touch-manipulation"
                title="Remove OPS filter"
              >
                ✕
              </button>
            </label>
            <input
              id={minOpsId}
              type="number"
              value={local.minOPS}
              step="0.001"
              onChange={e => set('minOPS', e.target.value)}
              onBlur={e => set('minOPS', Number(e.target.value).toFixed(3))}
              className="w-20 bg-gray-800 text-white text-sm px-2 py-1.5 rounded border border-gray-700 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        ) : (
          <div className="flex flex-col justify-end gap-1">
            <button
              type="button"
              onClick={handleToggleOPS}
              className="text-xs text-gray-500 hover:text-gray-300 border border-dashed border-gray-700 hover:border-gray-500 px-2 py-1.5 rounded transition-colors touch-manipulation"
            >
              + OPS filter
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApply}
            className={`flex-1 sm:flex-none px-4 py-2 text-white text-sm font-medium rounded transition-colors touch-manipulation ${
              flash === 'apply' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {flash === 'apply' ? 'Applied ✓' : 'Apply'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className={`flex-1 sm:flex-none px-4 py-2 text-white text-sm font-medium rounded transition-colors touch-manipulation ${
              flash === 'reset' ? 'bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {flash === 'reset' ? 'Reset ✓' : 'Reset'}
          </button>
          <div ref={exportRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setShowExportMenu(prev => !prev)}
              disabled={matchups.length === 0 && !top5?.length && !dailyDouble}
              className={`px-4 py-2 text-white text-sm font-medium rounded transition-colors disabled:opacity-40 touch-manipulation flex items-center gap-1.5 ${
                flash === 'export' ? 'bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {flash === 'export' ? 'Exported ✓' : 'Export CSV'}
              {flash !== 'export' && <span className="text-gray-400 text-xs">▾</span>}
            </button>
            {showExportMenu && (
              <div className="absolute bottom-full mb-1.5 right-0 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-20">
                <button
                  type="button"
                  disabled={!dailyDouble}
                  onClick={() => dailyDouble && downloadCSV([dailyDouble.first, dailyDouble.second], 'daily-double')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="font-medium text-yellow-400">{dailyDouble?.isSmash ? 'Smash Double' : 'Daily Double'}</div>
                  <div className="text-xs text-gray-500">2 legs</div>
                </button>
                <div className="border-t border-gray-700" />
                <button
                  type="button"
                  disabled={!top5?.length}
                  onClick={() => top5?.length && downloadCSV(top5, 'top5')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="font-medium">Top 5 Plays</div>
                  <div className="text-xs text-gray-500">{top5?.length ?? 0} rows</div>
                </button>
                <div className="border-t border-gray-700" />
                <button
                  type="button"
                  disabled={matchups.length === 0}
                  onClick={() => matchups.length && downloadCSV(matchups, 'full-list')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="font-medium">Full List</div>
                  <div className="text-xs text-gray-500">{matchups.length} rows</div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
