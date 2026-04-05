'use client'
import { useState, useEffect, useRef } from 'react'

interface Props {
  text: string
  width?: string
  align?: 'center' | 'left' | 'right'  // left = extends right from button, right = extends left
}

export default function InfoTooltip({ text, width = 'w-64', align = 'center' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  // Close when tapping anywhere outside on mobile
  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [open])

  return (
    <span ref={ref} className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="flex items-center justify-center w-3.5 h-3.5 rounded-full border border-gray-600 text-gray-500 text-[9px] font-bold cursor-pointer leading-none select-none hover:border-gray-400 hover:text-gray-300 transition-colors"
        aria-label="More information"
      >
        i
      </button>
      {open && (
        <span className={`pointer-events-none absolute bottom-full mb-2 ${width} z-20 ${align === 'right' ? 'right-0' : align === 'left' ? 'left-0' : 'left-1/2 -translate-x-1/2'}`}>
          <span className="block bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-[11px] leading-4 shadow-xl whitespace-normal break-words normal-case tracking-normal font-normal">
            {text}
          </span>
        </span>
      )}
    </span>
  )
}
