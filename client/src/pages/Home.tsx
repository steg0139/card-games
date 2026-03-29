import { useNavigate } from 'react-router-dom'
import { useGame } from '@/context/GameContext'
import { useAuth } from '@/context/AuthContext'
import { GAME_CONFIGS } from '@/games/configs'

export default function Home() {
  const navigate = useNavigate()
  const { game, clearGame } = useGame()
  const { user, logout } = useAuth()

  return (
    <div className="page">
      <header className="app-header">
        <h1>🃏 Card Score Tracker</h1>
        <div className="header-actions">
          {user ? (
            <div className="user-info">
              <span>{user.username}</span>
              <button className="btn-ghost" onClick={logout}>Sign out</button>
            </div>
          ) : (
            <button className="btn-ghost" onClick={() => navigate('/auth')}>Sign in</button>
          )}
        </div>
      </header>

      {game && !game.endedAt && (
        <div className="active-game-banner">
          <span>Active game: <strong>{game.config.name}</strong></span>
          <div className="banner-actions">
            <button className="btn-primary" onClick={() => navigate('/game')}>Resume</button>
            <button className="btn-ghost" onClick={clearGame}>Abandon</button>
          </div>
        </div>
      )}

      <section className="game-list">
        <h2>Choose a Game</h2>
        <div className="game-grid">
          {GAME_CONFIGS.map(config => (
            <button
              key={config.id}
              className="game-card"
              onClick={() => navigate(`/setup/${config.id}`)}
            >
              <span className="game-name">{config.name}</span>
              <span className="game-meta">
                {config.minPlayers}–{config.maxPlayers} players
                {config.playerMode === 'both' ? ' · teams or solo' : ''}
              </span>
            </button>
          ))}
        </div>
      </section>

      {user && (
        <button className="btn-secondary full-width" onClick={() => navigate('/history')}>
          View Game History
        </button>
      )}
    </div>
  )
}
