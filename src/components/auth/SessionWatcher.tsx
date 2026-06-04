"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/useAuthStore"

const TIMEOUT_MS = 2 * 60 * 1000 // 2 minutes

export function SessionWatcher() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, logout } = useAuthStore()
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const resetTimer = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    timeoutRef.current = setTimeout(() => {
      if (isAuthenticated) {
        logout()
        router.push('/login?reason=timeout')
      }
    }, TIMEOUT_MS)
  }, [isAuthenticated, logout, router])

  React.useEffect(() => {
    // Only watch on protected routes
    const publicRoutes = ['/login', '/onboarding', '/setup-pin']
    if (publicRoutes.includes(pathname) || !isAuthenticated) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      return
    }

    // Set initial timer
    resetTimer()

    // Listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    const handler = () => resetTimer()

    events.forEach(e => document.addEventListener(e, handler, { passive: true }))

    return () => {
      events.forEach(e => document.removeEventListener(e, handler))
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isAuthenticated, pathname, resetTimer])

  return null
}
