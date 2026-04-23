import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { Game } from '@/types'
import AppHeader from '@/components/AppHeader'

export default function GameDetail() {
  const { gameId } = useParams<{ gameId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/auth'); return }
    fetch('/api/games', { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then((games: Game[]) => setGame(games.find(g => g.id === gameId) ?? null))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user, gameId, navigate])

  if (loading) return <div className="page"><p>Loading…</p></div>
  if (!game) return <div className="page"><p>Game not found.</p></div>

  const entities = game.playerMode === 'teams' ? game.teams : game.players

  const totals = entities.map(e => ({
    ...e,
    roundScores: game.rounds.map(r => r.scores.find(s => s.entityId === e.id)?.score ?? 0),
    total: game.rounds.reduce((sum, r) => {
      const s = r.scores.find(s => s.entityId === e.id)
      return sum + (s?.score ?? 0)
    }, 0)
  }))

  const sorted = [...totals].sort((a, b) =>
    game.config.lowestScoreWins ? a.total - b.total : b.total - a.total
  )

  const isCooperative = !!(game.config.customRules as Record<string, unknown>)?.cooperative

  return (
    <div className="page">
      <AppHeader />
      <button className="btn-ghost back-btn" onClick={() => navigate('/history')}>← History</button>

      <div className="detail-header">
        <h2>{game.config.name}</h2>
        <span className="muted">{new Date(game.startedAt).toLocaleDateString()}</span>
      </div>

      {game.note && <p className="game-note">{game.note}</p>}

      {/* Teams + players */}
      {game.playerMode === 'teams' && (
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

      {/* Final standings */}
      <section className="detail-section">
        <h3>{isCooperative ? 'Result' : 'Final Standings'}</h3>
        {isCooperative ? (
          <p className="winner-text" style={{ fontSize: '1rem' }}>
            {sorted.reduce((sum, e) => sum + e.total, 0) === 0
              ? '🎉 Perfect game!'
              : `🃏 ${sorted.reduce((sum, e) => sum + e.total, 0)} cards remaining`}
          </p>
        ) : (
          <div className="standings-list">
            {sorted.map((e, i) => (
              <div key={e.id} className="standing-row">
                <span className="standing-rank">{i === 0 ? '🏆' : `${i + 1}.`}</span>
                <span className="standing-name">{e.name}</span>
                <strong>{e.total}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Round by round */}
      {game.rounds.length > 0 && (
        <section className="detail-section">
          <h3>Round by Round</h3>
          <div className="scoreboard-table-wrap">
            <table className="scoreboard-table">
              <thead>
                <tr>
                  <th className="name-col">Player</th>
                  {game.rounds.map((_, i) => <th key={i}>R{i + 1}</th>)}
                  <th className="total-col">Total</th>
                </tr>
              </thead>
              <tbody>
                {totals.map(e => (
                  <tr key={e.id}>
                    <td className="name-col">{e.name}</td>
                    {e.roundScores.map((s, i) => <td key={i}>{s}</td>)}
                    <td className="total-col"><strong>{e.total}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
