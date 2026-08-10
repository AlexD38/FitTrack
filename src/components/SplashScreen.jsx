import { useEffect, useRef, useState } from 'react'
import { createTimeline, stagger } from 'animejs'
import { useLocale } from '../contexts/LocaleContext'

const HOLD_MS = 700
const FADE_MS = 500

export function SplashScreen({ onDone }) {
  const rootRef = useRef(null)
  const [mounted, setMounted] = useState(true)
  const { t } = useLocale()
  const wordmark = t('appName')

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    let cancelled = false
    const finish = () => {
      if (cancelled) return
      cancelled = true
      setMounted(false)
      onDone?.()
    }

    const letters = [...root.querySelectorAll('.ft-splash__letter')]
    const rule = root.querySelector('.ft-splash__rule')
    const tagline = root.querySelector('.ft-splash__tagline')

    const showAll = () => {
      letters.forEach((el) => {
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      })
      if (rule) {
        rule.style.opacity = '1'
        rule.style.transform = 'scaleX(1)'
      }
      if (tagline) {
        tagline.style.opacity = '1'
        tagline.style.transform = 'translateY(0)'
      }
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      showAll()
      const id = window.setTimeout(finish, HOLD_MS + FADE_MS)
      return () => {
        cancelled = true
        window.clearTimeout(id)
      }
    }

    const tl = createTimeline({
      defaults: { ease: 'outCubic' },
      onComplete: finish,
    })

    // Appear: each letter fades/slides in
    tl.add(letters, {
      opacity: { from: 0, to: 1 },
      translateY: { from: 20, to: 0 },
      duration: 650,
      delay: stagger(70),
    })

    if (rule) {
      tl.add(
        rule,
        {
          opacity: { from: 0, to: 1 },
          scaleX: { from: 0, to: 1 },
          duration: 450,
        },
        '-=380',
      )
    }

    if (tagline) {
      tl.add(
        tagline,
        {
          opacity: { from: 0, to: 1 },
          translateY: { from: 8, to: 0 },
          duration: 450,
        },
        '-=280',
      )
    }

    tl.add({ duration: HOLD_MS })
    tl.add(root, {
      opacity: { from: 1, to: 0 },
      duration: FADE_MS,
      ease: 'inOutQuad',
    })

    return () => {
      cancelled = true
      tl.pause()
    }
  }, [onDone, wordmark])

  if (!mounted) return null

  return (
    <div className="ft-splash" ref={rootRef} aria-hidden="true">
      <div className="ft-splash__mark">
        {wordmark.split('').map((char, i) => (
          <span key={`${char}-${i}`} className="ft-splash__letter">
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>
      <div className="ft-splash__rule" />
      <p className="ft-splash__tagline">{t('tagline')}</p>
    </div>
  )
}
