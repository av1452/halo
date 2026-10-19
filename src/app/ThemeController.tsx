import { useEffect, useState } from 'react'
import { applyTheme } from '../design-system/theme'
import { themeStore } from '../design-system/themeStore'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function usePrefersDark() {
  const [prefersDark, setPrefersDark] = useState(() => window.matchMedia?.(DARK_QUERY).matches ?? false)
  useEffect(() => {
    const mql = window.matchMedia?.(DARK_QUERY)
    if (!mql) return
    const onChange = () => setPrefersDark(mql.matches)
    // Safari < 14 only supports the deprecated addListener API
    if (mql.addEventListener) mql.addEventListener('change', onChange)
    else mql.addListener(onChange)
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange)
      else mql.removeListener(onChange)
    }
  }, [])
  return prefersDark
}

/** Keeps <html> theme attributes in sync with saved settings and the OS. */
export function ThemeController() {
  const theme = themeStore.use()
  const prefersDark = usePrefersDark()
  useEffect(() => applyTheme(theme, prefersDark), [theme, prefersDark])
  return null
}
