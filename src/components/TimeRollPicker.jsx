import { useCallback, useEffect, useRef } from 'react'
import { animate } from 'animejs'

const ITEM_H = 44
const VISIBLE = 5
const PAD = Math.floor(VISIBLE / 2)

function buildRange(max, step = 1) {
  const items = []
  for (let i = 0; i <= max; i += step) items.push(i)
  return items
}

function snapScroll(el, onSnap) {
  const idx = Math.round(el.scrollTop / ITEM_H)
  const clamped = Math.max(0, Math.min(idx, el.children.length - VISIBLE))
  el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' })
  const valueIdx = clamped + PAD
  const item = el.children[valueIdx]
  if (item) onSnap(Number(item.dataset.value))
}

function RollColumn({ items, value, onChange, label, disabled }) {
  const colRef = useRef(null)
  const scrollTimer = useRef(null)

  const scrollToValue = useCallback(
    (val, smooth = false) => {
      const el = colRef.current
      if (!el) return
      const idx = items.indexOf(val)
      if (idx < 0) return
      el.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'auto' })
    },
    [items],
  )

  useEffect(() => {
    scrollToValue(value)
  }, [value, scrollToValue])

  const handleScroll = () => {
    if (disabled) return
    clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      snapScroll(colRef.current, onChange)
    }, 80)
  }

  const handleItemClick = (val) => {
    if (disabled) return
    onChange(val)
    scrollToValue(val, true)
    if (navigator.vibrate) navigator.vibrate(8)
  }

  return (
    <div className={`ft-roll-col${disabled ? ' ft-roll-col--disabled' : ''}`}>
      <span className="ft-roll-col__label">{label}</span>
      <div className="ft-roll-col__wrap">
        <div className="ft-roll-col__fade ft-roll-col__fade--top" aria-hidden="true" />
        <div className="ft-roll-col__fade ft-roll-col__fade--bottom" aria-hidden="true" />
        <div className="ft-roll-col__highlight" aria-hidden="true" />
        <div
          className="ft-roll-col__scroll"
          ref={colRef}
          onScroll={handleScroll}
          role="listbox"
          aria-label={label}
        >
          {Array(PAD)
            .fill(null)
            .map((_, i) => (
              <div key={`pad-t-${i}`} className="ft-roll-col__item ft-roll-col__item--pad" aria-hidden="true" />
            ))}
          {items.map((val) => (
            <button
              key={val}
              type="button"
              data-value={val}
              className={`ft-roll-col__item${val === value ? ' ft-roll-col__item--active' : ''}`}
              onClick={() => handleItemClick(val)}
              role="option"
              aria-selected={val === value}
            >
              {val.toString().padStart(2, '0')}
            </button>
          ))}
          {Array(PAD)
            .fill(null)
            .map((_, i) => (
              <div key={`pad-b-${i}`} className="ft-roll-col__item ft-roll-col__item--pad" aria-hidden="true" />
            ))}
        </div>
      </div>
    </div>
  )
}

export function TimeRollPicker({ minutes, seconds, onChange, disabled }) {
  const wrapRef = useRef(null)
  const minuteItems = buildRange(5)
  const secondItems = buildRange(55, 5)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    animate(el, {
      opacity: [0, 1],
      y: [16, 0],
      duration: 500,
      ease: 'outExpo',
    })
  }, [])

  const setMinutes = (m) => {
    onChange(m, seconds)
    if (navigator.vibrate) navigator.vibrate(8)
  }

  const setSeconds = (s) => {
    onChange(minutes, s)
    if (navigator.vibrate) navigator.vibrate(8)
  }

  return (
    <div className="ft-roll" ref={wrapRef}>
      <RollColumn
        items={minuteItems}
        value={minutes}
        onChange={setMinutes}
        label="min"
        disabled={disabled}
      />
      <span className="ft-roll__sep" aria-hidden="true">
        :
      </span>
      <RollColumn
        items={secondItems}
        value={seconds}
        onChange={setSeconds}
        label="sec"
        disabled={disabled}
      />
    </div>
  )
}

export function secondsToParts(total) {
  const m = Math.floor(total / 60)
  const s = total % 60
  const snapped = Math.round(s / 5) * 5
  return { minutes: Math.min(m, 5), seconds: snapped >= 60 ? 0 : snapped }
}

export function partsToSeconds(minutes, seconds) {
  return minutes * 60 + seconds
}
