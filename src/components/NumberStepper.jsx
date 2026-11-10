import { FaIcon } from './FaIcon'
import { uiIcons } from '../lib/icons'

function toNumber(value, fallback = 0) {
  if (value === '' || value == null) return fallback
  const n = Number(value)
  return Number.isNaN(n) ? fallback : n
}

function roundToStep(value, step) {
  if (!step) return value
  const precision = String(step).includes('.') ? String(step).split('.')[1].length : 0
  const rounded = Math.round(value / step) * step
  return Number(rounded.toFixed(precision))
}

function formatValue(value, step) {
  if (value === '' || value == null) return '0'
  const n = Number(value)
  if (Number.isNaN(n)) return '0'
  const precision = step && String(step).includes('.') ? String(step).split('.')[1].length : 0
  return precision > 0 ? n.toFixed(precision) : String(n)
}

/**
 * Shared − / value / + counter for weight, reps, RPE, and weigh-ins.
 */
export function NumberStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  emptyAs = 0,
  ariaLabel,
  className = '',
  valueStyle,
  size = 'md',
}) {
  const numeric = toNumber(value, emptyAs)
  const atMin = numeric <= min
  const atMax = numeric >= max

  const bump = (dir) => {
    const next = roundToStep(numeric + dir * step, step)
    const clamped = Math.min(max, Math.max(min, next))
    onChange(clamped)
  }

  return (
    <div
      className={`ft-stepper ft-stepper--${size}${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="ft-stepper__btn"
        onClick={() => bump(-1)}
        disabled={atMin}
        aria-label={`${ariaLabel ?? ''} −`.trim()}
      >
        <FaIcon icon={uiIcons.minus} className="ft-stepper__icon" />
      </button>
      <span className="ft-stepper__value" style={valueStyle} aria-live="polite">
        {formatValue(numeric, step)}
      </span>
      <button
        type="button"
        className="ft-stepper__btn"
        onClick={() => bump(1)}
        disabled={atMax}
        aria-label={`${ariaLabel ?? ''} +`.trim()}
      >
        <FaIcon icon={uiIcons.add} className="ft-stepper__icon" />
      </button>
    </div>
  )
}
