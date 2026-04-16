import { useState } from 'react'
import type { Game, RoundScore } from '@/types'

interface Props {
  game: Game
  onSave: (scores: RoundScore[]) => void
  onCancel: () => void
}

export default function SkyjoRoundEntry({ game, onSave, onCancel }: Props) {
  const { players } = game
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(players.map(p => [p.id, '']))
  )
  const [roundEnderId, setRoundEnderId] = useState<string>('')

  const getRawScore = (id: string) => Number(scores[id]) || 0

  const getLowestRawScore = () => {
    const filled = players.filter(p => scores[p.id] !== '')
    if (!filled.length) return null
    return Math.min(...filled.map(p => getRawScore(p.id)))
  }

  const getFinalScore = (id: string) => {
    const raw = getRawScore(id)
    if (!roundEnderId || id !== roundEnderId) return raw
    const lowest = getLowestRawScore()
    // Double if round-ender doesn't have the lowest score
    if (lowest !== null && raw > lowest) return raw * 2
    return raw
  }

  const isDoubled = (id: string) => {
    if (!roundEnderId || id !== roundEnderId) return false
    const raw = getRawScore(id)
    const lowest = getLowestRawScore()
    return lowest !== null && raw > lowest
  }

  const handleSave = () => {
    const roundScores: RoundScore[] = players.map(p => ({
      entityId: p.id,
      score: getFinalScore(p.id),
      note: p.id === roundEnderId ? 'ended-round' : undefined
    }))
    onSave(roundScores)
  }

  const allFilled = players.every(p => scores[p.id] !== '')

  return (
    <div className="round-entry">
      <h3>Round {game.rounds.length + 1}</h3>

      <section className="setup-section">
        <h3>Who ended the round?</h3>
        <div className="skyjo-ender-row">
          {players.map(p => (
            <button
              key={p.id}
              className={roundEnderId === p.id ? 'toggle active' : 'toggle'}
              onClick={() => setRoundEnderId(p.id)}
              style={{ flex: 1 }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h3>Round Scores</h3>
        {players.map(p => {
          const doubled = isDoubled(p.id)
          const final = scores[p.id] !== '' ? getFinalScore(p.id) : null
          return (
            <div key={p.id} className="score-row">
              <label style={{ margin: 0 }}>
                {p.name}
                {doubled && <span className="doubled-badge">×2</span>}
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={scores[p.id]}
                onChange={e => setScores(s => ({ ...s, [p.id]: e.target.value }))}
                placeholder="0"
                style={{ width: 80 }}
              />
              {doubled && final !== null && (
                <span className="muted" style={{ fontSize: '0.82rem', minWidth: 40 }}>= {final}</span>
              )}
            </div>
          )
        })}
      </section>

      <div className="round-actions">
        <button className="btn-primary" onClick={handleSave} disabled={!allFilled || !roundEnderId}>
          Save Round
        </button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
