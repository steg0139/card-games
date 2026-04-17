import { useState } from 'react'
import type { Game, RoundScore } from '@/types'

interface Props {
  game: Game
  onSave: (scores: RoundScore[]) => void
  onCancel: () => void
}

type Outcome = 'gin' | 'knock' | 'undercut'

export default function GinRummyRoundEntry({ game, onSave, onCancel }: Props) {
  const [p1, p2] = game.players
  const rules = game.config.customRules as {
    ginBonus: number; undercutBonus: number; knockMax: number
  }

  const [outcome, setOutcome] = useState<Outcome | ''>('')
  const [knockerId, setKnockerId] = useState(p1.id)
  const [knockerDeadwood, setKnockerDeadwood] = useState('')
  const [opponentDeadwood, setOpponentDeadwood] = useState('')

  const knocker = game.players.find(p => p.id === knockerId)!
  const opponent = game.players.find(p => p.id !== knockerId)!

  const kd = Number(knockerDeadwood) || 0
  const od = Number(opponentDeadwood) || 0

  const calcScores = (): Record<string, number> => {
    if (!outcome) return {}
    switch (outcome) {
      case 'gin':
        return { [knocker.id]: rules.ginBonus + od, [opponent.id]: 0 }
      case 'knock':
        return { [knocker.id]: kd < od ? od - kd : 0, [opponent.id]: kd < od ? 0 : 0 }
      case 'undercut':
        return { [knocker.id]: 0, [opponent.id]: rules.undercutBonus + (kd - od) }
    }
  }

  const scores = calcScores()

  const canSave = outcome === 'gin'
    ? opponentDeadwood !== ''
    : outcome === 'knock' || outcome === 'undercut'
      ? knockerDeadwood !== '' && opponentDeadwood !== ''
      : false

  const handleSave = () => {
    const roundScores: RoundScore[] = game.players.map(p => ({
      entityId: p.id,
      score: scores[p.id] ?? 0,
      note: p.id === knocker.id ? outcome : undefined
    }))
    onSave(roundScores)
  }

  return (
    <div className="round-entry">
      <h3>Round {game.rounds.length + 1}</h3>

      <section className="setup-section">
        <h3>Outcome</h3>
        <div className="toggle-group">
          {(['gin', 'knock', 'undercut'] as Outcome[]).map(o => (
            <button key={o} className={outcome === o ? 'toggle active' : 'toggle'} onClick={() => setOutcome(o)}>
              {o === 'gin' ? '🃏 Gin' : o === 'knock' ? '✊ Knock' : '⬇️ Undercut'}
            </button>
          ))}
        </div>
      </section>

      {outcome && (
        <>
          {outcome !== 'gin' && (
            <section className="setup-section">
              <h3>Who knocked?</h3>
              <div className="toggle-group">
                {game.players.map(p => (
                  <button key={p.id} className={knockerId === p.id ? 'toggle active' : 'toggle'} onClick={() => setKnockerId(p.id)}>
                    {p.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="setup-section">
            <h3>Deadwood Points</h3>
            {outcome !== 'gin' && (
              <div className="score-row">
                <label>{knocker.name} (knocker)</label>
                <input type="number" inputMode="numeric" min={0} max={rules.knockMax}
                  value={knockerDeadwood} onChange={e => setKnockerDeadwood(e.target.value)} placeholder="0" style={{ width: 80 }} />
              </div>
            )}
            <div className="score-row">
              <label>{outcome === 'gin' ? `${opponent.name}` : `${opponent.name} (opponent)`}</label>
              <input type="number" inputMode="numeric" min={0}
                value={opponentDeadwood} onChange={e => setOpponentDeadwood(e.target.value)} placeholder="0" style={{ width: 80 }} />
            </div>
          </section>

          {canSave && (
            <div className="gin-preview">
              {game.players.map(p => (
                <div key={p.id} className="score-row">
                  <span>{p.name}</span>
                  <strong className={scores[p.id] > 0 ? '' : 'muted'}>
                    {scores[p.id] > 0 ? `+${scores[p.id]}` : '0'}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="round-actions">
        <button className="btn-primary" onClick={handleSave} disabled={!canSave}>Save Round</button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
