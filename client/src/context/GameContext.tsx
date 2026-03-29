import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Game, Round, RoundScore } from '@/types'
import { useAuth } from './AuthContext'

interface GameContextType {
  game: Game | null
  startGame: (game: Game) => void
  addRound: (scores: RoundScore[], extras?: Partial<Round>) => Game
  endGame: (note?: string, latestGame?: Game) => void
  clearGame: () => void
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

  const startGame = (g: Game) => persist(g)

  const addRound = (scores: RoundScore[], extras: Partial<Round> = {}): Game => {
    if (!game) return game!
    const round: Round = {
      roundNumber: game.rounds.length + 1,
      scores,
      timestamp: Date.now(),
      ...extras
    }
    const updated = { ...game, rounds: [...game.rounds, round] }
    persist(updated)

    if (user) {
      fetch(`/api/games/${game.id}/rounds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(round)
      }).catch(console.error)
    }
    return updated
  }

  const endGame = (note?: string, latestGame?: Game) => {
    const base = latestGame ?? game
    if (!base) return
    const ended = { ...base, endedAt: Date.now(), ...(note ? { note } : {}) }
    persist(ended)
    if (user) {
      // Save the complete final game in one shot (handles cases where game wasn't synced yet)
      fetch(`/api/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(ended)
      }).catch(console.error)
    }
  }

  const clearGame = () => persist(null)

  return (
    <GameContext.Provider value={{ game, startGame, addRound, endGame, clearGame }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
