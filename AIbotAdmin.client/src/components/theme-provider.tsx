import { ThemeProviderContext } from "@/hooks/use-theme"
import { useEffect, useState } from "react"
 
type Theme = "dark" | "light" | "system"
 
type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}
 
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")
    if (theme === "system") {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const applySystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
            root.classList.remove("light", "dark")
            const systemTheme = e.matches ? "dark" : "light";
            root.classList.add(systemTheme);
        };
        applySystemTheme(mediaQuery);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", applySystemTheme);
        } else {
            mediaQuery.addListener(applySystemTheme);
        }
        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener("change", applySystemTheme);
            } else {
                mediaQuery.removeListener(applySystemTheme);
            }
        };
    }
    else{
        root.classList.add(theme)
    }
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}