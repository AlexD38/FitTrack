import { FaIcon } from './FaIcon'
import { useLocale } from '../contexts/LocaleContext'
import { navIcons } from '../lib/icons'

const TABS = [
  { id: 'dashboard', icon: navIcons.dashboard, labelKey: 'nav.dashboard' },
  { id: 'journal', icon: navIcons.journal, labelKey: 'nav.journal' },
  { id: 'library', icon: navIcons.library, labelKey: 'nav.library' },
  { id: 'timer', icon: navIcons.timer, labelKey: 'nav.timer' },
  { id: 'weight', icon: navIcons.weight, labelKey: 'nav.weight' },
]

export function BottomNav({ active, onChange }) {
  const { t } = useLocale()

  return (
    <nav className="ft-nav" aria-label="Navigation">
      <div className="ft-nav__inner">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              className={`ft-nav__item${isActive ? ' ft-nav__item--active' : ''}`}
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="ft-nav__icon-wrap">
                <FaIcon icon={tab.icon} className="ft-nav__icon" />
              </span>
              <span className="ft-nav__label">{t(tab.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
