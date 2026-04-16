import { useEffect, useRef } from 'react'
import type { Game } from '@/types'

interface Props {
  game: Game
  showFinal?: boolean
  pendingBids?: Record<string, number | string> | null
}

export default function Scoreboard({ game, showFinal, pendingBids }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

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

  const sorted = [...totals].sort((a, b) =>
    game.config.lowestScoreWins ? a.total - b.total : b.total - a.total
  )

  // Show bids from the last round if the game uses bidding
  const lastRound = game.rounds[game.rounds.length - 1]
  const hasBids = game.config.hasBidding && lastRound?.scores.some(s => s.bid !== undefined)

  return (
    <div className="scoreboard">
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
                <td className="name-col">{e.name}</td>
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
