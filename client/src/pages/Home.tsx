import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useGame } from '@/context/GameContext'
import { useAuth } from '@/context/AuthContext'
import { GAME_CONFIGS } from '@/games/configs'
import type { Game } from '@/types'
import CardShuffle from '@/components/CardShuffle'
import Confetti from '@/components/Confetti'
import { useKonami } from '@/hooks/useEasterEggs'

export default function Home() {
  const navigate = useNavigate()
  const { game, clearGame } = useGame()
  const { user, logout } = useAuth()
  const [activeForMe, setActiveForMe] = useState<Game[]>([])
  const [shuffling, setShuffling] = useState(false)
  const [konami, setKonami] = useState(false)
  useKonami(() => setKonami(true))
  const tapCount = useRef(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleLogoTap = () => {
    tapCount.current += 1
    if (tapTimer.current) clearTimeout(tapTimer.current)
    tapTimer.current = setTimeout(() => { tapCount.current = 0 }, 800)
    if (tapCount.current >= 5) {
      tapCount.current = 0
      setShuffling(true)
    }
  }

  useEffect(() => {
    if (!user) return
    fetch('/api/games/active-for-me', {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(r => r.json())
      .then(setActiveForMe)
      .catch(console.error)
  }, [user])

  return (
    <div className="page">
      {shuffling && <CardShuffle onDone={() => setShuffling(false)} />}
      {konami && <Confetti onDone={() => setKonami(false)} />}
      <header className="app-header">
        <h1 onClick={handleLogoTap} style={{ cursor: 'default', userSelect: 'none' }}>🃏 Card Game Score Tracker</h1>
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

      {activeForMe.length > 0 && (
        <section className="game-list">
          <h2>Games you're in</h2>
          <div className="active-for-me-list">
            {activeForMe.map(g => (
              <div key={g.id} className="active-for-me-card">
                <div>
                  <strong>{g.config.name}</strong>
                  <span className="muted"> · {g.players.find(p => p.linkedUserId === user?.id)?.name ?? 'You'}</span>
                </div>
                <button className="btn-primary" onClick={() => navigate(`/watch/${g.id}`)}>
                  Watch Live
                </button>
              </div>
            ))}
          </div>
        </section>
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
          <button className="game-card custom-game-card" onClick={() => navigate('/setup-custom')}>
            <span className="game-name">+ Custom</span>
            <span className="game-meta">any game, simple scoring</span>
          </button>
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
