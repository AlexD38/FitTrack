import { useEffect, useMemo, useState } from 'react'
import {
  equipmentLabel,
  exerciseLabel,
  findLibraryExercise,
  groupedLibrary,
} from '../lib/exercises'
import { MUSCLE_GROUPS } from '../lib/muscles'
import { muscleLabel } from '../lib/i18n'
import { useLocale } from '../contexts/LocaleContext'
import { useFitness } from '../contexts/FitnessContext'
import { getAllExerciseNames, getRecentExerciseNames } from '../lib/stats'
import { BottomSheet } from './BottomSheet'
import { FaIcon } from './FaIcon'
import { uiIcons } from '../lib/icons'

const LIBRARY_GROUPS = groupedLibrary()

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

export function ExerciseAutocomplete({ value, onChange, placeholder }) {
  const { locale, t } = useLocale()
  const { sessions } = useFitness()
  const [open, setOpen] = useState(false)
  const [muscleFilter, setMuscleFilter] = useState(null)
  const [query, setQuery] = useState('')

  const history = useMemo(() => getAllExerciseNames(sessions), [sessions])
  const recent = useMemo(() => getRecentExerciseNames(sessions, 5), [sessions])
  const selectedId = findLibraryExercise(value)?.id ?? null

  const groups = useMemo(() => {
    const collator = new Intl.Collator(locale === 'en' ? 'en' : 'fr', { sensitivity: 'base' })
    return LIBRARY_GROUPS.map((g) => ({
      ...g,
      label: locale === 'en' ? g.baseEn : g.baseFr,
    })).sort((a, b) => collator.compare(a.label, b.label))
  }, [locale])

  /** Names typed by the user that aren't library exercises. */
  const customNames = useMemo(
    () => history.filter((n) => n && !findLibraryExercise(n)),
    [history],
  )

  const q = query.trim().toLowerCase()
  const matchesQuery = (text) => !q || text.toLowerCase().includes(q)

  const visibleGroups = useMemo(() => {
    if (muscleFilter === 'history' || muscleFilter === 'recent') return []
    return groups.filter((g) => {
      if (muscleFilter && g.muscle !== muscleFilter) return false
      if (!q) return true
      return (
        g.label.toLowerCase().includes(q) ||
        g.variants.some((v) => exerciseLabel(v, locale).toLowerCase().includes(q))
      )
    })
  }, [groups, muscleFilter, q, locale])

  const visibleCustom =
    muscleFilter == null || muscleFilter === 'history' ? customNames.filter(matchesQuery) : []

  useEffect(() => {
    if (!open) {
      setMuscleFilter(null)
      setQuery('')
    }
  }, [open])

  const pick = (name) => {
    onChange(name)
    setOpen(false)
  }

  const showRecentBlock = (muscleFilter == null && !q && recent.length > 0) || muscleFilter === 'recent'

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
        <input
          className="ft-input ft-exercise-picker__search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('library.searchPlaceholder')}
          autoComplete="off"
          aria-label={t('library.search')}
        />

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
          {customNames.length > 0 && (
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

        <div className="ft-exercise-picker__scroll">
          {showRecentBlock && (
            <div className="ft-exercise-picker__recent">
              <p className="ft-exercise-picker__section-title">{t('journal.recentExercises')}</p>
              <div className="ft-exercise-picker__recent-chips">
                {recent.map((name) => (
                  <button
                    key={`recent-${name}`}
                    type="button"
                    className={`ft-chip ft-exercise-picker__recent-chip${value === name ? ' ft-chip--active' : ''}`}
                    onClick={() => pick(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {visibleCustom.length > 0 && (
            <ul className="ft-exercise-picker__list" role="listbox">
              {visibleCustom.map((name) => (
                <li key={`custom-${name}`}>
                  <button
                    type="button"
                    className={`ft-exercise-picker__item${value === name ? ' ft-exercise-picker__item--selected' : ''}`}
                    onClick={() => pick(name)}
                    role="option"
                    aria-selected={value === name}
                  >
                    <span>{name}</span>
                    <span className="ft-autocomplete__badge">★</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {visibleGroups.length > 0 && muscleFilter == null && (
            <p className="ft-exercise-picker__section-title">{t('library.title')}</p>
          )}

          <ul className="ft-exercise-picker__groups">
            {visibleGroups.map((g) => {
              const single = g.variants.length === 1
              const groupSelected = g.variants.some((v) => v.id === selectedId)
              if (single) {
                const only = g.variants[0]
                return (
                  <li key={g.baseId} className="ft-exercise-group">
                    <button
                      type="button"
                      className={`ft-exercise-group__single${groupSelected ? ' ft-exercise-group__single--selected' : ''}`}
                      onClick={() => pick(exerciseLabel(only, locale))}
                    >
                      <span className="ft-exercise-group__name">{g.label}</span>
                      {only.equipment && (
                        <span className="ft-exercise-group__equip">
                          {capitalize(equipmentLabel(only.equipment, locale))}
                        </span>
                      )}
                    </button>
                  </li>
                )
              }
              return (
                <li
                  key={g.baseId}
                  className={`ft-exercise-group${groupSelected ? ' ft-exercise-group--selected' : ''}`}
                >
                  <span className="ft-exercise-group__name">{g.label}</span>
                  <span className="ft-exercise-group__variants" role="group" aria-label={g.label}>
                    {g.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className={`ft-exercise-group__variant${v.id === selectedId ? ' ft-exercise-group__variant--selected' : ''}`}
                        onClick={() => pick(exerciseLabel(v, locale))}
                        aria-label={exerciseLabel(v, locale)}
                      >
                        {capitalize(equipmentLabel(v.equipment, locale))}
                      </button>
                    ))}
                  </span>
                </li>
              )
            })}
          </ul>

          {visibleGroups.length === 0 && visibleCustom.length === 0 && !showRecentBlock && (
            <p className="ft-exercise-picker__empty">{t('library.empty')}</p>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
