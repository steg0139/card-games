import { useState } from 'react'
import type { Game, RoundScore } from '@/types'

interface Props {
  game: Game
  onSave: (scores: RoundScore[]) => void
  onCancel: () => void
}

const PEG_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 29]

export default function CribbageRoundEntry({ game, onSave, onCancel }: Props) {
  const { players } = game
  const [mode, setMode] = useState<'tap' | 'input'>('tap')
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(players.map(p => [p.id, 0]))
  )
  const [inputValues, setInputValues] = useState<Record<string, string>>(
    Object.fromEntries(players.map(p => [p.id, '']))
  )
  const [activePlayer, setActivePlayer] = useState<string>(players[0]?.id ?? '')

  const add = (playerId: string, val: number) => {
    setScores(s => ({ ...s, [playerId]: s[playerId] + val }))
  }

  const subtract = (playerId: string, val: number) => {
    setScores(s => ({ ...s, [playerId]: Math.max(0, s[playerId] - val) }))
  }

  const handleSave = () => {
    const roundScores: RoundScore[] = players.map(p => ({
      entityId: p.id,
      score: mode === 'input' ? (Number(inputValues[p.id]) || 0) : scores[p.id]
    }))
    onSave(roundScores)
  }

  const canSave = mode === 'input'
    ? players.every(p => inputValues[p.id] !== '')
    : true

  return (
    <div className="round-entry">
      <div className="step-header">
        <h3>Round {game.rounds.length + 1}</h3>
        <div className="toggle-group" style={{ width: 'auto' }}>
          <button className={mode === 'tap' ? 'toggle active' : 'toggle'} onClick={() => setMode('tap')}>
            🎯 Tap
          </button>
          <button className={mode === 'input' ? 'toggle active' : 'toggle'} onClick={() => setMode('input')}>
            ✏️ Type
          </button>
        </div>
      </div>

      {mode === 'tap' && (
        <>
          {/* Player selector */}
          <div className="toggle-group">
            {players.map(p => (
              <button
                key={p.id}
                className={activePlayer === p.id ? 'toggle active' : 'toggle'}
                onClick={() => setActivePlayer(p.id)}
              >
                {p.name}
                <span className="crib-score-badge">{scores[p.id]}</span>
              </button>
            ))}
          </div>

          {/* Score totals */}
          <div className="crib-totals">
            {players.map(p => (
              <div key={p.id} className={`crib-total-row ${activePlayer === p.id ? 'active' : ''}`}>
                <span>{p.name}</span>
                <strong>{scores[p.id]}</strong>
              </div>
            ))}
          </div>

          {/* Peg buttons */}
          <div className="crib-peg-grid">
            {PEG_VALUES.map(v => (
              <button
                key={v}
                className="crib-peg-btn"
                onClick={() => add(activePlayer, v)}
              >
                +{v}
              </button>
            ))}
          </div>

          {/* Subtract row */}
          <div className="crib-subtract-row">
            {[1, 2, 3, 4, 5].map(v => (
              <button
                key={v}
                className="crib-peg-btn subtract"
                onClick={() => subtract(activePlayer, v)}
              >
                -{v}
              </button>
            ))}
            <button
              className="crib-peg-btn subtract"
              onClick={() => setScores(s => ({ ...s, [activePlayer]: 0 }))}
            >
              Reset
            </button>
          </div>
        </>
      )}

      {mode === 'input' && (
        <div className="setup-section">
          {players.map(p => (
            <div key={p.id} className="score-row">
              <label>{p.name}</label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={inputValues[p.id]}
                onChange={e => setInputValues(v => ({ ...v, [p.id]: e.target.value }))}
                placeholder="0"
                style={{ width: 80 }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="round-actions">
        <button className="btn-primary" onClick={handleSave} disabled={!canSave}>Save Round</button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
