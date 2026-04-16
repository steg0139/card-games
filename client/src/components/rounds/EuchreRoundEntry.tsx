import { useState } from 'react'
import type { Game, RoundScore } from '@/types'

interface Props {
  game: Game
  onSave: (scores: RoundScore[]) => void
  onCancel: () => void
}

type Outcome = 'makers-1' | 'makers-march' | 'loner-1' | 'loner-march' | 'euchred'

const OUTCOMES: { value: Outcome; label: string; desc: string }[] = [
  { value: 'makers-1',     label: 'Makers win 3–4 tricks',    desc: '+1 for makers' },
  { value: 'makers-march', label: 'Makers win all 5 (march)', desc: '+2 for makers' },
  { value: 'loner-1',      label: 'Loner wins 3–4 tricks',    desc: '+1 for makers' },
  { value: 'loner-march',  label: 'Loner wins all 5',         desc: '+4 for makers' },
  { value: 'euchred',      label: 'Euchred',                  desc: '+2 for defenders' },
]

export default function EuchreRoundEntry({ game, onSave, onCancel }: Props) {
  const teams = game.teams
  const [makersTeamId, setMakersTeamId] = useState(teams[0]?.id ?? '')
  const [outcome, setOutcome] = useState<Outcome | ''>('')

  const getPoints = (): Record<string, number> => {
    if (!outcome || !makersTeamId) return {}
    const defendersId = teams.find(t => t.id !== makersTeamId)?.id ?? ''
    switch (outcome) {
      case 'makers-1':     return { [makersTeamId]: 1, [defendersId]: 0 }
      case 'makers-march': return { [makersTeamId]: 2, [defendersId]: 0 }
      case 'loner-1':      return { [makersTeamId]: 1, [defendersId]: 0 }
      case 'loner-march':  return { [makersTeamId]: 4, [defendersId]: 0 }
      case 'euchred':      return { [makersTeamId]: 0, [defendersId]: 2 }
      default:             return {}
    }
  }

  const points = getPoints()

  const handleSave = () => {
    if (!outcome) return
    const scores: RoundScore[] = teams.map(t => ({
      entityId: t.id,
      score: points[t.id] ?? 0
    }))
    onSave(scores)
  }

  return (
    <div className="round-entry">
      <h3>Round {game.rounds.length + 1}</h3>

      <section className="setup-section">
        <h3>Who are the Makers?</h3>
        <div className="toggle-group">
          {teams.map(t => (
            <button
              key={t.id}
              className={makersTeamId === t.id ? 'toggle active' : 'toggle'}
              onClick={() => setMakersTeamId(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h3>Outcome</h3>
        {OUTCOMES.map(o => (
          <label key={o.value} className="checkbox-label" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <input
              type="radio"
              name="outcome"
              value={o.value}
              checked={outcome === o.value}
              onChange={() => setOutcome(o.value)}
            />
            <span>
              <span style={{ fontWeight: 500 }}>{o.label}</span>
              <span className="muted" style={{ marginLeft: 8, fontSize: '0.85rem' }}>{o.desc}</span>
            </span>
          </label>
        ))}
      </section>

      {outcome && (
        <div className="euchre-preview">
          {teams.map(t => (
            <div key={t.id} className="score-row">
              <span>{t.name}</span>
              <strong className={points[t.id] > 0 ? '' : 'muted'}>
                {points[t.id] > 0 ? `+${points[t.id]}` : '0'}
              </strong>
            </div>
          ))}
        </div>
      )}

      <div className="round-actions">
        <button className="btn-primary" onClick={handleSave} disabled={!outcome}>Save Round</button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
