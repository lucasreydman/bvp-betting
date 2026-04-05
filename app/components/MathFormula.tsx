import katex from 'katex'

interface Props {
  expression: string
  inline?: boolean
  className?: string
}

export default function MathFormula({ expression, inline = false, className }: Props) {
  const html = katex.renderToString(expression, {
    displayMode: !inline,
    throwOnError: false,
    strict: 'ignore',
  })

  if (inline) {
    return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  }

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}