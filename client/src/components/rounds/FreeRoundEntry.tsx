import { useState } from 'react'
import type { Game, RoundScore } from '@/types'

interface Props {
  game: Game
  onSave: (scores: RoundScore[]) => void
  onCancel: () => void
}

export default function FreeRoundEntry({ game, onSave, onCancel }: Props) {
  const entities = game.playerMode === 'teams' ? game.teams : game.players
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(entities.map(e => [e.id, '']))
  )

  const setScore = (id: string, val: string) => setScores(s => ({ ...s, [id]: val }))

  const handleSave = () => {
    const roundScores: RoundScore[] = entities.map(e => ({
      entityId: e.id,
      score: Number(scores[e.id]) || 0
    }))
    onSave(roundScores)
  }

  return (
    <div className="round-entry">
      <h3>Round {game.rounds.length + 1}</h3>
      {entities.map(e => (
        <div key={e.id} className="score-row">
          <label>{e.name}</label>
          <input
            type="number"
            inputMode="numeric"
            value={scores[e.id]}
            onChange={ev => setScore(e.id, ev.target.value)}
            placeholder="0"
          />
        </div>
      ))}
      <div className="round-actions">
        <button className="btn-primary" onClick={handleSave}>Save Round</button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
