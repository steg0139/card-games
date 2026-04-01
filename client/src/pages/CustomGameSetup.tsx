import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '@/context/GameContext'
import { useAuth } from '@/context/AuthContext'
import type { Game, Player, GameConfig } from '@/types'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function CustomGameSetup() {
  const navigate = useNavigate()
  const { startGame } = useGame()
  const { user } = useAuth()

  const [gameName, setGameName] = useState('')
  const [lowestWins, setLowestWins] = useState(false)
  const [playerNames, setPlayerNames] = useState<string[]>(['', ''])

  const validPlayers = playerNames.filter(n => n.trim())
  const canStart = gameName.trim().length > 0 && validPlayers.length >= 2

  const addPlayer = () => setPlayerNames(p => [...p, ''])
  const removePlayer = (i: number) => setPlayerNames(p => p.filter((_, idx) => idx !== i))

  const handleStart = async () => {
    const config: GameConfig = {
      id: 'custom',
      name: gameName.trim(),
      playerMode: 'individual',
      minPlayers: 2,
      maxPlayers: 20,
      hasBidding: false,
      hasRounds: true,
      lowestScoreWins: lowestWins,
      roundScoring: 'free'
    }

    const players: Player[] = validPlayers.map(name => ({ id: generateId(), name }))

    const game: Game = {
      id: generateId(),
      gameConfigId: 'custom',
      playerMode: 'individual',
      players,
      teams: [],
      rounds: [],
      startedAt: Date.now(),
      config
    }

    startGame(game)
    navigate('/game')
  }

  return (
    <div className="page">
      <button className="btn-ghost back-btn" onClick={() => navigate('/')}>← Back</button>
      <h2>Custom Game</h2>

      <section className="setup-section">
        <h3>Game Name</h3>
        <input
          type="text"
          placeholder="e.g. Cribbage, Gin, Canasta…"
          value={gameName}
          onChange={e => setGameName(e.target.value)}
        />
      </section>

      <section className="setup-section">
        <h3>Scoring</h3>
        <div className="toggle-group">
          <button className={!lowestWins ? 'toggle active' : 'toggle'} onClick={() => setLowestWins(false)}>
            Highest wins
          </button>
          <button className={lowestWins ? 'toggle active' : 'toggle'} onClick={() => setLowestWins(true)}>
            Lowest wins
          </button>
        </div>
      </section>

      <section className="setup-section">
        <h3>Players</h3>
        {playerNames.map((name, i) => (
          <div key={i} className="player-row">
            <input
              type="text"
              placeholder={`Player ${i + 1}`}
              value={name}
              onChange={e => setPlayerNames(p => p.map((n, idx) => idx === i ? e.target.value : n))}
            />
            {playerNames.length > 2 && (
              <button className="btn-icon" onClick={() => removePlayer(i)} aria-label="Remove player">✕</button>
            )}
          </div>
        ))}
        <button className="btn-secondary" onClick={addPlayer}>+ Add Player</button>
      </section>

      <button className="btn-primary full-width" onClick={handleStart} disabled={!canStart}>
        Start Game
      </button>
    </div>
  )
}
