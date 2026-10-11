import { getMuscleColor } from '../lib/muscles'

/** Stylized muscle thumbnail — color + glyph per muscle group (no photo assets). */
export function ExerciseThumb({ muscle, size = 'md', className = '' }) {
  const color = getMuscleColor(muscle)
  const glyph = GLYPHS[muscle] ?? GLYPHS.default

  return (
    <span
      className={`ft-ex-thumb ft-ex-thumb--${size}${className ? ` ${className}` : ''}`}
      style={{ '--ft-thumb': color }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" className="ft-ex-thumb__svg">
        <rect x="2" y="2" width="44" height="44" rx="12" className="ft-ex-thumb__bg" />
        {glyph}
      </svg>
    </span>
  )
}

const GLYPHS = {
  chest: (
    <g fill="currentColor">
      <ellipse cx="18" cy="24" rx="8" ry="10" opacity="0.9" />
      <ellipse cx="30" cy="24" rx="8" ry="10" opacity="0.9" />
    </g>
  ),
  back: (
    <g fill="currentColor">
      <path d="M24 10 L34 38 H28 L24 24 L20 38 H14 Z" opacity="0.95" />
    </g>
  ),
  shoulders: (
    <g fill="currentColor">
      <circle cx="14" cy="20" r="7" />
      <circle cx="34" cy="20" r="7" />
      <rect x="18" y="18" width="12" height="6" rx="3" opacity="0.7" />
    </g>
  ),
  biceps: (
    <g fill="currentColor">
      <path d="M16 34 V18 c0-6 5-10 10-8 3 1 5 4 5 8 v6 c2 1 3 3 3 5 v5 H16 Z" />
    </g>
  ),
  triceps: (
    <g fill="currentColor">
      <path d="M18 12 h8 c6 0 10 6 10 12 v12 H18 V12 Z" opacity="0.95" />
      <path d="M14 22 h6 v14 H14 Z" opacity="0.7" />
    </g>
  ),
  legs: (
    <g fill="currentColor">
      <rect x="14" y="10" width="8" height="28" rx="4" />
      <rect x="26" y="10" width="8" height="28" rx="4" />
    </g>
  ),
  glutes: (
    <g fill="currentColor">
      <circle cx="18" cy="26" r="9" />
      <circle cx="30" cy="26" r="9" />
    </g>
  ),
  core: (
    <g fill="currentColor">
      <rect x="16" y="12" width="16" height="24" rx="5" />
      <rect x="19" y="18" width="10" height="2" rx="1" fill="var(--color-surface)" opacity="0.5" />
      <rect x="19" y="24" width="10" height="2" rx="1" fill="var(--color-surface)" opacity="0.5" />
      <rect x="19" y="30" width="10" height="2" rx="1" fill="var(--color-surface)" opacity="0.5" />
    </g>
  ),
  cardio: (
    <g fill="currentColor">
      <path d="M8 24 h8 l3-10 5 20 4-12 3 6 h9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  default: (
    <g fill="currentColor">
      <circle cx="24" cy="24" r="10" />
    </g>
  ),
}
