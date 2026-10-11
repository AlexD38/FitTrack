import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { GlassCard } from './GlassCard'

export function KpiCard({ label, value, sub }) {
  const valueRef = useRef(null)

  useEffect(() => {
    const el = valueRef.current
    if (!el || typeof value !== 'number') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      el.textContent = value.toLocaleString()
      return
    }
    const obj = { val: 0 }
    animate(obj, {
      val: value,
      duration: 800,
      ease: 'outExpo',
      onUpdate: () => {
        el.textContent = Math.round(obj.val).toLocaleString()
      },
    })
  }, [value])

  return (
    <GlassCard className="ft-kpi">
      <p className="ft-kpi__label">{label}</p>
      <p className="ft-kpi__value" ref={valueRef}>
        {typeof value === 'number' ? '0' : value}
      </p>
      {sub && <p className="ft-kpi__sub">{sub}</p>}
    </GlassCard>
  )
}
