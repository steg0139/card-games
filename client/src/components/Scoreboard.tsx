import type { Game } from '@/types'

interface Props {
  game: Game
  showFinal?: boolean
}

export default function Scoreboard({ game, showFinal }: Props) {
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

  const sorted = showFinal
    ? [...totals].sort((a, b) => game.config.lowestScoreWins ? a.total - b.total : b.total - a.total)
    : totals

  return (
    <div className="scoreboard">
      <div className="scoreboard-table-wrap">
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
    </div>
  )
}
