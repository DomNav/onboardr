"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

export function AnimatedThemeToggle() {
  const { theme, setTheme, isTransitioning } = useTheme()

  const toggleTheme = () => {
    if (!isTransitioning) {
      setTheme(theme === "light" ? "dark" : "light")
    }
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={toggleTheme}
      disabled={isTransitioning}
      className="relative inline-flex items-center h-9 w-16 rounded-full transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-soroswap-light dark:shadow-soroswap-dark hover:shadow-soroswap-hover"
      style={{
        background: isDark 
          ? 'var(--gradient-accent)' 
          : 'var(--gradient-secondary)',
      }}
    >
      {/* Toggle Handle */}
      <div 
        className="absolute top-1 left-1 h-7 w-7 rounded-full bg-white shadow-lg transition-all duration-500 ease-in-out flex items-center justify-center dark:bg-slate-800"
        style={{
          transform: isDark ? 'translateX(1.75rem)' : 'translateX(0)',
        }}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-slate-800 dark:text-white" />
        ) : (
          <Sun className="h-4 w-4 text-amber-600" />
        )}
      </div>
      
      {/* Background Icons (improved contrast) */}
      <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
        <Sun className="h-3 w-3 text-amber-600/70 dark:text-white/70" />
        <Moon className="h-3 w-3 text-slate-700/70 dark:text-white/70" />
      </div>
      
      <span className="sr-only">Toggle theme</span>
    </button>
  )
} 