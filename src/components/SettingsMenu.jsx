import { useRef, useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { Chip } from './Chip'
import { FaIcon } from './FaIcon'
import { useFitness } from '../contexts/FitnessContext'
import { useLocale } from '../contexts/LocaleContext'
import { useTheme } from '../contexts/ThemeContext'
import { uiIcons } from '../lib/icons'

export function SettingsMenu({ open, onClose }) {
  const { settings, updateSettings, exportData, importData } = useFitness()
  const { t, locale, setLocale } = useLocale()
  const { theme, palette, setTheme, setPalette, palettes } = useTheme()
  const fileRef = useRef(null)
  const [dataMsg, setDataMsg] = useState('')

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fittrack-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setDataMsg(t('data.exportOk'))
  }

  const handleImportClick = () => fileRef.current?.click()

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      importData(text)
      setDataMsg(t('data.importOk'))
    } catch {
      setDataMsg(t('data.importFail'))
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={t('common.settings')}>
      <div className="ft-settings">
        <div className="ft-settings__group">
          <p className="ft-settings__label">{t('common.language')}</p>
          <div className="ft-settings__options">
            <Chip active={locale === 'fr'} onClick={() => setLocale('fr')}>
              FR
            </Chip>
            <Chip active={locale === 'en'} onClick={() => setLocale('en')}>
              EN
            </Chip>
          </div>
        </div>

        <div className="ft-settings__group">
          <p className="ft-settings__label">{t('common.theme')}</p>
          <div className="ft-theme-toggle" role="group" aria-label={t('common.theme')}>
            <button
              type="button"
              className={`ft-theme-toggle__btn${theme === 'dark' ? ' ft-theme-toggle__btn--active' : ''}`}
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
            >
              <FaIcon icon={uiIcons.moon} className="ft-theme-toggle__icon" />
              <span>{t('common.dark')}</span>
            </button>
            <button
              type="button"
              className={`ft-theme-toggle__btn${theme === 'light' ? ' ft-theme-toggle__btn--active' : ''}`}
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
            >
              <FaIcon icon={uiIcons.sun} className="ft-theme-toggle__icon" />
              <span>{t('common.light')}</span>
            </button>
          </div>
        </div>

        <div className="ft-settings__group">
          <p className="ft-settings__label">{t('common.palette')}</p>
          <div className="ft-palette-grid">
            {palettes.map((p) => {
              const colors = theme === 'dark' ? p.swatchDark : p.swatch
              const active = palette === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`ft-palette-card${active ? ' ft-palette-card--active' : ''}`}
                  onClick={() => setPalette(p.id)}
                  aria-pressed={active}
                >
                  <span
                    className="ft-palette-card__preview"
                    style={{
                      background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
                    }}
                    aria-hidden="true"
                  />
                  <span className="ft-palette-card__meta">
                    <span className="ft-palette-card__name">{t(`palettes.${p.id}`)}</span>
                    {active && (
                      <FaIcon icon={uiIcons.check} className="ft-palette-card__check" />
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="ft-settings__group">
          <p className="ft-settings__label">{t('common.weightUnit')}</p>
          <div className="ft-settings__options">
            <Chip
              active={settings.weightUnit === 'kg'}
              onClick={() => updateSettings({ weightUnit: 'kg' })}
            >
              kg
            </Chip>
            <Chip
              active={settings.weightUnit === 'lb'}
              onClick={() => updateSettings({ weightUnit: 'lb' })}
            >
              lb
            </Chip>
          </div>
        </div>

        <div className="ft-settings__group">
          <p className="ft-settings__label">{t('common.defaultRest')}</p>
          <div className="ft-settings__options">
            {[60, 90, 120, 150].map((s) => (
              <Chip
                key={s}
                active={settings.defaultRestSeconds === s}
                onClick={() => updateSettings({ defaultRestSeconds: s })}
              >
                {s}s
              </Chip>
            ))}
          </div>
        </div>

        <div className="ft-settings__group">
          <p className="ft-settings__label">{t('data.title')}</p>
          <div className="ft-btn-row">
            <button type="button" className="ft-btn ft-btn--secondary" onClick={handleExport}>
              {t('data.export')}
            </button>
            <button type="button" className="ft-btn ft-btn--secondary" onClick={handleImportClick}>
              {t('data.import')}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImportFile}
          />
          {dataMsg && <p className="ft-settings__hint">{dataMsg}</p>}
        </div>
      </div>
    </BottomSheet>
  )
}

export function SettingsButton({ onClick }) {
  const { t } = useLocale()
  return (
    <button type="button" className="ft-icon-btn" onClick={onClick} aria-label={t('common.settings')}>
      <FaIcon icon={uiIcons.settings} className="ft-icon-btn__icon" />
    </button>
  )
}

export function useSettingsSheet() {
  const [open, setOpen] = useState(false)
  return {
    settingsOpen: open,
    openSettings: () => setOpen(true),
    closeSettings: () => setOpen(false),
  }
}
