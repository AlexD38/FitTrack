import { useLocale } from '../contexts/LocaleContext'
import { FaIcon } from './FaIcon'
import { ExerciseAutocomplete } from './ExerciseAutocomplete'
import { RpeGauge } from './RpeGauge'
import { emptySet } from '../lib/sets'
import { uiIcons } from '../lib/icons'

export function ExerciseEditor({ exercise, onChange, onRemove }) {
  const { t } = useLocale()

  const updateName = (name) => onChange({ ...exercise, name })
  const updateSet = (idx, field, val) => {
    const sets = [...(exercise.sets ?? [])]
    let next = val
    if (field === 'weight' || field === 'reps' || field === 'rpe') {
      next = val === '' ? '' : Number(val)
    }
    sets[idx] = { ...sets[idx], [field]: next }
    onChange({ ...exercise, sets })
  }
  const addSet = () => {
    const current = exercise.sets?.length ? exercise.sets : [emptySet()]
    const last = current[current.length - 1]
    const next = emptySet({
      weight: last.weight !== '' && last.weight != null ? last.weight : 0,
      reps: last.reps !== '' && last.reps != null ? last.reps : '',
      rpe: last.rpe !== '' && last.rpe != null ? last.rpe : '',
    })
    onChange({ ...exercise, sets: [...current, next] })
  }
  const removeLastSet = () => {
    const current = exercise.sets ?? []
    if (current.length <= 1) return
    onChange({ ...exercise, sets: current.slice(0, -1) })
  }

  const sets = exercise.sets?.length ? exercise.sets : [emptySet()]

  return (
    <div className="ft-glass ft-glass--pad ft-exercise-block">
      <div className="ft-exercise-block__head">
        <ExerciseAutocomplete
          value={exercise.name ?? ''}
          onChange={updateName}
          placeholder={t('journal.exerciseName')}
        />
        {onRemove && (
          <button
            type="button"
            className="ft-exercise-block__delete"
            onClick={onRemove}
            aria-label={t('common.delete')}
          >
            <FaIcon icon={uiIcons.trash} className="ft-exercise-block__delete-icon" />
          </button>
        )}
      </div>

      <div className="ft-set-header" aria-hidden="true">
        <span className="ft-set-row__num">#</span>
        <span className="ft-input ft-input--sm ft-set-header__cell">{t('journal.weight')}</span>
        <span>×</span>
        <span className="ft-input ft-input--sm ft-set-header__cell">{t('common.reps')}</span>
      </div>

      {sets.map((set, i) => (
        <div key={i} className="ft-set-block">
          <div className="ft-set-row">
            <span className="ft-set-row__num">{i + 1}</span>
            <input
              className="ft-input ft-input--sm"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="0"
              value={set.weight === '' || set.weight == null ? 0 : set.weight}
              onChange={(e) => updateSet(i, 'weight', e.target.value)}
              aria-label={t('journal.weight')}
            />
            <span>×</span>
            <input
              className="ft-input ft-input--sm"
              type="number"
              inputMode="numeric"
              placeholder={t('common.reps')}
              value={set.reps}
              onChange={(e) => updateSet(i, 'reps', e.target.value)}
            />
          </div>
          <RpeGauge value={set.rpe ?? ''} onChange={(v) => updateSet(i, 'rpe', v)} />
        </div>
      ))}

      <div className="ft-exercise-block__set-actions">
        <button type="button" className="ft-btn ft-btn--secondary" onClick={addSet} aria-label={t('journal.addSet')}>
          +
        </button>
        <button
          type="button"
          className="ft-btn ft-btn--secondary"
          onClick={removeLastSet}
          disabled={sets.length <= 1}
          aria-label={t('journal.removeSet')}
        >
          −
        </button>
      </div>
    </div>
  )
}

export function createEmptyExercise() {
  return { name: '', sets: [emptySet()] }
}
