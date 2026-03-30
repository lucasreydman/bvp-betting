'use client'
import { useState } from 'react'
import type { FilterState, MatchupResult } from '@/lib/types'
import { DEFAULT_FILTERS } from '@/lib/types'
import { generateCSV } from '@/lib/utils'

interface Props {
  filters: FilterState
  onApply: (filters: FilterState) => void
  matchups: MatchupResult[]   // for CSV export (filtered set passed from parent)
}

export default function Filters({ filters, onApply, matchups }: Props) {
  const [local, setLocal] = useState<FilterState>(filters)

  const set = (key: keyof FilterState, value: string) => {
    setLocal(prev => ({ ...prev, [key]: Number(value) }))
  }

  const handleReset = () => {
    setLocal(DEFAULT_FILTERS)
    onApply(DEFAULT_FILTERS)
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
  }

  const field = (label: string, key: keyof FilterState, step: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">{label}</label>
      <input
        type="number"
        value={local[key]}
        step={step}
        onChange={e => set(key, e.target.value)}
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
        {field('Min HR', 'minHR', '1')}
        <div className="flex gap-2 pb-0.5">
          <button
            onClick={() => onApply(local)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleExport}
            disabled={matchups.length === 0}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-sm font-medium rounded transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-2">All filters use AND logic — matchup must pass every threshold.</p>
    </div>
  )
}
