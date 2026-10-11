import { useEffect, useMemo, useState } from 'react'
import { EXERCISE_LIBRARY, exerciseLabel } from '../lib/exercises'
import { MUSCLE_GROUPS } from '../lib/muscles'
import { muscleLabel } from '../lib/i18n'
import { useLocale } from '../contexts/LocaleContext'
import { useFitness } from '../contexts/FitnessContext'
import { getAllExerciseNames, getRecentExerciseNames } from '../lib/stats'
import { BottomSheet } from './BottomSheet'
import { FaIcon } from './FaIcon'
import { uiIcons } from '../lib/icons'

export function ExerciseAutocomplete({ value, onChange, placeholder }) {
  const { locale, t } = useLocale()
  const { sessions } = useFitness()
  const [open, setOpen] = useState(false)
  const [muscleFilter, setMuscleFilter] = useState(null)

  const history = useMemo(() => getAllExerciseNames(sessions), [sessions])
  const recent = useMemo(() => getRecentExerciseNames(sessions, 5), [sessions])

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
    if (muscleFilter === 'recent') {
      return recent.map((name) => ({ name, muscle: null, source: 'recent' }))
    }
    return options.filter((o) => o.muscle === muscleFilter)
  }, [options, muscleFilter, recent])

  useEffect(() => {
    if (!open) setMuscleFilter(null)
  }, [open])

  const pick = (name) => {
    onChange(name)
    setOpen(false)
  }

  const showRecentBlock = muscleFilter == null && recent.length > 0

  return (
    <div className="ft-exercise-picker">
      <div className="ft-exercise-picker__field">
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
          <FaIcon icon={uiIcons.chevronDown} className="ft-exercise-picker__browse-icon" />
        </button>
      </div>

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
          {recent.length > 0 && (
            <button
              type="button"
              className={`ft-chip${muscleFilter === 'recent' ? ' ft-chip--active' : ''}`}
              onClick={() => setMuscleFilter('recent')}
            >
              {t('journal.recentExercises')}
            </button>
          )}
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

        {showRecentBlock && (
          <div className="ft-exercise-picker__recent">
            <p className="ft-exercise-picker__section-title">{t('journal.recentExercises')}</p>
            <ul className="ft-exercise-picker__list ft-exercise-picker__list--compact" role="listbox">
              {recent.map((name) => (
                <li key={`recent-${name}`}>
                  <button
                    type="button"
                    className={`ft-exercise-picker__item${value === name ? ' ft-exercise-picker__item--selected' : ''}`}
                    onClick={() => pick(name)}
                    role="option"
                    aria-selected={value === name}
                  >
                    <span>{name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {muscleFilter == null && (
          <p className="ft-exercise-picker__section-title">{t('library.title')}</p>
        )}

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
