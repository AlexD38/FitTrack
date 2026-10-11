import { useCallback, useState } from 'react'
import { FitnessProvider } from './contexts/FitnessContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LocaleProvider } from './contexts/LocaleContext'
import { SplashScreen } from './components/SplashScreen'
import { OnboardingTour, TOUR_KEY } from './components/OnboardingTour'
import Home from './Home'
import './App.css'

function readTourSeen() {
  try {
    return localStorage.getItem(TOUR_KEY) === '1'
  } catch {
    return false
  }
}

function App() {
  const [booting, setBooting] = useState(true)
  const [tourOpen, setTourOpen] = useState(false)

  const handleSplashDone = useCallback(() => {
    setBooting(false)
    if (!readTourSeen()) setTourOpen(true)
  }, [])

  return (
    <FitnessProvider>
      <ThemeProvider>
        <LocaleProvider>
          {booting && <SplashScreen onDone={handleSplashDone} />}
          <div className={`ft-app${booting ? ' ft-app--booting' : ''}`}>
            <Home />
          </div>
          <OnboardingTour open={!booting && tourOpen} onDone={() => setTourOpen(false)} />
        </LocaleProvider>
      </ThemeProvider>
    </FitnessProvider>
  )
}

export default App
