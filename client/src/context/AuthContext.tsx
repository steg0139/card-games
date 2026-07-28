import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AuthUser } from '@/types'

interface AuthContextType {
  user: AuthUser | null
  loaded: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('auth_user')
    if (stored) setUser(JSON.parse(stored))
    setLoaded(true)
  }, [])

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Login failed')
    const data: AuthUser = await res.json()
    setUser(data)
    localStorage.setItem('auth_user', JSON.stringify(data))
  }

  const register = async (username: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Registration failed')
    const data: AuthUser = await res.json()
    setUser(data)
    localStorage.setItem('auth_user', JSON.stringify(data))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
  }

  // Global 401 detection — auto-logout on expired tokens
  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const res = await originalFetch(...args)
      if (res.status === 401 && user) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
        // Only auto-logout for our API calls, not login/register attempts
        if (url.includes('/api/') && !url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
          logout()
        }
      }
      return res
    }
    return () => { window.fetch = originalFetch }
  }, [user])

  return <AuthContext.Provider value={{ user, loaded, login, register, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
