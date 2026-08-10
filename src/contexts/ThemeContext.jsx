/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useLayoutEffect } from 'react'
import { DEFAULT_PALETTE, isValidPalette, PALETTES } from '../lib/palettes'
import { useFitness } from './FitnessContext'

const ThemeContext = createContext(null)

function applyAppearance(theme, palette) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.setAttribute('data-palette', palette)
  root.style.colorScheme = theme
}

export function ThemeProvider({ children }) {
  const { settings, updateSettings } = useFitness()
  const theme = settings.theme ?? 'dark'
  const palette = isValidPalette(settings.palette) ? settings.palette : DEFAULT_PALETTE

  useLayoutEffect(() => {
    applyAppearance(theme, palette)
  }, [theme, palette])

  const toggleTheme = useCallback(() => {
    updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })
  }, [theme, updateSettings])

  const setTheme = useCallback(
    (next) => updateSettings({ theme: next }),
    [updateSettings],
  )

  const setPalette = useCallback(
    (next) => {
      if (isValidPalette(next)) updateSettings({ palette: next })
    },
    [updateSettings],
  )

  return (
    <ThemeContext.Provider
      value={{ theme, palette, toggleTheme, setTheme, setPalette, palettes: PALETTES }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
