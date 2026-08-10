import { FaIcon } from './FaIcon'
import { useLocale } from '../contexts/LocaleContext'
import { uiIcons } from '../lib/icons'

export function Fab({ onClick, label }) {
  const { t } = useLocale()
  const ariaLabel = label ?? t('common.add')

  return (
    <button type="button" className="ft-fab" onClick={onClick} aria-label={ariaLabel}>
      <span className="ft-fab__icon-wrap" aria-hidden="true">
        <FaIcon icon={uiIcons.add} className="ft-fab__icon" />
      </span>
      <span className="ft-fab__label">{ariaLabel}</span>
    </button>
  )
}
