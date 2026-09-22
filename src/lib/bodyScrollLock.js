let lockCount = 0
let savedOverflow = ''

/** Nesting-safe body scroll lock (BottomSheet / live / overlays). */
export function lockBodyScroll() {
  if (typeof document === 'undefined') return
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow
    savedOverflow = ''
  }
}
