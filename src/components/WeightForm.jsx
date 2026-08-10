import { useState } from 'react'
import { useLocale } from '../contexts/LocaleContext'
import { useFitness } from '../contexts/FitnessContext'

export function WeightForm({ onSave, onCancel }) {
  const { t } = useLocale()
  const { settings } = useFitness()
  const unit = settings.weightUnit ?? 'kg'
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!weight) return
    onSave({ date, weight: Number(weight), note })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="ft-field">
        <label className="ft-field__label">{t('weight.date')}</label>
        <input
          className="ft-input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div className="ft-field">
        <label className="ft-field__label">
          {t('weight.weight')} ({unit})
        </label>
        <input
          className="ft-input"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          required
        />
      </div>
      <div className="ft-field">
        <label className="ft-field__label">{t('weight.note')}</label>
        <input className="ft-input" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="ft-btn-row">
        <button type="button" className="ft-btn ft-btn--secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="submit" className="ft-btn ft-btn--primary">
          {t('common.save')}
        </button>
      </div>
    </form>
  )
}
