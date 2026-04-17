import { useState } from 'react'
import type { Game, RoundScore } from '@/types'

interface Props {
  game: Game
  onSave: (scores: RoundScore[]) => void
  onCancel: () => void
}

type Outcome = 'gin' | 'knock'

export default function GinRummyRoundEntry({ game, onSave, onCancel }: Props) {
  const rules = game.config.customRules as {
    ginBonus: number
    undercutBonus: number
    knockMax: number
  }

  const ginBonus = rules.ginBonus ?? 20
  const undercutBonus = rules.undercutBonus ?? 10

  const [outcome, setOutcome] = useState<Outcome | ''>('')
  const [knockerId, setKnockerId] = useState(game.players[0].id)
  const [knockerDeadwood, setKnockerDeadwood] = useState('')
  const [opponentDeadwood, setOpponentDeadwood] = useState('')

  const knocker = game.players.find(p => p.id === knockerId)!
  const opponent = game.players.find(p => p.id !== knockerId)!

  const kd = Number(knockerDeadwood) || 0
  const od = Number(opponentDeadwood) || 0

  // Auto-detect undercut: opponent deadwood ≤ knocker deadwood
  const isUndercut = outcome === 'knock' && knockerDeadwood !== '' && opponentDeadwood !== '' && od <= kd

  const calcScores = (): Record<string, number> => {
    if (!outcome) return {}
    if (outcome === 'gin') {
      return { [knocker.id]: ginBonus + od, [opponent.id]: 0 }
    }
    // Knock
    if (isUndercut) {
      // Opponent wins: undercutBonus + difference
      return { [knocker.id]: 0, [opponent.id]: undercutBonus + (kd - od) }
    }
    // Normal knock: knocker wins difference
    return { [knocker.id]: od - kd, [opponent.id]: 0 }
  }

  const scores = calcScores()

  const canSave = outcome === 'gin'
    ? opponentDeadwood !== ''
    : knockerDeadwood !== '' && opponentDeadwood !== ''

  const handleSave = () => {
    const note = outcome === 'knock' && isUndercut ? 'undercut' : outcome ?? ''
    const roundScores: RoundScore[] = game.players.map(p => ({
      entityId: p.id,
      score: scores[p.id] ?? 0,
      note: p.id === knocker.id ? note : undefined
    }))
    onSave(roundScores)
  }

  return (
    <div className="round-entry">
      <h3>Round {game.rounds.length + 1}</h3>

      <section className="setup-section">
        <h3>Outcome</h3>
        <div className="toggle-group">
          <button className={outcome === 'gin' ? 'toggle active' : 'toggle'} onClick={() => setOutcome('gin')}>
            🃏 Gin
          </button>
          <button className={outcome === 'knock' ? 'toggle active' : 'toggle'} onClick={() => setOutcome('knock')}>
            ✊ Knock
          </button>
        </div>
      </section>

      {outcome && (
        <>
          <section className="setup-section">
            <h3>{outcome === 'gin' ? 'Who went gin?' : 'Who knocked?'}</h3>
            <div className="toggle-group">
              {game.players.map(p => (
                <button key={p.id}
                  className={knockerId === p.id ? 'toggle active' : 'toggle'}
                  onClick={() => setKnockerId(p.id)}>
                  {p.name}
                </button>
              ))}
            </div>
          </section>

          <section className="setup-section">
            <h3>Deadwood Points</h3>
            {outcome === 'knock' && (
              <div className="score-row">
                <label>{knocker.name} (knocker)</label>
                <input
                  type="number" inputMode="numeric" min={0} max={rules.knockMax ?? 10}
                  value={knockerDeadwood}
                  onChange={e => setKnockerDeadwood(e.target.value)}
                  placeholder="0" style={{ width: 80 }}
                />
              </div>
            )}
            <div className="score-row">
              <label>{opponent.name} (opponent)</label>
              <input
                type="number" inputMode="numeric" min={0}
                value={opponentDeadwood}
                onChange={e => setOpponentDeadwood(e.target.value)}
                placeholder="0" style={{ width: 80 }}
              />
            </div>
          </section>

          {canSave && (
            <div className="gin-preview">
              {isUndercut && (
                <p className="muted" style={{ fontSize: '0.82rem' }}>
                  ⬇️ Undercut! {opponent.name} wins (+{undercutBonus} bonus)
                </p>
              )}
              {game.players.map(p => (
                <div key={p.id} className="score-row">
                  <span>{p.name}</span>
                  <strong className={(scores[p.id] ?? 0) > 0 ? '' : 'muted'}>
                    {(scores[p.id] ?? 0) > 0 ? `+${scores[p.id]}` : '0'}
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
