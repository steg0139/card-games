import { useState } from 'react'
import type { Game, RoundScore } from '@/types'

interface Props {
  game: Game
  onSave: (scores: RoundScore[]) => void
  onCancel: () => void
}

interface HandFootScores {
  cleanBooks: string
  dirtyBooks: string
  redThrees: string
  blackThrees: string
  meldPoints: string
  wentOut: boolean
}

const DEFAULT: HandFootScores = {
  cleanBooks: '0',
  dirtyBooks: '0',
  redThrees: '0',
  blackThrees: '0',
  meldPoints: '0',
  wentOut: false
}

export default function HandFootRoundEntry({ game, onSave, onCancel }: Props) {
  const entities = game.playerMode === 'teams' ? game.teams : game.players
  const rules = game.config.customRules as {
    cleanBook: number; dirtyBook: number; redThree: number; blackThree: number; goingOut: number
  }

  const [scores, setScores] = useState<Record<string, HandFootScores>>(
    Object.fromEntries(entities.map(e => [e.id, { ...DEFAULT }]))
  )

  const update = (id: string, field: keyof HandFootScores, val: string | boolean) =>
    setScores(s => ({ ...s, [id]: { ...s[id], [field]: val } }))

  const calcScore = (s: HandFootScores) =>
    Number(s.cleanBooks) * rules.cleanBook +
    Number(s.dirtyBooks) * rules.dirtyBook +
    Number(s.redThrees) * rules.redThree +
    Number(s.blackThrees) * rules.blackThree +
    Number(s.meldPoints) +
    (s.wentOut ? rules.goingOut : 0)

  const handleSave = () => {
    const roundScores: RoundScore[] = entities.map(e => ({
      entityId: e.id,
      score: calcScore(scores[e.id]),
      meldPoints: Number(scores[e.id].meldPoints)
    }))
    onSave(roundScores)
  }

  return (
    <div className="round-entry">
      <h3>Round {game.rounds.length + 1}</h3>
      {entities.map(e => {
        const s = scores[e.id]
        return (
          <div key={e.id} className="hf-entity">
            <div className="hf-header">
              <strong>{e.name}</strong>
              <span className={`score-preview ${calcScore(s) < 0 ? 'negative' : ''}`}>
                {calcScore(s) > 0 ? '+' : ''}{calcScore(s)}
              </span>
            </div>
            <div className="hf-grid">
              {([
                ['cleanBooks',  `Clean Books (×${rules.cleanBook})`],
                ['dirtyBooks',  `Dirty Books (×${rules.dirtyBook})`],
                ['redThrees',   `Red Threes (×${rules.redThree})`],
                ['blackThrees', `Black Threes (×${rules.blackThree})`],
                ['meldPoints',  'Meld Points'],
              ] as [keyof HandFootScores, string][]).map(([field, label]) => (
                <label key={field}>
                  {label}
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s[field] as string}
                    onChange={ev => update(e.id, field, ev.target.value)}
                    placeholder="0"
                  />
                </label>
              ))}
              <label className="checkbox-label full-span">
                <input
                  type="checkbox"
                  checked={s.wentOut}
                  onChange={ev => update(e.id, 'wentOut', ev.target.checked)}
                />
                Went out (+{rules.goingOut})
              </label>
            </div>
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
