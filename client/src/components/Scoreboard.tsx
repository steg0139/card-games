import { useEffect, useRef, useState } from 'react'
import type { Game } from '@/types'
import { getNameEmoji, LONG_GAME_ROUNDS } from '@/hooks/useEasterEggs'

interface Props {
  game: Game
  showFinal?: boolean
  pendingBids?: Record<string, number | string> | null
}

const SCORE_MILESTONES = [100, 250, 500, 1000]

export default function Scoreboard({ game, showFinal, pendingBids }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [milestone, setMilestone] = useState<string | null>(null)
  const prevTotals = useRef<Record<string, number>>({})

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [game.rounds.length])

  const entities = game.playerMode === 'teams' ? game.teams : game.players

  const totals = entities.map(e => ({
    id: e.id,
    name: e.name,
    roundScores: game.rounds.map(r => r.scores.find(s => s.entityId === e.id)?.score ?? 0),
    total: game.rounds.reduce((sum, r) => {
      const s = r.scores.find(s => s.entityId === e.id)
      return sum + (s?.score ?? 0)
    }, 0)
  }))

  // Score milestone detection
  useEffect(() => {
    if (game.config.lowestScoreWins) return
    for (const e of totals) {
      const prev = prevTotals.current[e.id] ?? 0
      for (const m of SCORE_MILESTONES) {
        if (prev < m && e.total >= m) {
          setMilestone(`🎉 ${e.name} hit ${m} points!`)
          setTimeout(() => setMilestone(null), 2500)
        }
      }
      prevTotals.current[e.id] = e.total
    }
  }, [game.rounds.length])

  const sorted = [...totals].sort((a, b) =>
    game.config.lowestScoreWins ? a.total - b.total : b.total - a.total
  )

  // Losing streak — last place 3+ rounds
  const getLosingStreak = (entityId: string) => {
    if (game.rounds.length < 3) return false
    const last3 = game.rounds.slice(-3)
    return last3.every(r => {
      const scores = r.scores.map(s => s.score)
      const mine = r.scores.find(s => s.entityId === entityId)?.score ?? 0
      return game.config.lowestScoreWins
        ? mine === Math.max(...scores)
        : mine === Math.min(...scores)
    })
  }

  // Wizard bid streak — exact bid 3 rounds in a row
  const getWizardStreak = (entityId: string) => {
    if (game.config.id !== 'wizard' || game.rounds.length < 3) return false
    const last3 = game.rounds.slice(-3)
    return last3.every(r => {
      const s = r.scores.find(s => s.entityId === entityId)
      return s?.bid !== undefined && s?.tricksTaken !== undefined && s.bid === s.tricksTaken
    })
  }

  const lastRound = game.rounds[game.rounds.length - 1]
  const hasBids = game.config.hasBidding && lastRound?.scores.some(s => s.bid !== undefined)
  const isPhase10 = game.config.id === 'phase-10'
  const isLongGame = game.rounds.length >= LONG_GAME_ROUNDS

  const getPlayerPhase = (playerId: string) => {
    let phase = 1
    for (const round of game.rounds) {
      const score = round.scores.find(s => s.entityId === playerId)
      if (score?.note?.startsWith('phase:')) {
        const completed = score.note.includes(':completed')
        const phaseNum = parseInt(score.note.split(':')[1])
        if (completed && phaseNum === phase) phase = Math.min(phase + 1, 10)
      }
    }
    return phase
  }

  return (
    <div className="scoreboard">
      {milestone && <div className="score-milestone">{milestone}</div>}
      {isLongGame && !showFinal && (
        <div className="long-game-warning">Still going? You people are dedicated 🏆</div>
      )}
      <div className="scoreboard-table-wrap" ref={scrollRef}>
        <table className="scoreboard-table">
          <thead>
            <tr>
              <th className="name-col">Player</th>
              {game.rounds.map((_, i) => <th key={i}>R{i + 1}</th>)}
              <th className="total-col">Total</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(e => (
              <tr key={e.id}>
                <td className="name-col">
                  {getNameEmoji(e.name) && <span style={{ marginRight: 4 }}>{getNameEmoji(e.name)}</span>}
                  {e.name}
                  {isPhase10 && (
                    <span className="phase-badge" style={{ marginLeft: 4 }}>P{getPlayerPhase(e.id)}</span>
                  )}
                  {getLosingStreak(e.id) && <span title="On a losing streak" style={{ marginLeft: 4 }}>😬</span>}
                  {getWizardStreak(e.id) && <span title="3 exact bids in a row!" style={{ marginLeft: 4 }}>🎯</span>}
                </td>
                {e.roundScores.map((s, i) => <td key={i}>{s}</td>)}
                <td className="total-col"><strong>{e.total}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {game.config.targetScore && (
        <p className="target-note">Target: {game.config.targetScore}</p>
      )}
      {pendingBids && (
        <div className="bids-section">
          <p className="bids-title">Round {game.rounds.length + 1} Bids (in progress)</p>
          <div className="bids-list">
            {entities.map(e => pendingBids[e.id] !== undefined ? (
              <span key={e.id} className="bid-chip">
                {e.name}: <strong>{pendingBids[e.id]}</strong>
              </span>
            ) : null)}
          </div>
        </div>
      )}
      {!pendingBids && hasBids && (
        <div className="bids-section">
          <p className="bids-title">Round {lastRound.roundNumber} Bids</p>
          <div className="bids-list">
            {entities.map(e => {
              const score = lastRound.scores.find(s => s.entityId === e.id)
              if (score?.bid === undefined) return null
              return (
                <span key={e.id} className="bid-chip">
                  {e.name}: <strong>{score.bid}</strong>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
