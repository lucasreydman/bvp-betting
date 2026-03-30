'use client'
import { useState, useEffect } from 'react'
import type { FilterState, MatchupResult } from '@/lib/types'
import { DEFAULT_FILTERS } from '@/lib/types'
import { generateCSV } from '@/lib/utils'

interface Props {
  filters: FilterState
  onApply: (filters: FilterState) => void
  matchups: MatchupResult[]   // for CSV export (filtered set passed from parent)
}

// Decimal fields need 3 decimal places displayed; integer fields are whole numbers.
const DECIMAL_FIELDS: Array<keyof FilterState> = ['minOPS', 'minSLG', 'minAVG']

function initDisplay(f: FilterState): Record<keyof FilterState, string> {
  return {
    minAB: String(f.minAB),
    minOPS: f.minOPS.toFixed(3),
    minSLG: f.minSLG.toFixed(3),
    minAVG: f.minAVG.toFixed(3),
    minHR: String(f.minHR),
  }
}

export default function Filters({ filters, onApply, matchups }: Props) {
  // Store display values as strings so decimal places are preserved while typing.
  const [local, setLocal] = useState<Record<keyof FilterState, string>>(() => initDisplay(filters))
  const [flash, setFlash] = useState<'apply' | 'reset' | 'export' | null>(null)

  // Sync inputs when parent resets filters externally (e.g. "Reset Filters" in empty table).
  useEffect(() => {
    setLocal(initDisplay(filters))
  }, [filters])

  const flashFor = (key: 'apply' | 'reset' | 'export') => {
    setFlash(key)
    setTimeout(() => setFlash(null), 1500)
  }

  const set = (key: keyof FilterState, value: string) => {
    setLocal(prev => ({ ...prev, [key]: value }))
  }

  const parseLocal = (): FilterState => ({
    minAB: Number(local.minAB),
    minOPS: Number(local.minOPS),
    minSLG: Number(local.minSLG),
    minAVG: Number(local.minAVG),
    minHR: Number(local.minHR),
  })

  const handleApply = () => {
    onApply(parseLocal())
    flashFor('apply')
  }

  const handleReset = () => {
    setLocal(initDisplay(DEFAULT_FILTERS))
    onApply(DEFAULT_FILTERS)
    flashFor('reset')
  }

  const handleExport = () => {
    const csv = generateCSV(matchups)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bvp-matchups-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    flashFor('export')
  }

  const field = (label: string, key: keyof FilterState, step: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">{label}</label>
      <input
        type="number"
        value={local[key]}
        step={step}
        onChange={e => set(key, e.target.value)}
        onBlur={e => {
          // Reformat decimal fields to 3 decimal places on blur
          if (DECIMAL_FIELDS.includes(key)) {
            set(key, Number(e.target.value).toFixed(3))
          }
        }}
        className="w-20 bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-700 focus:outline-none focus:border-blue-500 font-mono"
      />
    </div>
  )

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <div className="flex flex-wrap items-end gap-4">
        {field('Min AB', 'minAB', '1')}
        {field('Min OPS', 'minOPS', '0.001')}
        {field('Min SLG', 'minSLG', '0.001')}
        {field('Min AVG', 'minAVG', '0.001')}
        <div className="flex gap-2 pb-0.5">
          <button
            onClick={handleApply}
            className={`px-4 py-1.5 text-white text-sm font-medium rounded transition-colors ${
              flash === 'apply'
                ? 'bg-green-600'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {flash === 'apply' ? 'Applied ✓' : 'Apply'}
          </button>
          <button
            onClick={handleReset}
            className={`px-4 py-1.5 text-white text-sm font-medium rounded transition-colors ${
              flash === 'reset'
                ? 'bg-green-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {flash === 'reset' ? 'Reset ✓' : 'Reset'}
          </button>
          <button
            onClick={handleExport}
            disabled={matchups.length === 0}
            className={`px-4 py-1.5 text-white text-sm font-medium rounded transition-colors disabled:opacity-40 ${
              flash === 'export'
                ? 'bg-green-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {flash === 'export' ? 'Exported ✓' : 'Export CSV'}
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-2">All filters use AND logic — matchup must pass every threshold.</p>
    </div>
  )
}
