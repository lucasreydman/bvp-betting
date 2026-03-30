'use client'

import { useEffect, useState } from 'react'
import { formatCountdownToStart, formatTime } from '@/lib/utils'

interface Props {
  gameTime: string
  /** Rows in the Upcoming table vs In progress table */
  variant: 'upcoming' | 'inProgress'
}

const TICK_MS = 30_000

export default function GameTimeCell({ gameTime, variant }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [])

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
