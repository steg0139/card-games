import { useState } from 'react'
import type { Game, RoundScore } from '@/types'

interface Props {
  game: Game
  onSave: (scores: RoundScore[]) => void
  onCancel: () => void
}

export default function MexicanTrainRoundEntry({ game, onSave, onCancel }: Props) {
  const { players } = game
  const rules = game.config.customRules as { doubleSet: number; doubleBlankValue: number }
  const doubleSet = rules.doubleSet ?? 9
  const totalRounds = doubleSet + 1
  const roundNum = game.rounds.length + 1
  // Which double starts this round (double-9 in round 1, double-8 in round 2, etc.)
  const startingDouble = doubleSet - (roundNum - 1)

  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(players.map(p => [p.id, '0']))
  )

  const allFilled = true // default is 0, always valid

  const handleSave = () => {
    const roundScores: RoundScore[] = players.map(p => ({
      entityId: p.id,
      score: Number(scores[p.id]) || 0
    }))
    onSave(roundScores)
  }

  return (
    <div className="round-entry">
      <div className="step-header">
        <h3>Round {roundNum} <span className="muted">of {totalRounds}</span></h3>
        <span className="phase-badge">Starting double: {startingDouble}</span>
      </div>
      <p className="muted" style={{ fontSize: '0.82rem' }}>Enter pips remaining in each player's hand.</p>
      {players.map(p => (
        <div key={p.id} className="score-row">
          <label>{p.name}</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={scores[p.id]}
            onChange={e => setScores(s => ({ ...s, [p.id]: e.target.value }))}
            placeholder="0"
            style={{ width: 80 }}
          />
        </div>
      ))}
      <div className="round-actions">
        <button className="btn-primary" onClick={handleSave} disabled={!allFilled}>
          {roundNum === totalRounds ? 'Save Final Round' : 'Save Round'}
        </button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
