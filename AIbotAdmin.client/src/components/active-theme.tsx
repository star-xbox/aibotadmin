import { DEFAULT_THEME, ThemeConfigProviderContext } from "@/hooks/use-theme-config"
import {
  useEffect,
  useState,
  type ReactNode,
} from "react"



export function ActiveThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode
  initialTheme?: string
}) {
  const [activeTheme, setActiveTheme] = useState<string>(
    () => initialTheme || DEFAULT_THEME
  )

  useEffect(() => {
    Array.from(document.body.classList)
      .filter((className) => className.startsWith("theme-"))
      .forEach((className) => {
        document.body.classList.remove(className)
      })
    document.body.classList.add(`theme-${activeTheme}`)
    if (activeTheme.endsWith("-scaled")) {
      document.body.classList.add("theme-scaled")
    }
  }, [activeTheme])

  return (
    <ThemeConfigProviderContext.Provider value={{ activeTheme, setActiveTheme }}>
      {children}
    </ThemeConfigProviderContext.Provider>
  )
}