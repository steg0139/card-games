import { useState } from 'react'
import type { Game, RoundScore } from '@/types'

interface Props {
  game: Game
  onSave: (scores: RoundScore[]) => void
  onCancel: () => void
}

export default function NertsRoundEntry({ game, onSave, onCancel }: Props) {
  const { players } = game
  const rules = game.config.customRules as { perCardPlayed: number; perCardLeft: number }

  const [cardsPlayed, setCardsPlayed] = useState<Record<string, string>>(
    Object.fromEntries(players.map(p => [p.id, '']))
  )
  const [cardsLeft, setCardsLeft] = useState<Record<string, string>>(
    Object.fromEntries(players.map(p => [p.id, '0']))
  )

  const calcScore = (id: string) =>
    (Number(cardsPlayed[id]) || 0) * rules.perCardPlayed +
    (Number(cardsLeft[id]) || 0) * rules.perCardLeft

  const allFilled = players.every(p => cardsPlayed[p.id] !== '')

  const handleSave = () => {
    const scores: RoundScore[] = players.map(p => ({
      entityId: p.id,
      score: calcScore(p.id)
    }))
    onSave(scores)
  }

  return (
    <div className="round-entry">
      <h3>Round {game.rounds.length + 1}</h3>
      <div className="nerts-grid-header">
        <span>Player</span>
        <span>Cards played</span>
        <span>Left in pile</span>
        <span>Score</span>
      </div>
      {players.map(p => {
        const score = cardsPlayed[p.id] !== '' ? calcScore(p.id) : '—'
        return (
          <div key={p.id} className="nerts-row">
            <span className="player-name">{p.name}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={cardsPlayed[p.id]}
              onChange={e => setCardsPlayed(s => ({ ...s, [p.id]: e.target.value }))}
              placeholder="0"
            />
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={13}
              value={cardsLeft[p.id]}
              onChange={e => setCardsLeft(s => ({ ...s, [p.id]: e.target.value }))}
              placeholder="0"
            />
            <span className={typeof score === 'number' && score < 0 ? 'negative' : ''}>
              {typeof score === 'number' ? (score > 0 ? `+${score}` : score) : score}
            </span>
          </div>
        )
      })}
      <p className="muted" style={{ fontSize: '0.78rem' }}>
        +{rules.perCardPlayed} per card played · {rules.perCardLeft} per card left in Nerts pile
      </p>
      <div className="round-actions">
        <button className="btn-primary" onClick={handleSave} disabled={!allFilled}>Save Round</button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
