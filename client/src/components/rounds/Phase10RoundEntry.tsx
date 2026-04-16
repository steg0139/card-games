import { useState } from 'react'
import type { Game, RoundScore } from '@/types'

interface Props {
  game: Game
  onSave: (scores: RoundScore[]) => void
  onCancel: () => void
}

const PHASES = [
  '2 sets of 3',
  '1 set of 3 + 1 run of 4',
  '1 set of 4 + 1 run of 4',
  '1 run of 7',
  '1 run of 8',
  '1 run of 9',
  '2 sets of 4',
  '7 cards of one color',
  '1 set of 5 + 1 set of 2',
  '1 set of 5 + 1 set of 3',
]

// Get current phase for a player based on round history
function getCurrentPhase(game: Game, playerId: string): number {
  let phase = 1
  for (const round of game.rounds) {
    const score = round.scores.find(s => s.entityId === playerId)
    if (score?.note?.startsWith('phase:')) {
      const completed = score.note.includes(':completed')
      const phaseNum = parseInt(score.note.split(':')[1])
      if (completed && phaseNum === phase) phase = Math.min(phase + 1, 10)
    }
  }
  return phase
}

export default function Phase10RoundEntry({ game, onSave, onCancel }: Props) {
  const { players } = game

  const currentPhases = Object.fromEntries(
    players.map(p => [p.id, getCurrentPhase(game, p.id)])
  )

  const [cardScores, setCardScores] = useState<Record<string, string>>(
    Object.fromEntries(players.map(p => [p.id, '']))
  )
  const [completedPhase, setCompletedPhase] = useState<Record<string, boolean>>(
    Object.fromEntries(players.map(p => [p.id, false]))
  )

  const handleSave = () => {
    const scores: RoundScore[] = players.map(p => ({
      entityId: p.id,
      score: Number(cardScores[p.id]) || 0,
      note: `phase:${currentPhases[p.id]}${completedPhase[p.id] ? ':completed' : ''}`
    }))
    onSave(scores)
  }

  return (
    <div className="round-entry">
      <h3>Round {game.rounds.length + 1}</h3>
      <div className="phase10-grid-header">
        <span>Player</span>
        <span>Phase</span>
        <span>Completed?</span>
        <span>Card Score</span>
      </div>
      {players.map(p => {
        const phase = currentPhases[p.id]
        return (
          <div key={p.id} className="phase10-row">
            <span className="player-name">{p.name}</span>
            <div className="phase-info">
              <span className="phase-badge">Phase {phase}</span>
              <span className="muted phase-desc">{PHASES[phase - 1]}</span>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={completedPhase[p.id]}
                onChange={e => setCompletedPhase(c => ({ ...c, [p.id]: e.target.checked }))}
              />
              {completedPhase[p.id] ? '✓' : '✗'}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={cardScores[p.id]}
              onChange={e => setCardScores(s => ({ ...s, [p.id]: e.target.value }))}
              placeholder="0"
            />
          </div>
        )
      })}
      <div className="round-actions">
        <button className="btn-primary" onClick={handleSave}>Save Round</button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
