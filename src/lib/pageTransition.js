import { animate, stagger } from 'animejs'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function waitForAnimation(targets, params) {
  return new Promise((resolve) => {
    animate(targets, { ...params, onComplete: resolve })
  })
}

function clearInlineMotion(el) {
  if (!el) return
  el.style.opacity = ''
  el.style.transform = ''
}

export async function runPageTransition({ pageEl, onSwap }) {
  if (!pageEl || prefersReducedMotion()) {
    onSwap()
    return
  }

  await waitForAnimation(pageEl, {
    opacity: [1, 0],
    y: [0, -10],
    duration: 200,
    ease: 'inCubic',
  })

  onSwap()

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  const sections = pageEl.querySelectorAll(':scope > *')
  clearInlineMotion(pageEl)
  pageEl.style.opacity = '1'

  if (sections.length === 0) {
    await waitForAnimation(pageEl, {
      opacity: [0, 1],
      y: [14, 0],
      duration: 380,
      ease: 'outCubic',
    })
    clearInlineMotion(pageEl)
    return
  }

  sections.forEach((el) => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(14px)'
  })

  await waitForAnimation(sections, {
    opacity: [0, 1],
    y: [14, 0],
    duration: 420,
    delay: stagger(50),
    ease: 'outCubic',
  })

  clearInlineMotion(pageEl)
  sections.forEach(clearInlineMotion)
}

export function staggerListItems(container) {
  if (!container || prefersReducedMotion()) return
  const items = container.querySelectorAll('.ft-stagger-item')
  if (!items.length) return

  items.forEach((el) => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(12px)'
  })

  animate(items, {
    opacity: [0, 1],
    y: [12, 0],
    duration: 400,
    delay: stagger(60),
    ease: 'outCubic',
    onComplete: () => items.forEach(clearInlineMotion),
  })
}
