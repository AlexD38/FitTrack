import { useState } from 'react'
import { useLocale } from '../contexts/LocaleContext'
import { FaIcon } from './FaIcon'
import { ExerciseAutocomplete } from './ExerciseAutocomplete'
import { RpeGauge, rpeColor } from './RpeGauge'
import { BottomSheet } from './BottomSheet'
import { emptySet } from '../lib/sets'
import { uiIcons } from '../lib/icons'

function parseWeight(val) {
  const cleaned = String(val).replace(',', '.').replace(/[^\d.]/g, '')
  if (cleaned === '' || cleaned === '.') return ''
  if (/^\d+\.$/.test(cleaned)) return cleaned
  const n = Number(cleaned)
  return Number.isNaN(n) ? '' : n
}

function parseReps(val) {
  const cleaned = String(val).replace(/\D/g, '')
  return cleaned === '' ? '' : Number(cleaned)
}

export function createEmptyExercise() {
  return { name: '', sets: [emptySet()] }
}

function setStats(sets) {
  const list = sets?.length ? sets : [emptySet()]
  const first = list[0]
  const weight = first?.weight === '' || first?.weight == null ? 0 : first.weight
  const reps = first?.reps === '' || first?.reps == null ? '—' : first.reps
  const rpe = first?.rpe === '' || first?.rpe == null ? 5 : first.rpe
  return { weight, reps, rpe, count: list.length }
}

