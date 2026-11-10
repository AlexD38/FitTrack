import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocale } from '../contexts/LocaleContext'
import { equipmentLabel } from '../lib/exercises'

const AUTO_PICK_SECONDS = 10
const EQUIPMENT_ORDER = ['machine', 'barbell', 'dumbbell', 'cable', 'bodyweight']

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

/** Machine when the exercise has one, otherwise the exercise's own default variant. */
function defaultVariant(variants) {
  return variants.find((v) => v.equipment === 'machine') ?? variants[0]
}

/**
 * Centred modal asking which equipment to use for an exercise. The default variant is picked
 * automatically after AUTO_PICK_SECONDS without a choice.
 */
export function EquipmentChoice({ title, variants, onPick, onCancel }) {
  const { locale, t } = useLocale()
  const [secondsLeft, setSecondsLeft] = useState(AUTO_PICK_SECONDS)
  const fallback = defaultVariant(variants)
  const ordered = [...variants].sort(
    (a, b) => EQUIPMENT_ORDER.indexOf(a.equipment) - EQUIPMENT_ORDER.indexOf(b.equipment),
  )
  const latest = useRef({ onPick, onCancel, fallback })

  useEffect(() => {
    latest.current = { onPick, onCancel, fallback }
  })

  useEffect(() => {
    const started = Date.now()
    const id = window.setInterval(() => {
      const left = AUTO_PICK_SECONDS - Math.floor((Date.now() - started) / 1000)
      if (left <= 0) {
        window.clearInterval(id)
        latest.current.onPick(latest.current.fallback)
        return
      }
      setSecondsLeft(left)
    }, 250)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    // Capture on window so Escape closes only this modal, not the picker sheet underneath.
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      latest.current.onCancel()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  return createPortal(
    <div className="ft-equip" role="presentation">
      <button
        type="button"
        className="ft-equip__backdrop"
        aria-label={t('common.close')}
        onClick={onCancel}
      />
      <div className="ft-equip__card" role="dialog" aria-modal="true" aria-labelledby="ft-equip-title">
        <p className="ft-equip__eyebrow">{t('journal.equipmentQuestion')}</p>
        <h2 id="ft-equip-title" className="ft-equip__title">
          {title}
        </h2>
        <div className="ft-equip__choices">
          {ordered.map((v) => {
            const isDefault = v.id === fallback.id
            return (
              <button
                key={v.id}
                type="button"
                className={`ft-equip__choice${isDefault ? ' ft-equip__choice--default' : ''}`}
                onClick={() => onPick(v)}
                style={isDefault ? { '--equip-duration': `${AUTO_PICK_SECONDS}s` } : undefined}
              >
                {isDefault && <span className="ft-equip__progress" aria-hidden="true" />}
                <span className="ft-equip__choice-label">
                  {capitalize(equipmentLabel(v.equipment, locale))}
                </span>
              </button>
            )
          })}
        </div>
        <p className="ft-equip__hint" aria-live="polite">
          {t('journal.equipmentAuto')
            .replace('{equipment}', capitalize(equipmentLabel(fallback.equipment, locale)))
            .replace('{n}', secondsLeft)}
        </p>
      </div>
    </div>,
    document.body,
  )
}
