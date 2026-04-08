'use client'

import { useEffect, useState } from 'react'
import { formatCountdownToStart, formatTime } from '@/lib/utils'

interface Props {
  gameTime: string
  /** Rows in the Upcoming table vs In progress table vs settled games */
  variant: 'upcoming' | 'inProgress' | 'settled'
  compact?: boolean
}

const TICK_MS = 30_000

export default function GameTimeCell({ gameTime, variant, compact = false }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [])

  if (compact) {
    const timeLabel = formatTime(gameTime)

    if (variant === 'settled') {
      return (
        <div className="min-w-0 truncate text-xs leading-none whitespace-nowrap text-gray-500">
          <span className="font-medium text-gray-400">Final</span>
          <span className="mx-1 text-gray-700">•</span>
          <span>{timeLabel}</span>
        </div>
      )
    }

    if (variant === 'inProgress') {
      return (
        <div className="min-w-0 truncate text-xs leading-none whitespace-nowrap text-gray-500">
          <span className="font-medium text-amber-400">Live</span>
          <span className="mx-1 text-gray-700">•</span>
          <span>{timeLabel}</span>
        </div>
      )
    }

    const countdown = formatCountdownToStart(gameTime, now)

    return (
      <div className="min-w-0 truncate text-xs leading-none whitespace-nowrap text-gray-500">
        <span className="text-sky-300/90">{timeLabel}</span>
        {countdown && (
          <>
            <span className="mx-1 text-gray-700">•</span>
            <span>{countdown}</span>
          </>
        )}
      </div>
    )
  }

  if (variant === 'settled') {
    return (
      <div className="text-xs leading-snug">
        <span className="font-medium text-gray-400">Final</span>
        <span className="mt-0.5 block text-gray-500">{formatTime(gameTime)}</span>
      </div>
    )
  }

  if (variant === 'inProgress') {
    return (
      <div className="text-xs leading-snug">
        <span className="font-medium text-amber-400">Live</span>
        <span className="mt-0.5 block text-gray-500">
          Started {formatTime(gameTime)}
        </span>
      </div>
    )
  }

  const countdown = formatCountdownToStart(gameTime, now)

  return (
    <div className="text-xs leading-snug text-gray-400">
      <span className="text-sky-300/90">{formatTime(gameTime)}</span>
      {countdown && <span className="mt-0.5 block text-gray-500">{countdown}</span>}
    </div>
  )
}
