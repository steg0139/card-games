import { useState } from 'react'
import type { Game, RoundScore } from '@/types'

interface Props {
  game: Game
  onSave: (scores: RoundScore[]) => void
  onCancel: () => void
}

// Card value options: 0-12 and -5 (Hole-in-One)
const CARD_OPTIONS = [-5, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const CARD_LABELS: Record<number, string> = {
  [-5]: '-5 (Hole-in-One)',
  0: '0 (Mulligan)',
  12: '12 (Out of Bounds)'
}

type Grid = [string, string, string, string, string, string, string, string] // top row 0-3, bottom row 4-7

function emptyGrid(): Grid {
  return ['', '', '', '', '', '', '', '']
}

function calcHoleScore(grid: Grid): { score: number; breakdown: string } {
  const vals = grid.map(v => v === '' ? null : Number(v))

  let totalScore = 0
  let matchedColumns = 0
  const columnScores: number[] = []

  for (let col = 0; col < 4; col++) {
    const top = vals[col]
    const bot = vals[col + 4]
    if (top !== null && bot !== null && top === bot) {
      matchedColumns++
      // Hole-in-One exception: matching -5 cards still score face value (-5 each = -10), not cancelled
      if (top === -5) {
        columnScores.push(top + bot) // -10
      } else {
        columnScores.push(0) // matched non-HiO columns cancel out
      }
    } else {
      columnScores.push((top ?? 0) + (bot ?? 0))
    }
  }

  totalScore = columnScores.reduce((s, v) => s + v, 0)

  // Matching bonus only applies to non-Hole-in-One matched columns
  const bonusEligibleMatches = Array.from({ length: 4 }, (_, col) => {
    const top = vals[col]
    const bot = vals[col + 4]
    return top !== null && bot !== null && top === bot && top !== -5
  }).filter(Boolean).length

  let bonus = 0
  if (bonusEligibleMatches === 4) bonus = -20
  else if (bonusEligibleMatches === 3) bonus = -15
  else if (bonusEligibleMatches === 2) bonus = -10

  // Four Hole-in-One bonus: 2 HiO matched columns = extra -10
  const hioMatches = Array.from({ length: 4 }, (_, col) => {
    const top = vals[col]
    const bot = vals[col + 4]
    return top !== null && bot !== null && top === bot && top === -5
  }).filter(Boolean).length
  if (hioMatches >= 2) bonus += -10

  totalScore += bonus

  const parts = []
  if (bonusEligibleMatches > 0) parts.push(`${bonusEligibleMatches * 2} matching → ${bonus < 0 ? bonus : 0} bonus`)
  if (hioMatches >= 2) parts.push(`${hioMatches * 2} Hole-in-One matches → -10 bonus`)
  const breakdown = parts.join(', ')

  return { score: totalScore, breakdown }
}

export default function PlayNineRoundEntry({ game, onSave, onCancel }: Props) {
  const holeNum = game.rounds.length + 1
  const { players } = game
  const [grids, setGrids] = useState<Record<string, Grid>>(
    Object.fromEntries(players.map(p => [p.id, emptyGrid()]))
  )

  const setCell = (playerId: string, idx: number, val: string) => {
    setGrids(g => {
      const grid = [...g[playerId]] as Grid
      grid[idx] = val
      return { ...g, [playerId]: grid }
    })
  }

  const handleSave = () => {
    const scores: RoundScore[] = players.map(p => {
      const { score } = calcHoleScore(grids[p.id])
      return { entityId: p.id, score }
    })
    onSave(scores)
  }

  const allFilled = players.every(p => grids[p.id].every(v => v !== ''))

  return (
    <div className="round-entry">
      <h3>Hole {holeNum} <span className="muted">of 9</span></h3>
      <p className="muted" style={{ fontSize: '0.82rem' }}>Enter each player's 8 cards (top row then bottom row).</p>

      {players.map(p => {
        const { score, breakdown } = calcHoleScore(grids[p.id])
        const grid = grids[p.id]
        return (
          <div key={p.id} className="play-nine-player">
            <div className="play-nine-header">
              <strong>{p.name}</strong>
              <span className={`score-preview ${score < 0 ? 'negative' : ''}`}>
                {grid.some(v => v !== '') ? score : '—'}
              </span>
            </div>
            {breakdown && <p className="muted" style={{ fontSize: '0.78rem' }}>{breakdown}</p>}
            <div className="play-nine-grid">
              {[0, 1, 2, 3].map(col => (
                <div key={col} className="play-nine-col">
                  {[col, col + 4].map(idx => {
                    const val = grid[idx]
                    const otherIdx = idx < 4 ? idx + 4 : idx - 4
                    const otherVal = grid[otherIdx]
                    const isMatch = val !== '' && otherVal !== '' && Number(val) === Number(otherVal)
                    return (
                      <select
                        key={idx}
                        value={val}
                        onChange={e => setCell(p.id, idx, e.target.value)}
                        className={isMatch ? 'card-match' : ''}
                        aria-label={`${p.name} card ${idx + 1}`}
                      >
                        <option value="">—</option>
                        {CARD_OPTIONS.map(v => (
                          <option key={v} value={String(v)}>
                            {CARD_LABELS[v] ?? String(v)}
                          </option>
                        ))}
                      </select>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="round-actions">
        <button className="btn-primary" onClick={handleSave} disabled={!allFilled}>Save Hole</button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
