import { createContext, useContext } from "react"

// Định nghĩa Types (Tùy chọn: bạn có thể để các types này ở 1 file riêng khác nếu muốn)
export type Theme = "dark" | "light" | "system"

export type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

// 1. Context phải được export để dùng trong ThemeProvider
export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// 2. Custom Hook phải được export
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}