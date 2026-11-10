import { useId } from 'react'

const W = 100
const H = 32
const PAD = 3

/** Tiny trend line with a soft area fill; flat when there is a single value. */
export function Sparkline({ values, color = 'var(--color-accent-2)', className = '' }) {
  const id = useId()
  if (!values?.length) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = (values.length === 1 ? [values[0], values[0]] : values).map((v, i, arr) => {
    const x = (i / (arr.length - 1)) * W
    const y = max === min ? H / 2 : PAD + (1 - (v - min) / span) * (H - PAD * 2)
    return [x, y]
  })
  const line = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `0,${H} ${line} ${W},${H}`
  const [lastX, lastY] = points[points.length - 1]

  return (
    <svg
      className={`ft-sparkline ${className}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