/** Sheet content: name + sets (weight / reps / RPE). */
export function ExerciseEditor({ exercise, onChange, onRemove }) {
  const { t } = useLocale()

  const updateName = (name) => onChange({ ...exercise, name })

  const updateSet = (idx, field, val) => {
    const sets = [...(exercise.sets ?? [])]
    let next = val
    if (field === 'weight') next = parseWeight(val)
    else if (field === 'reps') next = parseReps(val)
    else if (field === 'rpe') next = val === '' || val == null ? 5 : Number(val)
    sets[idx] = { ...sets[idx], [field]: next }
    onChange({ ...exercise, sets })
  }

  const addSet = () => {
    const current = exercise.sets?.length ? exercise.sets : [emptySet()]
    const last = current[current.length - 1]
    onChange({
      ...exercise,
      sets: [
        ...current,
        emptySet({
          weight: last.weight !== '' && last.weight != null ? last.weight : 0,
          reps: last.reps !== '' && last.reps != null ? last.reps : '',
          rpe: last.rpe !== '' && last.rpe != null ? last.rpe : 5,
        }),
      ],
    })
  }

  const removeLastSet = () => {
    const current = exercise.sets ?? []
    if (current.length <= 1) return
    onChange({ ...exercise, sets: current.slice(0, -1) })
  }

  const sets = exercise.sets?.length ? exercise.sets : [emptySet()]

  return (
    <div className="ft-exercise-editor">
      <div className="ft-ex-editor__head">
        <span className="ft-ex-list__icon-wrap" aria-hidden="true">
          <FaIcon icon={uiIcons.dumbbell} className="ft-ex-list__icon" />
        </span>
        <div className="ft-ex-editor__name">
          <ExerciseAutocomplete
            value={exercise.name ?? ''}
            onChange={updateName}
            placeholder={t('journal.exerciseName')}
          />
        </div>
      </div>

      <div className="ft-ex-editor__sets">
        {sets.map((set, i) => {
          const rpeTint = rpeColor(set.rpe ?? 5)
          return (
            <div key={i} className="ft-ex-editor__set">
              <span className="ft-ex-editor__set-label">
                {t('journal.setIndex')} {i + 1}
              </span>
              <div className="ft-ex-editor__fields">
                <label className="ft-ex-editor__field">
                  <span className="ft-ex-editor__field-label">
                    <FaIcon icon={uiIcons.weightHanging} className="ft-ex-list__stat-icon" />
                    <span>{t('journal.weight')}</span>
                  </span>
                  <input
                    className="ft-input ft-input--sm ft-ex-editor__input"
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="done"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="0"
                    value={set.weight === '' || set.weight == null ? 0 : set.weight}
                    onChange={(e) => updateSet(i, 'weight', e.target.value)}
                    aria-label={t('journal.weight')}
                  />
                </label>
                <label className="ft-ex-editor__field">
                  <span className="ft-ex-editor__field-label">
                    <FaIcon icon={uiIcons.reps} className="ft-ex-list__stat-icon" />
                    <span>{t('common.reps')}</span>
                  </span>
                  <input
                    className="ft-input ft-input--sm ft-ex-editor__input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    enterKeyHint="done"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder={t('common.reps')}
                    value={set.reps}
                    onChange={(e) => updateSet(i, 'reps', e.target.value)}
                    aria-label={t('common.reps')}
                  />
                </label>
              </div>
              <div className="ft-ex-editor__rpe">
                <RpeGauge
                  value={set.rpe ?? 5}
                  onChange={(v) => updateSet(i, 'rpe', v)}
                  iconColor={rpeTint}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="ft-ex-editor__set-actions">
        <button type="button" className="ft-btn ft-btn--secondary" onClick={addSet}>
          <FaIcon icon={uiIcons.add} className="ft-ex-editor__action-icon" />
          {t('journal.addSet')}
        </button>
        <button
          type="button"
          className="ft-btn ft-btn--secondary"
          onClick={removeLastSet}
          disabled={sets.length <= 1}
        >
          <FaIcon icon={uiIcons.minus} className="ft-ex-editor__action-icon" />
          {t('journal.removeSet')}
        </button>
      </div>

      {onRemove && (
        <button
          type="button"
          className="ft-btn ft-btn--danger ft-exercise-editor__delete"
          onClick={onRemove}
        >
          <FaIcon icon={uiIcons.trash} className="ft-exercise-editor__delete-icon" />
          {t('common.delete')}
        </button>
      )}
    </div>
  )
}

/**
 * List of exercises; tap a row to edit weight / reps / RPE in a bottom sheet.
 * Shared by session edit + live workout.
 */
export function ExerciseListEditor({ exercises, onChange }) {
  const { t } = useLocale()
  const [editIndex, setEditIndex] = useState(null)

  const list = exercises?.length ? exercises : [createEmptyExercise()]
  const editing = editIndex != null ? list[editIndex] : null

  const updateAt = (idx, updated) => {
    onChange(list.map((ex, i) => (i === idx ? updated : ex)))
  }

  const removeAt = (idx) => {
    if (list.length <= 1) return
    onChange(list.filter((_, i) => i !== idx))
    setEditIndex(null)
  }

  const addExercise = () => {
    const next = [...list, createEmptyExercise()]
    onChange(next)
    setEditIndex(next.length - 1)
  }

  return (
    <div className="ft-ex-list">
      <ul className="ft-ex-list__items">
        {list.map((ex, i) => {
          const name = ex.name?.trim() || t('journal.exerciseName')
          const empty = !ex.name?.trim()
          const { weight, reps, rpe } = setStats(ex.sets)
          const rpeTint = rpeColor(rpe)
          return (
            <li key={i}>
              <button
                type="button"
                className={`ft-ex-list__item${empty ? ' ft-ex-list__item--empty' : ''}`}
                onClick={() => setEditIndex(i)}
              >
                <span className="ft-ex-list__icon-wrap" aria-hidden="true">
                  <FaIcon icon={uiIcons.dumbbell} className="ft-ex-list__icon" />
                </span>
                <span className="ft-ex-list__text">
                  <span className="ft-ex-list__name">{name}</span>
                  <span className="ft-ex-list__meta">
                    <span className="ft-ex-list__stat">
                      <FaIcon icon={uiIcons.weightHanging} className="ft-ex-list__stat-icon" />
                      <span>
                        {weight} {t('common.kg')}
                      </span>
                    </span>
                    <span className="ft-ex-list__stat">
                      <FaIcon icon={uiIcons.reps} className="ft-ex-list__stat-icon" />
                      <span>
                        {reps} {t('common.reps')}
                      </span>
                    </span>
                    <span className="ft-ex-list__stat" style={{ color: rpeTint }}>
                      <FaIcon
                        icon={uiIcons.rpe}
                        className="ft-ex-list__stat-icon"
                        style={{ color: rpeTint }}
                      />
                      <span>
                        {rpe} {t('rpe.label')}
                      </span>
                    </span>
                  </span>
                </span>
                <FaIcon icon={uiIcons.chevronDown} className="ft-ex-list__chevron" />
              </button>
            </li>
          )
        })}
      </ul>

      <button type="button" className="ft-btn ft-btn--secondary ft-ex-list__add" onClick={addExercise}>
        + {t('journal.addExercise')}
      </button>

      <BottomSheet
        open={editIndex != null && Boolean(editing)}
        onClose={() => setEditIndex(null)}
        title={t('journal.editExercise')}
        showBack
      >
        {editing && editIndex != null && (
          <ExerciseEditor
            key={editIndex}
            exercise={editing}
            onChange={(updated) => updateAt(editIndex, updated)}
            onRemove={list.length > 1 ? () => removeAt(editIndex) : undefined}
          />
        )}
      </BottomSheet>
    </div>
  )
}
