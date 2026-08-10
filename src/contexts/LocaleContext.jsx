/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo } from 'react'
import { t } from '../lib/i18n'
import { useFitness } from './FitnessContext'

const LocaleContext = createContext(null)

export function LocaleProvider({ children }) {
  const { settings, updateSettings } = useFitness()
  const locale = settings.locale ?? 'fr'

  const setLocale = useCallback(
    (next) => updateSettings({ locale: next }),
    [updateSettings],
  )

  const translate = useCallback((key) => t(locale, key), [locale])

  const value = useMemo(
    () => ({ locale, setLocale, t: translate }),
    [locale, setLocale, translate],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
