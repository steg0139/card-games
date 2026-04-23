import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { GAME_CONFIGS } from '@/games/configs'
import type { Game } from '@/types'
import AppHeader from '@/components/AppHeader'

function getWinner(g: Game): string | null {
  const entities = g.playerMode === 'teams' ? g.teams : g.players
  const totals = entities.map(e => ({
    name: e.name,
    total: g.rounds.reduce((sum, r) => {
      const s = r.scores.find(s => s.entityId === e.id)
      return sum + (s?.score ?? 0)
    }, 0)
  })).sort((a, b) => g.config.lowestScoreWins ? a.total - b.total : b.total - a.total)
  return totals[0]?.name ?? null
}

function calcStats(games: Game[]) {
  if (games.length === 0) return null

  // Win counts
  const wins: Record<string, number> = {}
  const appearances: Record<string, number> = {}
  let totalRounds = 0

  for (const g of games) {
    const winner = getWinner(g)
    const entities = g.playerMode === 'teams' ? g.teams : g.players
    for (const e of entities) {
      appearances[e.name] = (appearances[e.name] ?? 0) + 1
      if (e.name === winner) wins[e.name] = (wins[e.name] ?? 0) + 1
    }
    totalRounds += g.rounds.length
  }

  const mostWins = Object.entries(wins).sort((a, b) => b[1] - a[1])[0]
  const avgRounds = (totalRounds / games.length).toFixed(1)

  return { mostWins, avgRounds, totalGames: games.length }
}

export default function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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

  const filtered = search.trim()
    ? games.filter(g => {
        const q = search.trim().toLowerCase()
        return g.config.name.toLowerCase().includes(q) ||
          g.players.some(p => p.name.toLowerCase().includes(q))
      })
    : games

  // Only show stats when filtering by a specific game name
  const isGameFilter = search.trim() &&
    GAME_CONFIGS.some(g => g.name.toLowerCase() === search.trim().toLowerCase()) ||
    (filtered.length > 0 && filtered.every(g => g.config.name === filtered[0].config.name))

  const stats = useMemo(() =>
    isGameFilter ? calcStats(filtered) : null
  , [filtered, isGameFilter])

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
      <AppHeader />
      <button className="btn-ghost back-btn" onClick={() => navigate('/')}>← Back</button>
      <div className="history-title-row">
        <h2>Game History</h2>
        {user && <button className="btn-secondary" onClick={() => navigate('/log-past')}>+ Log Past Game</button>}
      </div>
      <div className="history-search">
        <input
          type="search"
          list="game-names"
          placeholder="Search by game or player…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <datalist id="game-names">
          {GAME_CONFIGS.map(g => <option key={g.id} value={g.name} />)}
        </datalist>
        {search && (
          <button className="btn-ghost" onClick={() => setSearch('')} style={{ padding: '0 8px' }}>✕</button>
        )}
      </div>

      {stats && (
        <div className="stats-banner">
          <div className="stat-item">
            <span className="stat-value">{stats.totalGames}</span>
            <span className="stat-label">games</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{stats.avgRounds}</span>
            <span className="stat-label">avg rounds</span>
          </div>
          {stats.mostWins && (
            <>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">🏆 {stats.mostWins[0]}</span>
                <span className="stat-label">{stats.mostWins[1]} win{stats.mostWins[1] !== 1 ? 's' : ''}</span>
              </div>
            </>
          )}
        </div>
      )}

      {loading && <p>Loading…</p>}
      {!loading && filtered.length === 0 && (
        <p className="muted">{search ? `No games found for "${search}"` : 'No games yet.'}</p>
      )}
      <div className="history-list">
        {filtered.map(g => {
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
