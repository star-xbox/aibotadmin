// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/theme-provider.tsx'
import { ActiveThemeProvider } from './components/active-theme.tsx'
import { AppProvider } from './hooks/use-app.tsx'
import { Toaster } from './components/ui/sonner.tsx'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>     
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <AppProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <ActiveThemeProvider initialTheme="blue">
         
            <App />
            {/* <TailwindIndicator /> */}            
            <Toaster position="top-center" />
        </ActiveThemeProvider>
      </ThemeProvider>
    </AppProvider>
  </BrowserRouter>
  // </StrictMode>,
)
