import { FaIcon } from './FaIcon'
import { useLocale } from '../contexts/LocaleContext'
import { navIcons } from '../lib/icons'

const TABS = [
  { id: 'dashboard', icon: navIcons.dashboard, labelKey: 'nav.dashboard' },
  { id: 'journal', icon: navIcons.journal, labelKey: 'nav.journal' },
  { id: 'timer', icon: navIcons.timer, labelKey: 'nav.timer' },
  { id: 'weight', icon: navIcons.weight, labelKey: 'nav.weight' },
]

export function BottomNav({ active, onChange }) {
  const { t } = useLocale()

  return (
    <nav className="ft-nav" aria-label="Navigation">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`ft-nav__item${active === tab.id ? ' ft-nav__item--active' : ''}`}
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <FaIcon icon={tab.icon} className="ft-nav__icon" />
          <span>{t(tab.labelKey)}</span>
        </button>
      ))}
    </nav>
  )
}
