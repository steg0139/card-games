import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { GameConfig } from '@/types'
import { useAuth } from './AuthContext'
import { GAME_CONFIGS } from '@/games/configs'

type GamePrefs = Record<string, { customRules?: Record<string, unknown>; targetScore?: number }>

interface PreferencesContextType {
  getConfig: (gameId: string) => GameConfig
  savePreference: (gameId: string, customRules: Record<string, unknown>, targetScore?: number) => Promise<void>
  prefs: GamePrefs
  favorites: string[]
  toggleFavorite: (gameId: string) => Promise<void>
}

const PreferencesContext = createContext<PreferencesContextType | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<GamePrefs>({})
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    if (!user) { setPrefs({}); return }
    fetch('/api/preferences', {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(r => r.json())
      .then(data => {
        setPrefs(data)
        const favData = data.__favorites
        setFavorites(Array.isArray(favData) ? favData : (favData?.customRules?.list ?? []))
      })
      .catch(console.error)
  }, [user])

  const getConfig = (gameId: string): GameConfig => {
    const base = GAME_CONFIGS.find(g => g.id === gameId)
    if (!base) return {} as GameConfig
    const saved = prefs[gameId]
    if (!saved) return base
    return {
      ...base,
      ...(saved.targetScore !== undefined ? { targetScore: saved.targetScore } : {}),
      customRules: { ...base.customRules, ...saved.customRules }
    }
  }

  const savePreference = async (gameId: string, customRules: Record<string, unknown>, targetScore?: number) => {
    if (!user) return
    const updated = { ...prefs, [gameId]: { customRules, ...(targetScore !== undefined ? { targetScore } : {}) } }
    setPrefs(updated)
    await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ gameId, customRules, targetScore })
    })
  }

  const toggleFavorite = async (gameId: string) => {
    if (!user) return
    const updated = favorites.includes(gameId)
      ? favorites.filter(id => id !== gameId)
      : [...favorites, gameId]
    setFavorites(updated)
    await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ gameId: '__favorites', customRules: { list: updated } })
    })
  }

  return (
    <PreferencesContext.Provider value={{ getConfig, savePreference, prefs, favorites, toggleFavorite }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
