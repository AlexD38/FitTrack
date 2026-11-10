import { useMemo, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { SettingsButton } from '../components/SettingsMenu'
import { BodyMuscleMap } from '../components/BodyMuscleMap'
import { ExerciseThumb } from '../components/ExerciseThumb'
import { EmptyState } from '../components/EmptyState'
import { equipmentLabel, exerciseLabel, groupedLibrary } from '../lib/exercises'
import { MUSCLE_GROUPS, getMuscleColor } from '../lib/muscles'
import { muscleLabel } from '../lib/i18n'
import { useLocale } from '../contexts/LocaleContext'

const LIBRARY_GROUPS = groupedLibrary()

function groupLabel(group, locale) {
  return locale === 'en' ? group.baseEn : group.baseFr
}

function equipmentList(group, locale) {
  const labels = group.variants.map((v) => v.equipment).filter(Boolean).map((e) => equipmentLabel(e, locale))
  return labels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(' · ')
}

export function LibraryPage({ onOpenSettings }) {
  const { locale, t } = useLocale()
  const [muscleFilter, setMuscleFilter] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')

  const exercises = useMemo(() => {
    const collator = new Intl.Collator(locale === 'en' ? 'en' : 'fr', { sensitivity: 'base' })
    const q = query.trim().toLowerCase()
    return LIBRARY_GROUPS.filter((g) => {
      if (muscleFilter && g.muscle !== muscleFilter) return false
      if (!q) return true
      return (
        groupLabel(g, locale).toLowerCase().includes(q) ||
        g.variants.some((v) => exerciseLabel(v, locale).toLowerCase().includes(q))
      )
    }).sort((a, b) => collator.compare(groupLabel(a, locale), groupLabel(b, locale)))
  }, [locale, muscleFilter, query])

  const selected = selectedId ? LIBRARY_GROUPS.find((g) => g.baseId === selectedId) : null
  const activeMuscles = selected
    ? [selected.muscle]
    : muscleFilter
      ? [muscleFilter]
      : []

  const selectExercise = (group) => {
    setSelectedId(group.baseId)
    setMuscleFilter(group.muscle)
  }

  return (
    <>
      <PageHeader title={t('library.title')} actions={<SettingsButton onClick={onOpenSettings} />} />

      <section className="ft-section ft-glass ft-glass--pad ft-library__map">
        <p className="ft-library__map-hint">
          {selected
            ? `${groupLabel(selected, locale)} → ${muscleLabel(locale, selected.muscle)}`
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
          const name = groupLabel(ex, locale)
          const active = selectedId === ex.baseId
          const equipment = equipmentList(ex, locale)
          return (
            <li key={ex.baseId}>
              <button
                type="button"
                className={`ft-library__item${active ? ' ft-library__item--active' : ''}`}
                onClick={() => selectExercise(ex)}
              >
                <ExerciseThumb muscle={ex.muscle} size="md" />
                <span className="ft-library__item-text">
                  <span className="ft-library__item-name">{name}</span>
                  <span
                    className="ft-library__item-muscle"
                    style={{ color: getMuscleColor(ex.muscle) }}
                  >
                    {muscleLabel(locale, ex.muscle)}
                  </span>
                  {equipment && <span className="ft-library__item-equip">{equipment}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {exercises.length === 0 && <EmptyState message={t('library.empty')} />}
    </>
  )
}
