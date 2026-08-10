import { useCallback, useState } from 'react'
import { FitnessProvider } from './contexts/FitnessContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LocaleProvider } from './contexts/LocaleContext'
import { SplashScreen } from './components/SplashScreen'
import Home from './Home'
import './App.css'

function App() {
  const [booting, setBooting] = useState(true)
  const handleSplashDone = useCallback(() => setBooting(false), [])

  return (
    <FitnessProvider>
      <ThemeProvider>
        <LocaleProvider>
          {booting && <SplashScreen onDone={handleSplashDone} />}
          <div className={`ft-app${booting ? ' ft-app--booting' : ''}`}>
            <Home />
          </div>
        </LocaleProvider>
      </ThemeProvider>
    </FitnessProvider>
  )
}

export default App
