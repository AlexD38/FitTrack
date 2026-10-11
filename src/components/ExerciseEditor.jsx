import { useEffect, useState } from 'react'
import { useLocale } from '../contexts/LocaleContext'
import { FaIcon } from './FaIcon'
import { ExerciseAutocomplete } from './ExerciseAutocomplete'
import { RpeCompact } from './RpeGauge'
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
    reps: last.reps !== '' && last.reps != null ? last.reps : '',
    rpe: last.rpe !== '' && last.rpe != null ? last.rpe : 5,
    completed: false,
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
    if (field === 'weight') next = parseWeight(val)
    else if (field === 'reps') next = parseReps(val)
    else if (field === 'rpe') next = val === '' || val == null ? 5 : Number(val)
    else if (field === 'completed') next = Boolean(val)
    nextSets[idx] = { ...nextSets[idx], [field]: next }
    onChange({ ...exercise, sets: nextSets })
  }

  const addSet = () => {
    onChange({ ...exercise, sets: [...sets, carryForwardSet(sets)] })
  }

  const removeSetAt = (idx) => {
    if (sets.length <= 1) return
    onChange({ ...exercise, sets: sets.filter((_, i) => i !== idx) })
  }

  if (collapsed) {
    return (
      <section className="ft-ex-block ft-ex-block--collapsed">
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

      <div className="ft-set-inline" role="table" aria-label={t('common.sets')}>
        <div className="ft-set-inline__header" role="row">
          <span className="ft-set-inline__cell ft-set-inline__cell--num" role="columnheader">
            #
          </span>
          <span className="ft-set-inline__cell" role="columnheader">
            {t('journal.weight')}
          </span>
          <span className="ft-set-inline__cell" role="columnheader">
            {t('common.reps')}
          </span>
          <span className="ft-set-inline__cell ft-set-inline__cell--rpe" role="columnheader">
            {t('rpe.label')}
          </span>
          <span className="ft-set-inline__cell ft-set-inline__cell--check" role="columnheader">
            <span className="ft-sr-only">{t('live.markSet')}</span>
          </span>
          <span className="ft-set-inline__cell ft-set-inline__cell--action" role="columnheader">
            <span className="ft-sr-only">{t('common.delete')}</span>
          </span>
        </div>

        {sets.map((set, i) => {
          const isDone = Boolean(set.completed)
          return (
            <div
              key={i}
              className={`ft-set-inline__row${isDone ? ' ft-set-inline__row--done' : ''}`}
              role="row"
            >
              <span className="ft-set-inline__cell ft-set-inline__cell--num" role="cell">
                {i + 1}
              </span>
              <label className="ft-set-inline__cell" role="cell">
                <span className="ft-sr-only">{t('journal.weight')}</span>
                <input
                  className="ft-input ft-set-inline__input"
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="next"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="0"
                  value={set.weight === '' || set.weight == null ? 0 : set.weight}
                  onChange={(e) => updateSet(i, 'weight', e.target.value)}
                  aria-label={`${t('journal.setIndex')} ${i + 1} ${t('journal.weight')}`}
                />
              </label>
              <label className="ft-set-inline__cell" role="cell">
                <span className="ft-sr-only">{t('common.reps')}</span>
                <input
                  className="ft-input ft-set-inline__input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  enterKeyHint="done"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="—"
                  value={set.reps}
                  onChange={(e) => updateSet(i, 'reps', e.target.value)}
                  aria-label={`${t('journal.setIndex')} ${i + 1} ${t('common.reps')}`}
                />
              </label>
              <div className="ft-set-inline__cell ft-set-inline__cell--rpe" role="cell">
                <RpeCompact
                  value={set.rpe ?? 5}
                  onChange={(v) => updateSet(i, 'rpe', v)}
                  ariaLabel={`${t('journal.setIndex')} ${i + 1} ${t('rpe.label')}`}
                />
              </div>
              <div className="ft-set-inline__cell ft-set-inline__cell--check" role="cell">
                <button
                  type="button"
                  className={`ft-set-inline__check${isDone ? ' ft-set-inline__check--done' : ''}`}
                  onClick={() => {
                    const next = !isDone
                    updateSet(i, 'completed', next)
                    if (next && onStartRest) {
                      onStartRest()
                    }
                  }}
                  aria-pressed={isDone}
                  aria-label={`${t('live.doneSetAria')} ${i + 1}`}
                >
                  <FaIcon icon={uiIcons.check} className="ft-set-inline__check-icon" />
                </button>
              </div>
              <div className="ft-set-inline__cell ft-set-inline__cell--action" role="cell">
                <button
                  type="button"
                  className="ft-set-inline__remove"
                  onClick={() => removeSetAt(i)}
                  disabled={sets.length <= 1}
                  aria-label={`${t('journal.removeSet')} ${i + 1}`}
                >
                  <FaIcon icon={uiIcons.minus} className="ft-set-inline__remove-icon" />
                </button>
              </div>
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
export function ExerciseListEditor({ exercises, onChange, focusMode = false, onStartRest }) {
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
