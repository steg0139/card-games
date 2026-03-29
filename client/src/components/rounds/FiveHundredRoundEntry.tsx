import { useState } from 'react'
import type { Game, RoundScore } from '@/types'

interface Props {
  game: Game
  onSave: (scores: RoundScore[]) => void
  onCancel: () => void
}

const SUITS = ['spades', 'clubs', 'diamonds', 'hearts', 'notrump'] as const
type Suit = typeof SUITS[number]

const BID_TABLE: Record<string, Record<Suit, number>> = {
  '6':  { spades: 40,  clubs: 60,  diamonds: 80,  hearts: 100, notrump: 120 },
  '7':  { spades: 140, clubs: 160, diamonds: 180, hearts: 200, notrump: 220 },
  '8':  { spades: 240, clubs: 260, diamonds: 280, hearts: 300, notrump: 320 },
  '9':  { spades: 340, clubs: 360, diamonds: 380, hearts: 400, notrump: 420 },
  '10': { spades: 440, clubs: 460, diamonds: 480, hearts: 500, notrump: 520 },
}

export default function FiveHundredRoundEntry({ game, onSave, onCancel }: Props) {
  const entities = game.playerMode === 'teams' ? game.teams : game.players

  const [bidTricks, setBidTricks] = useState<Record<string, string>>(Object.fromEntries(entities.map(e => [e.id, '6'])))
  const [bidSuits, setBidSuits] = useState<Record<string, Suit>>(Object.fromEntries(entities.map(e => [e.id, 'notrump'])))
  const [isBidder, setIsBidder] = useState<Record<string, boolean>>(Object.fromEntries(entities.map(e => [e.id, false])))
  const [madeBid, setMadeBid] = useState<Record<string, boolean>>(Object.fromEntries(entities.map(e => [e.id, true])))

  const getBidValue = (id: string) => {
    const t = bidTricks[id]
    const s = bidSuits[id]
    return BID_TABLE[t]?.[s] ?? 0
  }

  const calcScore = (id: string) => {
    if (!isBidder[id]) return 10 // non-bidder gets 10 per trick (simplified)
    const val = getBidValue(id)
    return madeBid[id] ? val : -val
  }

  const handleSave = () => {
    const scores: RoundScore[] = entities.map(e => ({
      entityId: e.id,
      score: calcScore(e.id),
      bid: isBidder[e.id] ? getBidValue(e.id) : undefined
    }))
    onSave(scores)
  }

  return (
    <div className="round-entry">
      <h3>Round {game.rounds.length + 1}</h3>
      {entities.map(e => (
        <div key={e.id} className="five-hundred-row">
          <div className="row-header">
            <span className="player-name">{e.name}</span>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isBidder[e.id]}
                onChange={ev => setIsBidder(b => ({ ...b, [e.id]: ev.target.checked }))}
              />
              Bidder
            </label>
          </div>
          {isBidder[e.id] && (
            <div className="bid-row">
              <select value={bidTricks[e.id]} onChange={ev => setBidTricks(b => ({ ...b, [e.id]: ev.target.value }))}>
                {Object.keys(BID_TABLE).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={bidSuits[e.id]} onChange={ev => setBidSuits(b => ({ ...b, [e.id]: ev.target.value as Suit }))}>
                {SUITS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="bid-value">{getBidValue(e.id)} pts</span>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={madeBid[e.id]}
                  onChange={ev => setMadeBid(m => ({ ...m, [e.id]: ev.target.checked }))}
                />
                Made it
              </label>
            </div>
          )}
          <span className={`score-preview ${calcScore(e.id) < 0 ? 'negative' : ''}`}>
            {calcScore(e.id) > 0 ? '+' : ''}{calcScore(e.id)}
          </span>
        </div>
      ))}
      <div className="round-actions">
        <button className="btn-primary" onClick={handleSave}>Save Round</button>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
