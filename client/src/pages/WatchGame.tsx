import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Game } from '@/types'
import Scoreboard from '@/components/Scoreboard'
import ScoringRules from '@/components/ScoringRules'

export default function WatchGame() {
  const { gameId } = useParams<{ gameId: string }>()
  const [game, setGame] = useState<Game | null>(null)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/games/public/${gameId}`)
      if (!res.ok) { setError('Game not found or not shared.'); return }
      const data = await res.json()
      setGame(data)
      setLastUpdated(new Date())
    } catch {
      setError('Failed to load game.')
    }
  }

  useEffect(() => {
    fetchGame()
    const interval = setInterval(fetchGame, 10000) // poll every 10s
    return () => clearInterval(interval)
  }, [gameId])

  if (error) return (
    <div className="page centered">
      <p className="muted">{error}</p>
    </div>
  )

  if (!game) return (
    <div className="page centered">
      <p className="muted">Loading…</p>
    </div>
  )

  const rules = game.config.customRules as Record<string, unknown> | undefined

  return (
    <div className="page">
      <div className="watch-header">
        <div>
          <h2>{game.config.name}</h2>
          <span className="muted">
            {game.endedAt ? 'Game over' : '🔴 Live'}
            {lastUpdated && ` · updated ${lastUpdated.toLocaleTimeString()}`}
          </span>
        </div>
      </div>

      {game.playerMode === 'teams' && game.teams.length > 0 && (
        <section className="detail-section">
          <h3>Teams</h3>
          <div className="teams-list">
            {game.teams.map(team => {
              const members = game.players.filter(p => team.playerIds.includes(p.id))
              return (
                <div key={team.id} className="team-card">
                  <strong>{team.name}</strong>
                  <span className="muted">{members.map(p => p.name).join(', ')}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <Scoreboard game={game} showFinal={!!game.endedAt} />

      <ScoringRules config={game.config} />

      {rules && (
        <section className="detail-section">
          <h3>Rules</h3>
          <div className="rules-panel">
            {rules.description && <p className="rules-desc">{String(rules.description)}</p>}
            {game.config.targetScore && <p className="muted">Target score: {game.config.targetScore}</p>}
            {rules.targetScore && <p className="muted">Target score: {String(rules.targetScore)}</p>}
          </div>
        </section>
      )}

      {game.endedAt && (
        <div className="watch-ended">
          <p>Game finished {new Date(game.endedAt).toLocaleDateString()}</p>
          {game.note && <p className="game-note">{game.note}</p>}
        </div>
      )}

      <p className="watch-footer muted">This page refreshes automatically every 10 seconds.</p>
    </div>
  )
}
