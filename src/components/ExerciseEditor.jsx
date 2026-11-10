import { useEffect, useState } from 'react'
import { useLocale } from '../contexts/LocaleContext'
import { FaIcon } from './FaIcon'
import { ExerciseAutocomplete } from './ExerciseAutocomplete'
import { RpeCompact } from './RpeGauge'
import { NumberStepper } from './NumberStepper'
import { BottomSheet } from './BottomSheet'
import { emptySet } from '../lib/sets'
import { uiIcons } from '../lib/icons'

const WEIGHT_STEP = 2.5
const WEIGHT_MAX = 500
const REPS_MAX = 100

export function createEmptyExercise() {
  return { name: '', sets: [emptySet()] }
}

/** Honest set summary for glanceable previews: `3× 80 kg · RPE 7`. */
export function formatSetSummary(sets, t) {
  const list = sets?.length ? sets : []
  if (!list.length) return `0 ${t('common.sets')}`
  const count = list.length
  const withReps = list.filter((s) => s.reps !== '' && s.reps != null)
  const sample = withReps[withReps.length - 1] ?? list[list.length - 1]
  const weight = sample?.weight === '' || sample?.weight == null ? 0 : sample.weight
  const reps = sample?.reps === '' || sample?.reps == null ? '—' : sample.reps
  const rpe = sample?.rpe === '' || sample?.rpe == null ? 5 : sample.rpe
  return `${count}× ${weight} ${t('common.kg')} · ${reps} ${t('common.reps')} · ${t('rpe.label')} ${rpe}`
}

function carryForwardSet(sets) {
  const current = sets?.length ? sets : [emptySet()]
  const last = current[current.length - 1]
  return emptySet({
    weight: last.weight !== '' && last.weight != null ? last.weight : 0,
    reps: last.reps !== '' && last.reps != null ? last.reps : 0,
    rpe: last.rpe !== '' && last.rpe != null ? last.rpe : 5,
  })
}

