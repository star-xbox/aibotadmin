import { createContext, useContext } from "react"

// Định nghĩa Types (Tùy chọn: bạn có thể để các types này ở 1 file riêng khác nếu muốn)
// export type Theme = "dark" | "light" | "system"

// export type ThemeProviderState = {
//   theme: Theme
//   setTheme: (theme: Theme) => void
// }


export const DEFAULT_THEME = "blue"

export type ThemeContextType = {
  activeTheme: string
  setActiveTheme: (theme: string) => void
}

const initialState: ThemeContextType = {
  activeTheme: DEFAULT_THEME,
  setActiveTheme: () => null,
}

// 1. Context phải được export để dùng trong ThemeProvider
export const ThemeConfigProviderContext = createContext<ThemeContextType>(initialState)

// 2. Custom Hook phải được export
export const useThemeConfig = () => {
  const context = useContext(ThemeConfigProviderContext)

  if (context === undefined) {
    throw new Error("useThemeConfig must be used within a ThemeProvider")
  }

  return context
}