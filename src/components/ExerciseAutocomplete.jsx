import { useEffect, useMemo, useState } from 'react'
import { EXERCISE_LIBRARY, exerciseLabel } from '../lib/exercises'
import { MUSCLE_GROUPS } from '../lib/muscles'
import { muscleLabel } from '../lib/i18n'
import { useLocale } from '../contexts/LocaleContext'
import { useFitness } from '../contexts/FitnessContext'
import { getAllExerciseNames } from '../lib/stats'
import { BottomSheet } from './BottomSheet'

export function ExerciseAutocomplete({ value, onChange, placeholder }) {
  const { locale, t } = useLocale()
  const { sessions } = useFitness()
  const [open, setOpen] = useState(false)
  const [muscleFilter, setMuscleFilter] = useState(null)

  const history = useMemo(() => getAllExerciseNames(sessions), [sessions])

  const options = useMemo(() => {
    const fromLib = EXERCISE_LIBRARY.map((ex) => ({
      name: exerciseLabel(ex, locale),
      muscle: ex.muscle,
      source: 'library',
    }))
    const fromHistory = history
      .filter((n) => n && !fromLib.some((e) => e.name.toLowerCase() === n.toLowerCase()))
      .map((name) => ({ name, muscle: null, source: 'history' }))
    const collator = new Intl.Collator(locale === 'en' ? 'en' : 'fr', { sensitivity: 'base' })
    return [...fromHistory, ...fromLib].sort((a, b) => collator.compare(a.name, b.name))
  }, [locale, history])

  const filtered = useMemo(() => {
    if (!muscleFilter) return options
    if (muscleFilter === 'history') return options.filter((o) => o.source === 'history')
    return options.filter((o) => o.muscle === muscleFilter)
  }, [options, muscleFilter])

  useEffect(() => {
    if (!open) setMuscleFilter(null)
  }, [open])

  const pick = (name) => {
    onChange(name)
    setOpen(false)
  }

  return (
    <div className="ft-exercise-picker">
      <input
        className="ft-input ft-exercise-picker__input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('journal.exerciseName')}
        autoComplete="off"
        aria-label={t('journal.exerciseName')}
      />
      <button
        type="button"
        className="ft-exercise-picker__browse"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('dashboard.selectExercise')}
        title={t('dashboard.selectExercise')}
      >
        ▾
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={t('dashboard.selectExercise')}>
        <p className="ft-exercise-picker__compose-hint">{t('journal.exerciseRenameHint')}</p>

        <div className="ft-exercise-picker__filters" role="tablist">
          <button
            type="button"
            className={`ft-chip${muscleFilter == null ? ' ft-chip--active' : ''}`}
            onClick={() => setMuscleFilter(null)}
          >
            {t('common.all')}
          </button>
          {history.length > 0 && (
            <button
              type="button"
              className={`ft-chip${muscleFilter === 'history' ? ' ft-chip--active' : ''}`}
              onClick={() => setMuscleFilter('history')}
            >
              ★
            </button>
          )}
          {MUSCLE_GROUPS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`ft-chip${muscleFilter === m.id ? ' ft-chip--active' : ''}`}
              onClick={() => setMuscleFilter(m.id)}
              style={
                muscleFilter === m.id ? { borderColor: m.color, color: m.color } : undefined
              }
            >
              {muscleLabel(locale, m.id)}
            </button>
          ))}
        </div>

        <ul className="ft-exercise-picker__list" role="listbox">
          {filtered.map((s) => (
            <li key={`${s.source}-${s.name}`}>
              <button
                type="button"
                className={`ft-exercise-picker__item${value === s.name ? ' ft-exercise-picker__item--selected' : ''}`}
                onClick={() => pick(s.name)}
                role="option"
                aria-selected={value === s.name}
              >
                <span>{s.name}</span>
                {s.source === 'history' && <span className="ft-autocomplete__badge">★</span>}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </div>
  )
}
