import { useState } from 'react'
import type { Game, RoundScore } from '@/types'

interface Props {
  game: Game
  onSave: (scores: RoundScore[]) => void
  onCancel: () => void
}

export default function TheGameRoundEntry({ game, onSave, onCancel }: Props) {
  const { players } = game
  const [cards, setCards] = useState<Record<string, string>>(
    Object.fromEntries(players.map(p => [p.id, '']))
  )

  const total = players.reduce((sum, p) => sum + (Number(cards[p.id]) || 0), 0)

  const handleSave = () => {
    // Each player gets their own card count as score, team total shown separately
    const scores: RoundScore[] = players.map(p => ({
      entityId: p.id,
      score: Number(cards[p.id]) || 0,
      note: `Team total: ${total}`
    }))
    onSave(scores)
  }

  return (
    <div className="round-entry">
      <h3>Cards Remaining</h3>
      <p className="muted" style={{ fontSize: '0.85rem' }}>Enter how many cards each player has left in hand.</p>
      {players.map(p => (
        <div key={p.id} className="score-row">
          <label>{p.name}</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={cards[p.id]}
            onChange={e => setCards(c => ({ ...c, [p.id]: e.target.value }))}
            placeholder="0"
          />
        </div>
      ))}
      <div className="the-game-total">
        <span>Team Total</span>
        <strong className={total === 0 ? 'perfect' : ''}>{total} {total === 0 ? '🎉 Perfect!' : 'cards'}</strong>
      </div>
      <div className="round-actions">
        <button className="btn-primary" onClick={handleSave}>Save</button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
