import { useNavigate } from 'react-router-dom'
import { useGame } from '@/context/GameContext'
import Scoreboard from '@/components/Scoreboard'
import AppHeader from '@/components/AppHeader'

export default function Results() {
  const { game, clearGame } = useGame()
  const navigate = useNavigate()

  if (!game) {
    navigate('/')
    return null
  }

  const isCooperative = !!(game.config.customRules as Record<string, unknown>)?.cooperative
  const entities = game.playerMode === 'teams' ? game.teams : game.players

  const totals = entities.map(e => ({
    ...e,
    total: game.rounds.reduce((sum, r) => {
      const s = r.scores.find(s => s.entityId === e.id)
      return sum + (s?.score ?? 0)
    }, 0)
  }))

  const sorted = [...totals].sort((a, b) =>
    game.config.lowestScoreWins ? a.total - b.total : b.total - a.total
  )
  const winner = sorted[0]
  const teamTotal = isCooperative ? totals.reduce((sum, e) => sum + e.total, 0) : null

  return (
    <div className="page">
      <AppHeader />
      <div className="results-header">
        <h2>Game Over</h2>
        {isCooperative
          ? <p className="winner-text">{teamTotal === 0 ? '🎉 Perfect game!' : `🃏 ${teamTotal} cards remaining`}</p>
          : <p className="winner-text">🏆 {winner.name} wins!</p>
        }
        {game.note && <p className="game-note">{game.note}</p>}
      </div>

      <Scoreboard game={game} showFinal />

      <div className="results-actions">
        <button className="btn-primary" onClick={() => { clearGame(); navigate('/') }}>
          New Game
        </button>
        <button className="btn-secondary" onClick={() => navigate('/')}>
          Home
        </button>
      </div>
    </div>
  )
}