/** One exercise block: name sheet + inline set rows. */
export function ExerciseBlock({
  exercise,
  onChange,
  onRemove,
  collapsed = false,
  onExpand,
  onStartRest,
  onMoveUp,
  onMoveDown,
  trackDone = false,
  onSetDone,
}) {
  const { t } = useLocale()
  const [nameOpen, setNameOpen] = useState(false)
  const sets = exercise.sets?.length ? exercise.sets : [emptySet()]
  const displayName = exercise.name?.trim() || t('journal.exerciseName')
  const emptyName = !exercise.name?.trim()

  const updateName = (name) => onChange({ ...exercise, name })

  const updateSet = (idx, field, val) => {
    const nextSets = [...sets]
    let next = val
    if (field === 'weight') next = Number(val) || 0
    else if (field === 'reps') next = val === '' || val == null ? 0 : Number(val)
    else if (field === 'rpe') next = val === '' || val == null ? 5 : Number(val)
    nextSets[idx] = { ...nextSets[idx], [field]: next }
    onChange({ ...exercise, sets: nextSets })
  }

  const toggleDone = (idx) => {
    const nowDone = !sets[idx].done
    const nextSets = sets.map((s, i) => (i === idx ? { ...s, done: nowDone } : s))
    onChange({ ...exercise, sets: nextSets })
    if (nowDone) onSetDone?.({ allDone: nextSets.every((s) => s.done) })
  }

  const addSet = () => {
    onChange({ ...exercise, sets: [...sets, carryForwardSet(sets)] })
  }

  const removeSetAt = (idx) => {
    if (sets.length <= 1) return
    onChange({ ...exercise, sets: sets.filter((_, i) => i !== idx) })
  }

  if (collapsed) {
    const doneCount = trackDone ? sets.filter((s) => s.done).length : 0
    const allDone = trackDone && doneCount === sets.length
    return (
      <section className={`ft-ex-block ft-ex-block--collapsed${allDone ? ' ft-ex-block--complete' : ''}`}>
        <button type="button" className="ft-ex-block__collapsed" onClick={onExpand}>
          <span className="ft-ex-block__icon-wrap" aria-hidden="true">
            <FaIcon icon={uiIcons.dumbbell} className="ft-ex-block__icon" />
          </span>
          <span className="ft-ex-block__collapsed-text">
            <span className={`ft-ex-block__name-text${emptyName ? ' ft-ex-block__name--empty' : ''}`}>
              {displayName}
            </span>
            <span className="ft-ex-block__summary">{formatSetSummary(sets, t)}</span>
          </span>
          {trackDone && (
            <span className={`ft-ex-block__progress${allDone ? ' ft-ex-block__progress--done' : ''}`}>
              {allDone ? <FaIcon icon={uiIcons.check} /> : `${doneCount}/${sets.length}`}
            </span>
          )}
          <FaIcon icon={uiIcons.chevronDown} className="ft-ex-block__chevron" />
        </button>
      </section>
    )
  }

  return (
    <section className="ft-ex-block ft-ex-block--active">
      <header className="ft-ex-block__head">
        <button
          type="button"
          className={`ft-ex-block__name${emptyName ? ' ft-ex-block__name--empty' : ''}`}
          onClick={() => setNameOpen(true)}
        >
          <span className="ft-ex-block__icon-wrap" aria-hidden="true">
            <FaIcon icon={uiIcons.dumbbell} className="ft-ex-block__icon" />
          </span>
          <span className="ft-ex-block__name-text">{displayName}</span>
          <FaIcon icon={uiIcons.edit} className="ft-ex-block__name-edit" />
        </button>
        {(onMoveUp || onMoveDown) && (
          <div className="ft-ex-block__reorder" role="group" aria-label={t('journal.reorder')}>
            <button
              type="button"
              className="ft-ex-block__reorder-btn"
              onClick={onMoveUp}
              disabled={!onMoveUp}
              aria-label={t('journal.moveUp')}
            >
              <FaIcon icon={uiIcons.arrowUp} className="ft-ex-block__reorder-icon" />
            </button>
            <button
              type="button"
              className="ft-ex-block__reorder-btn"
              onClick={onMoveDown}
              disabled={!onMoveDown}
              aria-label={t('journal.moveDown')}
            >
              <FaIcon icon={uiIcons.arrowDown} className="ft-ex-block__reorder-icon" />
            </button>
          </div>
        )}
        {onRemove && (
          <button
            type="button"
            className="ft-ex-block__remove"
            onClick={onRemove}
            aria-label={t('common.delete')}
          >
            <FaIcon icon={uiIcons.trash} className="ft-ex-block__remove-icon" />
          </button>
        )}
      </header>

      <div
        className={`ft-set-inline${trackDone ? ' ft-set-inline--track' : ''}`}
        role="list"
        aria-label={t('common.sets')}
      >
        <div className="ft-set-inline__head" aria-hidden="true">
          <span>#</span>
          <span>
            {t('journal.weight')} ({t('common.kg')})
          </span>
          <span>{t('common.reps')}</span>
          {trackDone && <span>✓</span>}
        </div>
        {sets.map((set, i) => {
          const weight = set.weight === '' || set.weight == null ? 0 : Number(set.weight) || 0
          const reps = set.reps === '' || set.reps == null ? 0 : Number(set.reps) || 0
          const setLabel = `${t('journal.setIndex')} ${i + 1}`
          const done = trackDone && Boolean(set.done)
          return (
            <div
              key={i}
              className={`ft-set-inline__row${done ? ' ft-set-inline__row--done' : ''}`}
              role="listitem"
            >
              <div className="ft-set-inline__main">
                <span className="ft-set-inline__num">{i + 1}</span>
                <NumberStepper
                  value={weight}
                  onChange={(v) => updateSet(i, 'weight', v)}
                  step={WEIGHT_STEP}
                  min={0}
                  max={WEIGHT_MAX}
                  ariaLabel={`${setLabel} ${t('journal.weight')}`}
                  size="sm"
                />
                <NumberStepper
                  value={reps}
                  onChange={(v) => updateSet(i, 'reps', v)}
                  step={1}
                  min={0}
                  max={REPS_MAX}
                  ariaLabel={`${setLabel} ${t('common.reps')}`}
                  size="sm"
                />
                {trackDone && (
                  <button
                    type="button"
                    className={`ft-set-inline__check${done ? ' ft-set-inline__check--done' : ''}`}
                    onClick={() => toggleDone(i)}
                    aria-pressed={done}
                    aria-label={`${t('live.markSet')} ${i + 1}`}
                  >
                    <FaIcon icon={uiIcons.check} className="ft-set-inline__check-icon" />
                  </button>
                )}
              </div>

              {!done && (
                <div className="ft-set-inline__extra">
                  <span className="ft-set-inline__extra-label">{t('rpe.label')}</span>
                  <RpeCompact
                    value={set.rpe ?? 5}
                    onChange={(v) => updateSet(i, 'rpe', v)}
                    ariaLabel={`${setLabel} ${t('rpe.label')}`}
                  />
                  <button
                    type="button"
                    className="ft-set-inline__remove"
                    onClick={() => removeSetAt(i)}
                    disabled={sets.length <= 1}
                    aria-label={`${t('journal.removeSet')} ${i + 1}`}
                  >
                    <FaIcon icon={uiIcons.trash} className="ft-set-inline__remove-icon" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className={`ft-ex-block__set-actions${onStartRest ? '' : ' ft-ex-block__set-actions--single'}`}>
        <button type="button" className="ft-btn ft-btn--secondary ft-ex-block__add-set" onClick={addSet}>
          <FaIcon icon={uiIcons.add} className="ft-ex-block__add-icon" />
          {t('journal.addSet')}
        </button>
        {onStartRest && (
          <button
            type="button"
            className="ft-btn ft-btn--secondary ft-ex-block__rest"
            onClick={onStartRest}
          >
            <FaIcon icon={uiIcons.timer} className="ft-ex-block__add-icon" />
            {t('live.rest')}
          </button>
        )}
      </div>

      <BottomSheet
        open={nameOpen}
        onClose={() => setNameOpen(false)}
        title={t('journal.editExercise')}
        showBack
      >
        <div className="ft-ex-block__name-sheet">
          <p className="ft-ex-block__name-hint">{t('journal.exerciseRenameHint')}</p>
          <ExerciseAutocomplete
            value={exercise.name ?? ''}
            onChange={updateName}
            placeholder={t('journal.exerciseName')}
          />
          <button
            type="button"
            className="ft-btn ft-btn--primary"
            style={{ width: '100%', marginTop: 'var(--space-4)' }}
            onClick={() => setNameOpen(false)}
            disabled={!exercise.name?.trim()}
          >
            {t('journal.useExerciseName')}
          </button>
        </div>
      </BottomSheet>
    </section>
  )
}

/**
 * Inline exercise list shared by live workout + journal detail.
 * `focusMode` collapses inactive exercises so the current one stays primary.
 */
export function ExerciseListEditor({
  exercises,
  onChange,
  focusMode = false,
  onStartRest,
  trackDone = false,
  onSetDone,
}) {
  const { t } = useLocale()
  const list = exercises?.length ? exercises : [createEmptyExercise()]
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (activeIndex > list.length - 1) {
      setActiveIndex(Math.max(0, list.length - 1))
    }
  }, [list.length, activeIndex])

  const updateAt = (idx, updated) => {
    onChange(list.map((ex, i) => (i === idx ? updated : ex)))
  }

  const removeAt = (idx) => {
    if (list.length <= 1) return
    onChange(list.filter((_, i) => i !== idx))
    if (activeIndex >= list.length - 1) setActiveIndex(Math.max(0, list.length - 2))
  }

  const addExercise = () => {
    const next = [...list, createEmptyExercise()]
    onChange(next)
    setActiveIndex(next.length - 1)
  }

  const handleSetDone = (idx, { allDone }) => {
    onSetDone?.()
    if (!allDone || !focusMode) return
    const isPending = (ex) => (ex.sets ?? []).some((s) => !s.done)
    const after = list.findIndex((ex, i) => i > idx && isPending(ex))
    const next = after !== -1 ? after : list.findIndex((ex, i) => i !== idx && isPending(ex))
    if (next !== -1) setActiveIndex(next)
  }

  const moveAt = (idx, dir) => {
    const target = idx + dir
    if (target < 0 || target >= list.length) return
    const next = [...list]
    const [item] = next.splice(idx, 1)
    next.splice(target, 0, item)
    onChange(next)
    setActiveIndex(target)
  }

  return (
    <div className="ft-ex-list">
      <div className="ft-ex-list__blocks">
        {list.map((ex, i) => (
          <ExerciseBlock
            key={i}
            exercise={ex}
            onChange={(updated) => updateAt(i, updated)}
            onRemove={list.length > 1 ? () => removeAt(i) : undefined}
            collapsed={focusMode && list.length > 1 && i !== activeIndex}
            onExpand={() => setActiveIndex(i)}
            onStartRest={onStartRest}
            onMoveUp={list.length > 1 && i > 0 ? () => moveAt(i, -1) : undefined}
            onMoveDown={list.length > 1 && i < list.length - 1 ? () => moveAt(i, 1) : undefined}
            trackDone={trackDone}
            onSetDone={(info) => handleSetDone(i, info)}
          />
        ))}
      </div>

      <button type="button" className="ft-btn ft-btn--secondary ft-ex-list__add" onClick={addExercise}>
        <FaIcon icon={uiIcons.add} className="ft-ex-block__add-icon" />
        {t('journal.addExercise')}
      </button>
    </div>
  )
}

/** @deprecated Prefer ExerciseBlock — kept for any stray imports. */
export function ExerciseEditor({ exercise, onChange, onRemove }) {
  return <ExerciseBlock exercise={exercise} onChange={onChange} onRemove={onRemove} />
}
