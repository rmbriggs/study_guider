import { createContext, useContext, useCallback, useEffect, useState } from 'react'

const THEME_KEY = 'theme'

function readThemeFromDom() {
  if (typeof document === 'undefined') return 'light'
  const theme = document.documentElement.getAttribute('data-theme')
  return theme === 'dark' ? 'dark' : 'light'
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => readThemeFromDom())

  const setTheme = useCallback((next) => {
    const value = next === 'dark' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', value)
    localStorage.setItem(THEME_KEY, value)
    setThemeState(value)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  useEffect(() => {
    setThemeState(readThemeFromDom())
  }, [])

  const value = { theme, setTheme, toggleTheme }
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
