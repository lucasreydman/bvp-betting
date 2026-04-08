import type { ReactNode } from 'react'

export const MATH_FONT_STACK = '"Cambria Math", "STIX Two Text", "Times New Roman", serif'

interface FormulaProps {
  children: ReactNode
  inline?: boolean
  className?: string
}

export function Formula({ children, inline = false, className }: FormulaProps) {
  const baseClass = inline
    ? 'inline-flex items-center flex-wrap gap-1 align-middle whitespace-nowrap'
    : 'flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.88rem] leading-6 sm:flex-nowrap sm:gap-1 sm:whitespace-nowrap sm:overflow-x-auto sm:text-[0.95rem]'

  return (
    <span
      className={`${baseClass} ${className ?? ''}`.trim()}
      style={{ fontFamily: MATH_FONT_STACK }}
    >
      {children}
    </span>
  )
}

interface FractionProps {
  top: ReactNode
  bottom: ReactNode
  className?: string
}

export function Fraction({ top, bottom, className }: FractionProps) {
  return (
    <span className={`inline-flex flex-col items-center justify-center align-middle leading-none shrink-0 ${className ?? ''}`.trim()}>
      <span className="px-1 border-b border-current">{top}</span>
      <span className="px-1 pt-0.5">{bottom}</span>
    </span>
  )
}

interface SupProps {
  children: ReactNode
}

export function Sup({ children }: SupProps) {
  return <sup className="text-[0.7em] leading-none align-super">{children}</sup>
}