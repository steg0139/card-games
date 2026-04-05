import { useState } from 'react'
import type { Game, RoundScore } from '@/types'

interface Props {
  game: Game
  onSave: (scores: RoundScore[]) => void
  onCancel: () => void
  onBidsChange?: (bids: Record<string, number | string>) => void
}

export default function WizardRoundEntry({ game, onSave, onCancel, onBidsChange }: Props) {
  const roundNum = game.rounds.length + 1
  const entities = game.players
  const playerCount = entities.length
  const rules = game.config.customRules as {
    exactBidBonus: number
    perTrickScore: number
    perTrickPenalty: number
    noEvenBids?: boolean
    deckThresholds?: { minPlayers: number; maxPlayers: number; decks: number }[]
  }

  // Determine deck count based on player count
  const decks = rules.deckThresholds?.find(
    t => playerCount >= t.minPlayers && playerCount <= t.maxPlayers
  )?.decks ?? 1

  // Total cards per deck is 60 (52 + 4 wizards + 4 jesters)
  const cardsPerDeck = 60
  const maxRounds = Math.floor((cardsPerDeck * decks) / playerCount)

  const [step, setStep] = useState<'bids' | 'tricks'>('bids')
  const [bids, setBids] = useState<Record<string, string>>(Object.fromEntries(entities.map(e => [e.id, ''])))
  const [tricks, setTricks] = useState<Record<string, string>>(Object.fromEntries(entities.map(e => [e.id, ''])))

  const rotated = [
    ...entities.slice((roundNum - 1) % entities.length),
    ...entities.slice(0, (roundNum - 1) % entities.length)
  ]

  const lastBidderId = rotated[rotated.length - 1].id

  const forbiddenBid = (id: string): number | null => {
    if (!rules.noEvenBids || id !== lastBidderId) return null
    const otherTotal = rotated
      .filter(e => e.id !== id)
      .reduce((sum, e) => sum + (Number(bids[e.id]) || 0), 0)
    return roundNum - otherTotal
  }

  const calcScore = (bid: number, taken: number) => {
    if (bid === taken) return rules.exactBidBonus + taken * rules.perTrickScore
    return Math.abs(bid - taken) * -rules.perTrickPenalty
  }

  const totalTricks = entities.reduce((sum, e) => sum + (Number(tricks[e.id]) || 0), 0)
  const tricksValid = totalTricks === roundNum
  const lastBidInvalid = rules.noEvenBids && Number(bids[lastBidderId]) === forbiddenBid(lastBidderId)
  const allBidsFilled = true // empty bids are valid (treated as 0)
  const canSave = tricksValid && !lastBidInvalid

  const handleSave = () => {
    const scores: RoundScore[] = entities.map(e => {
      const bid = Number(bids[e.id]) || 0
      const taken = Number(tricks[e.id]) || 0
      return { entityId: e.id, score: calcScore(bid, taken), bid, tricksTaken: taken }
    })
    onSave(scores)
  }

  return (
    <div className="round-entry">
      <div className="step-header">
        <h3>Round {roundNum} <span className="muted">of {maxRounds}</span></h3>
        <div className="step-indicator">
          <span className={step === 'bids' ? 'step active' : 'step done'}>1. Bids</span>
          <span className={step === 'tricks' ? 'step active' : 'step'}>2. Results</span>
        </div>
      </div>

      {step === 'bids' && (
        <>
          <div className="wizard-grid">
            <span className="col-header">Player</span>
            <span className="col-header">Bid</span>
            <span className="col-header"></span>
            <span className="col-header"></span>
            {rotated.map(e => {
              const forbidden = forbiddenBid(e.id)
              return (
                <>
                  <span key={`name-${e.id}`} className="player-name">{e.name}</span>
                  <input
                    key={`bid-${e.id}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={roundNum}
                    value={bids[e.id]}
                    onChange={ev => {
                      const updated = { ...bids, [e.id]: ev.target.value }
                      setBids(updated)
                      onBidsChange?.(Object.fromEntries(entities.map(e => [e.id, Number(updated[e.id]) || 0])))
                    }}
                    placeholder="0"
                    title={forbidden !== null ? `${forbidden} is not allowed` : undefined}
                  />
                  <span key={`empty1-${e.id}`} />
                  <span key={`empty2-${e.id}`} />
                </>
              )
            })}
          </div>
          {rules.noEvenBids && bids[lastBidderId] !== '' && lastBidInvalid && (
            <p className="error" style={{ fontSize: '0.85rem' }}>
              {rotated[rotated.length - 1].name} cannot bid {forbiddenBid(lastBidderId)} — total bids would equal cards in hand.
            </p>
          )}
          <div className="round-actions">
            <button className="btn-primary" onClick={() => setStep('tricks')} disabled={!allBidsFilled || lastBidInvalid}>
              Next: Enter Results
            </button>
            <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          </div>
        </>
      )}

      {step === 'tricks' && (
        <>
          <div className="wizard-grid">
            <span className="col-header">Player</span>
            <span className="col-header">Bid</span>
            <span className="col-header">Taken</span>
            <span className="col-header">Score</span>
            {rotated.map(e => {
              const bid = Number(bids[e.id])
              const taken = Number(tricks[e.id])
              const preview = tricks[e.id] !== '' ? calcScore(bid, taken) : '—'
              return (
                <>
                  <span key={`name-${e.id}`} className="player-name">{e.name}</span>
                  <span key={`bid-${e.id}`} className="bid-display">{bids[e.id]}</span>
                  <input
                    key={`tricks-${e.id}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={roundNum}
                    value={tricks[e.id]}
                    onChange={ev => setTricks(t => ({ ...t, [e.id]: ev.target.value }))}
                    placeholder="0"
                  />
                  <span key={`score-${e.id}`} className={typeof preview === 'number' && preview < 0 ? 'negative' : ''}>
                    {preview}
                  </span>
                </>
              )
            })}
          </div>
          {!tricksValid && totalTricks > 0 && (
            <p className="error" style={{ fontSize: '0.85rem' }}>
              Tricks taken must total {roundNum} (currently {totalTricks}).
            </p>
          )}
          <div className="round-actions">
            <button className="btn-primary" onClick={handleSave} disabled={!canSave}>Save Round</button>
            <button className="btn-ghost" onClick={() => setStep('bids')}>← Back to Bids</button>
          </div>
        </>
      )}
    </div>
  )
}
