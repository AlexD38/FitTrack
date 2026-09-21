import { useMemo, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { SettingsButton } from '../components/SettingsMenu'
import { BodyMuscleMap } from '../components/BodyMuscleMap'
import { EXERCISE_LIBRARY, exerciseLabel } from '../lib/exercises'
import { MUSCLE_GROUPS, getMuscleColor } from '../lib/muscles'
import { muscleLabel } from '../lib/i18n'
import { useLocale } from '../contexts/LocaleContext'

export function LibraryPage({ onOpenSettings }) {
  const { locale, t } = useLocale()
  const [muscleFilter, setMuscleFilter] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')

  const exercises = useMemo(() => {
    const collator = new Intl.Collator(locale === 'en' ? 'en' : 'fr', { sensitivity: 'base' })
    const q = query.trim().toLowerCase()
    return EXERCISE_LIBRARY.filter((ex) => {
      if (muscleFilter && ex.muscle !== muscleFilter) return false
      if (!q) return true
      const name = exerciseLabel(ex, locale).toLowerCase()
      return name.includes(q) || ex.id.includes(q)
    }).sort((a, b) => collator.compare(exerciseLabel(a, locale), exerciseLabel(b, locale)))
  }, [locale, muscleFilter, query])

  const selected = selectedId ? EXERCISE_LIBRARY.find((ex) => ex.id === selectedId) : null
  const activeMuscles = selected
    ? [selected.muscle]
    : muscleFilter
      ? [muscleFilter]
      : []

  const selectExercise = (ex) => {
    setSelectedId(ex.id)
    setMuscleFilter(ex.muscle)
  }

  return (
    <>
      <PageHeader title={t('library.title')} actions={<SettingsButton onClick={onOpenSettings} />} />

      <section className="ft-section ft-glass ft-glass--pad ft-library__map">
        <p className="ft-library__map-hint">
          {selected
            ? `${exerciseLabel(selected, locale)} → ${muscleLabel(locale, selected.muscle)}`
            : muscleFilter
              ? t('library.filterHint')
              : t('library.pickHint')}
        </p>
        <BodyMuscleMap active={activeMuscles} size="md" />
        {selected && (
          <p className="ft-library__selected-muscle" style={{ color: getMuscleColor(selected.muscle) }}>
            {muscleLabel(locale, selected.muscle)}
          </p>
        )}
      </section>

      <div className="ft-field">
        <label className="ft-field__label" htmlFor="ft-library-search">
          {t('library.search')}
        </label>
        <input
          id="ft-library-search"
          className="ft-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('library.searchPlaceholder')}
          autoComplete="off"
        />
      </div>

      <div className="ft-library__filters" role="tablist" aria-label={t('journal.muscles')}>
        <button
          type="button"
          className={`ft-chip${muscleFilter == null ? ' ft-chip--active' : ''}`}
          onClick={() => {
            setMuscleFilter(null)
            setSelectedId(null)
          }}
        >
          {t('common.all')}
        </button>
        {MUSCLE_GROUPS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`ft-chip${muscleFilter === m.id ? ' ft-chip--active' : ''}`}
            onClick={() => {
              setMuscleFilter(m.id)
              setSelectedId(null)
            }}
            style={
              muscleFilter === m.id ? { borderColor: m.color, color: m.color } : undefined
            }
          >
            {muscleLabel(locale, m.id)}
          </button>
        ))}
      </div>

      <ul className="ft-library__list">
        {exercises.map((ex) => {
          const name = exerciseLabel(ex, locale)
          const active = selectedId === ex.id
          return (
            <li key={ex.id}>
              <button
                type="button"
                className={`ft-library__item${active ? ' ft-library__item--active' : ''}`}
                onClick={() => selectExercise(ex)}
              >
                <span className="ft-library__item-name">{name}</span>
                <span
                  className="ft-library__item-muscle"
                  style={{ color: getMuscleColor(ex.muscle) }}
                >
                  {muscleLabel(locale, ex.muscle)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {exercises.length === 0 && (
        <p className="ft-empty" style={{ marginTop: 'var(--space-4)' }}>
          {t('library.empty')}
        </p>
      )}
    </>
  )
}
