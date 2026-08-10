export const PALETTE_IDS = ['pulse', 'ocean', 'ember', 'violet']

export const DEFAULT_PALETTE = 'pulse'

export const PALETTES = [
  {
    id: 'pulse',
    swatch: ['#ff6b6b', '#4ecdc4'],
    swatchDark: ['#ff6b6b', '#4ecdc4'],
  },
  {
    id: 'ocean',
    swatch: ['#3b82f6', '#06b6d4'],
    swatchDark: ['#60a5fa', '#22d3ee'],
  },
  {
    id: 'ember',
    swatch: ['#f97316', '#eab308'],
    swatchDark: ['#fb923c', '#facc15'],
  },
  {
    id: 'violet',
    swatch: ['#a855f7', '#ec4899'],
    swatchDark: ['#c084fc', '#f472b6'],
  },
]

export function isValidPalette(id) {
  return PALETTE_IDS.includes(id)
}
