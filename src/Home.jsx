import { useCallback, useRef, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { SettingsMenu, useSettingsSheet } from './components/SettingsMenu'
import { DashboardPage } from './pages/DashboardPage'
import { JournalPage } from './pages/JournalPage'
import { TimerPage } from './pages/TimerPage'
import { WeightPage } from './pages/WeightPage'
import { runPageTransition } from './lib/pageTransition'

export default function Home() {
  const [screen, setScreen] = useState('dashboard')
  const pageRef = useRef(null)
  const switchingRef = useRef(false)
  const { settingsOpen, openSettings, closeSettings } = useSettingsSheet()

  const handleNav = useCallback(
    async (next) => {
      if (next === screen || switchingRef.current) return
      switchingRef.current = true
      try {
        await runPageTransition({
          pageEl: pageRef.current,
          onSwap: () => setScreen(next),
        })
      } finally {
        switchingRef.current = false
      }
    },
    [screen],
  )

  const settingsProps = { onOpenSettings: openSettings }

  return (
    <div className="ft-shell">
      <main className="ft-page" ref={pageRef}>
        {screen === 'dashboard' && <DashboardPage {...settingsProps} />}
        {screen === 'journal' && <JournalPage {...settingsProps} />}
        {screen === 'timer' && <TimerPage {...settingsProps} />}
        {screen === 'weight' && <WeightPage {...settingsProps} />}
      </main>
      <BottomNav active={screen} onChange={handleNav} />
      <SettingsMenu open={settingsOpen} onClose={closeSettings} />
    </div>
  )
}
