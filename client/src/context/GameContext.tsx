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
  addPlayer: (name: string, startingScore: number, position?: number, linkedUserId?: string) => void
  removePlayer: (playerId: string) => void
  undoRound: () => void
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
      }).then(() => {
        // Notify linked players after game is saved
        const hasLinked = g.players.some(p => p.linkedUserId && p.linkedUserId !== user.id)
        if (hasLinked) {
          fetch(`/api/games/${g.id}/notify-start`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${user.token}` }
          }).catch(console.error)
        }
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

      // Copy game to each linked player's history
      const linkedPlayers = ended.players.filter(p => p.linkedUserId && p.linkedUserId !== user.id)
      linkedPlayers.forEach(p => {
        const copy = { ...ended, id: `${ended.id}-${p.linkedUserId}` }
        fetch('/api/games/linked', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({ game: copy, userId: p.linkedUserId })
        }).catch(console.error)
      })
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

  const addPlayer = (name: string, startingScore: number, position?: number, linkedUserId?: string) => {
    if (!game) return
    const newPlayer = { id: Math.random().toString(36).slice(2, 10), name, ...(linkedUserId ? { linkedUserId } : {}) }
    const players = [...game.players]
    if (position !== undefined) players.splice(position, 0, newPlayer)
    else players.push(newPlayer)

    // Add starting score to each existing round as 0, and inject startingScore as a synthetic first entry
    const rounds = game.rounds.map(r => ({
      ...r,
      scores: [...r.scores, { entityId: newPlayer.id, score: 0 }]
    }))

    // If starting score is non-zero, add it to round 1 or create a synthetic round
    if (startingScore !== 0 && rounds.length > 0) {
      rounds[0] = {
        ...rounds[0],
        scores: rounds[0].scores.map(s =>
          s.entityId === newPlayer.id ? { ...s, score: startingScore } : s
        )
      }
    }

    const updated = { ...game, players, rounds }
    persist(updated)
    if (user) {
      fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(updated)
      }).catch(console.error)
    }
  }

  const removePlayer = (playerId: string) => {
    if (!game) return
    const players = game.players.filter(p => p.id !== playerId)
    const rounds = game.rounds.map(r => ({
      ...r,
      scores: r.scores.filter(s => s.entityId !== playerId)
    }))
    const updated = { ...game, players, rounds }
    persist(updated)
    if (user) {
      fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(updated)
      }).catch(console.error)
    }
  }

  const undoRound = () => {
    if (!game || game.rounds.length === 0) return
    const updated = { ...game, rounds: game.rounds.slice(0, -1) }
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
    <GameContext.Provider value={{ game, startGame, addRound, endGame, clearGame, savePendingBids, addPlayer, removePlayer, undoRound }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
