import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { Game } from '@/types'

export default function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { navigate('/auth'); return }
    fetch('/api/games', {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(r => r.json())
      .then(setGames)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user, navigate])

  const deleteGame = async (id: string) => {
    if (!user) return
    setDeleting(id)
    try {
      await fetch(`/api/games/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      })
      setGames(g => g.filter(game => game.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="page">
      <button className="btn-ghost back-btn" onClick={() => navigate('/')}>← Back</button>
      <div className="history-title-row">
        <h2>Game History</h2>
        {user && <button className="btn-secondary" onClick={() => navigate('/log-past')}>+ Log Past Game</button>}
      </div>
      {loading && <p>Loading…</p>}
      {!loading && games.length === 0 && <p className="muted">No games yet.</p>}
      <div className="history-list">
        {games.map(g => {
          const entities = g.playerMode === 'teams' ? g.teams : g.players
          const totals = entities.map(e => ({
            name: e.name,
            total: g.rounds.reduce((sum, r) => {
              const s = r.scores.find(s => s.entityId === e.id)
              return sum + (s?.score ?? 0)
            }, 0)
          })).sort((a, b) => g.config.lowestScoreWins ? a.total - b.total : b.total - a.total)

          return (
            <div key={g.id} className="history-card" onClick={() => navigate(`/history/${g.id}`)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate(`/history/${g.id}`)}>
              <div className="history-card-header">
                <strong>{g.config.name}</strong>
                <span className="muted">{new Date(g.startedAt).toLocaleDateString()}</span>
                <button
                  className="btn-icon delete-btn"
                  onClick={e => { e.stopPropagation(); deleteGame(g.id) }}
                  disabled={deleting === g.id}
                  aria-label="Delete game"
                >
                  {deleting === g.id ? '…' : '🗑'}
                </button>
              </div>
              {g.playerMode === 'teams' && (
                <div className="history-teams">
                  {g.teams.map(t => {
                    const members = g.players.filter(p => t.playerIds.includes(p.id))
                    return (
                      <span key={t.id} className="muted">
                        {t.name}: {members.map(p => p.name).join(', ')}
                      </span>
                    )
                  })}
                </div>
              )}
              <div className="history-scores">
                {totals.map((t, i) => (
                  <span key={i} className={i === 0 ? 'winner' : ''}>
                    {i === 0 ? '🏆 ' : ''}{t.name}: {t.total}
                  </span>
                ))}
              </div>
              <span className="muted">{g.rounds.length} rounds · tap for details</span>
              {g.note && <p className="game-note">{g.note}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
