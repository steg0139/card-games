import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Game, Round, RoundScore } from '@/types'
import { useAuth } from './AuthContext'

interface GameContextType {
  game: Game | null
  startGame: (game: Game) => void
  addRound: (scores: RoundScore[], extras?: Partial<Round>) => Game
  endGame: (note?: string, latestGame?: Game) => void
  clearGame: () => void
  savePendingBids: (bids: Record<string, number | string> | null) => void
}

const GameContext = createContext<GameContextType | null>(null)
const LOCAL_KEY = 'active_game'

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [game, setGame] = useState<Game | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_KEY)
    if (stored) setGame(JSON.parse(stored))
  }, [])

  const persist = (g: Game | null) => {
    setGame(g)
    if (g) localStorage.setItem(LOCAL_KEY, JSON.stringify(g))
    else localStorage.removeItem(LOCAL_KEY)
  }

  const startGame = (g: Game) => {
    persist(g)
    if (user) {
      fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(g)
      }).catch(console.error)
    }
  }

  const clearGame = () => {
    if (game && user) {
      fetch(`/api/games/${game.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      }).catch(console.error)
    }
    persist(null)
  }

  const addRound = (scores: RoundScore[], extras: Partial<Round> = {}): Game => {
    if (!game) return game!
    const round: Round = {
      roundNumber: game.rounds.length + 1,
      scores,
      timestamp: Date.now(),
      ...extras
    }
    const updated = { ...game, rounds: [...game.rounds, round], pendingBids: undefined }
    persist(updated)

    if (user) {
      fetch(`/api/games/${game.id}/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(round)
      }).catch(console.error)
    }

    // Auto-end if a target score has been reached
    const target = updated.config.targetScore
      ?? (updated.config.customRules as Record<string, unknown>)?.targetScore as number | undefined
    if (target) {
      const entities = updated.playerMode === 'teams' ? updated.teams : updated.players
      const reached = entities.some(e =>
        updated.rounds.reduce((sum, r) => {
          const s = r.scores.find(s => s.entityId === e.id)
          return sum + (s?.score ?? 0)
        }, 0) >= target
      )
      if (reached) {
        const ended = { ...updated, endedAt: Date.now() }
        persist(ended)
        if (user) {
          fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
            body: JSON.stringify(ended)
          }).catch(console.error)
        }
        return ended
      }
    }

    return updated
  }

  const endGame = (note?: string, latestGame?: Game) => {
    const base = latestGame ?? game
    if (!base) return
    const ended = { ...base, endedAt: Date.now(), ...(note ? { note } : {}) }
    persist(ended)
    if (user) {
      fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(ended)
      }).catch(console.error)
    }
  }

  const savePendingBids = (bids: Record<string, number | string> | null) => {
    if (!game) return
    const updated = { ...game, pendingBids: bids ?? undefined }
    persist(updated)
    if (user) {
      fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(updated)
      }).catch(console.error)
    }
  }

  return (
    <GameContext.Provider value={{ game, startGame, addRound, endGame, clearGame, savePendingBids }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
