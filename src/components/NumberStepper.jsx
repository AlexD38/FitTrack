import { useEffect, useRef, useState } from 'react'
import { FaIcon } from './FaIcon'
import { uiIcons } from '../lib/icons'

const HOLD_DELAY_MS = 380
const HOLD_START_INTERVAL_MS = 140
const HOLD_MIN_INTERVAL_MS = 45

function toNumber(value, fallback = 0) {
  if (value === '' || value == null) return fallback
  const n = Number(value)
  return Number.isNaN(n) ? fallback : n
}

function stepPrecision(step) {
  const s = String(step)
  return s.includes('.') ? s.split('.')[1].length : 0
}

function roundToStep(value, step) {
  if (!step) return value
  return Number((Math.round(value / step) * step).toFixed(stepPrecision(step)))
}

function formatValue(value, step) {
  const n = Number(value)
  if (Number.isNaN(n)) return '0'
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(Math.max(1, stepPrecision(step)))
}

/**
 * − / value / + counter. Hold a button to repeat (accelerating);
 * tap the value to type a number directly.
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
  editable = true,
}) {
  const numeric = toNumber(value, emptyAs)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const holdRef = useRef({ timeout: null, interval: null, repeated: false, stop: null })
  // Latest props for hold timers, which outlive the render that started them.
  const latestRef = useRef({ numeric, onChange, step, min, max })

  useEffect(() => {
    latestRef.current = { numeric, onChange, step, min, max }
  })

  const clamp = (n) => Math.min(max, Math.max(min, n))

  if (!holdRef.current.stop) {
    holdRef.current.stop = () => {
      const h = holdRef.current
      clearTimeout(h.timeout)
      clearTimeout(h.interval)
      h.timeout = null
      h.interval = null
      window.removeEventListener('pointerup', h.stop)
    }
  }
  const stopHold = holdRef.current.stop

  useEffect(() => stopHold, [stopHold])

  /** Returns false once the value is pinned at min/max. */
  const bump = (dir) => {
    const cur = latestRef.current
    const next = Math.min(cur.max, Math.max(cur.min, roundToStep(cur.numeric + dir * cur.step, cur.step)))
    if (next === cur.numeric) return false
    cur.numeric = next
    cur.onChange(next)
    return true
  }

  const startHold = (dir) => {
    stopHold()
    holdRef.current.repeated = false
    // Disabled buttons (pinned at min/max) stop firing pointer events, so listen globally too.
    window.addEventListener('pointerup', stopHold)
    holdRef.current.timeout = setTimeout(() => {
      let delay = HOLD_START_INTERVAL_MS
      const tick = () => {
        holdRef.current.repeated = true
        if (!bump(dir)) {
          stopHold()
          return
        }
        delay = Math.max(HOLD_MIN_INTERVAL_MS, delay * 0.85)
        holdRef.current.interval = setTimeout(tick, delay)
      }
      tick()
    }, HOLD_DELAY_MS)
  }

  const holdHandlers = (dir) => ({
    onPointerDown: (e) => {
      if (e.button !== undefined && e.button !== 0) return
      startHold(dir)
    },
    onPointerUp: stopHold,
    onPointerLeave: stopHold,
    onPointerCancel: stopHold,
    onContextMenu: (e) => e.preventDefault(),
    onClick: () => {
      // A hold already applied its repeats — don't add an extra step on release.
      if (holdRef.current.repeated) {
        holdRef.current.repeated = false
        return
      }
      bump(dir)
    },
  })

  const startEditing = () => {
    if (!editable) return
    setDraft(formatValue(numeric, step))
    setEditing(true)
  }

  const commitDraft = () => {
    const parsed = Number(String(draft).replace(',', '.'))
    if (draft !== '' && !Number.isNaN(parsed)) onChange(clamp(parsed))
    setEditing(false)
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
        disabled={numeric <= min}
        aria-label={`${ariaLabel ?? ''} −`.trim()}
        {...holdHandlers(-1)}
      >
        <FaIcon icon={uiIcons.minus} className="ft-stepper__icon" />
      </button>
      {editing ? (
        <input
          className="ft-stepper__value ft-stepper__input"
          style={valueStyle}
          type="text"
          inputMode={stepPrecision(step) > 0 ? 'decimal' : 'numeric'}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') setEditing(false)
          }}
          aria-label={ariaLabel}
        />
      ) : (
        <button
          type="button"
          className="ft-stepper__value"
          style={valueStyle}
          onClick={startEditing}
          aria-live="polite"
          aria-label={ariaLabel ? `${ariaLabel}: ${formatValue(numeric, step)}` : undefined}
        >
          {formatValue(numeric, step)}
        </button>
      )}
      <button
        type="button"
        className="ft-stepper__btn"
        disabled={numeric >= max}
        aria-label={`${ariaLabel ?? ''} +`.trim()}
        {...holdHandlers(1)}
      >
        <FaIcon icon={uiIcons.add} className="ft-stepper__icon" />
      </button>
    </div>
  )
}
