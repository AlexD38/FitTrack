import { useLocale } from '../contexts/LocaleContext'
import { rpeColor } from './RpeGauge'

function SetRow({ set, t }) {
  const hasRpe = set.rpe != null && set.rpe !== ''
  const color = hasRpe ? rpeColor(set.rpe) : null
  const pct = hasRpe ? Math.min(100, Math.max(0, (Number(set.rpe) / 10) * 100)) : 0

  return (
    <div className="ft-ex-view__set">
      <div className="ft-ex-view__stats">
        <span className="ft-ex-view__stat">
          {Number(set.weight) === 0 ? (
            <strong className="ft-ex-view__bw">{t('journal.bodyweight')}</strong>
          ) : (
            <>
              <strong>{set.weight}</strong>
              <span className="ft-ex-view__unit">kg</span>
            </>
          )}
        </span>
        <span className="ft-ex-view__times" aria-hidden="true">
          ×
        </span>
        <span className="ft-ex-view__stat">
          <strong>{set.reps}</strong>
          <span className="ft-ex-view__unit">{t('common.reps')}</span>
        </span>
      </div>
      {hasRpe ? (
        <div className="ft-ex-view__rpe" title={`${t('rpe.label')} ${set.rpe}`}>
          <span className="ft-ex-view__rpe-val" style={{ color }}>
            {set.rpe}
          </span>
          <span className="ft-ex-view__rpe-bar" aria-hidden="true">
            <span
              className="ft-ex-view__rpe-fill"
              style={{ width: `${pct}%`, background: color }}
            />
          </span>
        </div>
      ) : (
        <span className="ft-ex-view__rpe ft-ex-view__rpe--empty">—</span>
      )}
    </div>
  )
}

export function SessionExercisesView({ exercises }) {
  const { t } = useLocale()
  const list = (exercises ?? []).filter((ex) => ex.name?.trim())

  if (!list.length) return null

  return (
    <div className="ft-ex-view">
      {list.map((ex, i) => {
        const sets = ex.sets ?? []
        return (
          <article key={`${ex.name}-${i}`} className="ft-ex-view__card">
            <header className="ft-ex-view__head">
              <h3 className="ft-ex-view__name">{ex.name}</h3>
              <span className="ft-ex-view__count">
                {sets.length} {t('common.sets')}
              </span>
            </header>
            <div className="ft-ex-view__cols" aria-hidden="true">
              <span>{t('journal.weight')}</span>
              <span>{t('rpe.label')}</span>
            </div>
            <div className="ft-ex-view__sets">
              {sets.map((s, j) => (
                <SetRow key={j} set={s} t={t} />
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}
