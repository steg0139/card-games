import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '@/context/GameContext'
import type { Game } from '@/types'
import Scoreboard from '@/components/Scoreboard'
import RoundEntry from '@/components/RoundEntry'

export default function GamePlay() {
  const { game, endGame, clearGame } = useGame()
  const navigate = useNavigate()
  const [enteringRound, setEnteringRound] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [endNote, setEndNote] = useState('')

  if (!game) {
    navigate('/')
    return null
  }

  const isSingleRound = game.config.id === 'the-game'

  const handleComplete = (updatedGame: Game) => {
    endGame(undefined, updatedGame)
    navigate('/results')
  }

  const handleEndGame = () => {
    endGame(endNote.trim() || undefined)
    setShowEndConfirm(false)
    navigate('/results')
  }

  return (
    <div className="page">
      <header className="game-header">
        <button className="btn-ghost" onClick={() => navigate('/')}>← Home</button>
        <h2>{game.config.name}</h2>
        <button className="btn-ghost danger" onClick={() => setShowEndConfirm(true)}>End</button>
      </header>

      <Scoreboard game={game} />

      {!enteringRound ? (
        !isSingleRound && (
          <button className="btn-primary full-width" onClick={() => setEnteringRound(true)}>
            + Enter Round {game.rounds.length + 1}
          </button>
        )
      ) : (
        <RoundEntry
          game={game}
          onSave={() => setEnteringRound(false)}
          onCancel={() => setEnteringRound(false)}
          onComplete={isSingleRound ? handleComplete : undefined}
        />
      )}

      {isSingleRound && game.rounds.length === 0 && !enteringRound && (
        <button className="btn-primary full-width" onClick={() => setEnteringRound(true)}>
          Enter Scores
        </button>
      )}

      {showEndConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>End Game?</h3>
            <p>This will finalize scores and save the result.</p>
            <label>
              Note (optional)
              <textarea
                value={endNote}
                onChange={e => setEndNote(e.target.value)}
                placeholder="Add a note about this game…"
                rows={3}
              />
            </label>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleEndGame}>End Game</button>
              <button className="btn-ghost" onClick={() => setShowEndConfirm(false)}>Cancel</button>
              <button className="btn-ghost danger" onClick={() => { clearGame(); navigate('/') }}>
                Abandon (no save)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
