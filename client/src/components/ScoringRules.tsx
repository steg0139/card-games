import type { GameConfig } from '@/types'

interface Props {
  config: GameConfig
}

interface RuleRow {
  label: string
  value: string | number
}

const SUITS = ['Spades', 'Clubs', 'Diamonds', 'Hearts', 'No Trump'] as const
const BID_TABLE: Record<string, number[]> = {
  '6':  [40,  60,  80,  100, 120],
  '7':  [140, 160, 180, 200, 220],
  '8':  [240, 260, 280, 300, 320],
  '9':  [340, 360, 380, 400, 420],
  '10': [440, 460, 480, 500, 520],
}

function getRules(config: GameConfig): RuleRow[] | null {
  const r = config.customRules as Record<string, unknown> | undefined
  if (!r) return null

  switch (config.id) {
    case 'hand-and-foot': {
      const laydown = r.laydownRequirements as { minScore: number; maxScore: number; required: number }[] | undefined
      return [
        { label: 'Clean Book',              value: r.cleanBook as number },
        { label: 'Dirty Book',              value: r.dirtyBook as number },
        { label: 'Red Three',               value: r.redThree as number },
        { label: 'Black Three',             value: r.blackThree as number },
        { label: 'Going Out Bonus',         value: r.goingOut as number },
        { label: 'Target Score',            value: r.targetScore as number },
        { label: '─── Initial Laydown ───', value: '' },
        ...(laydown ?? []).map(l => ({
          label: `${l.minScore.toLocaleString()} – ${l.maxScore.toLocaleString()} pts`,
          value: l.required
        })),
        { label: '─── Card Values ───',     value: '' },
        { label: 'Joker',                   value: 50 },
        { label: 'Ace, 2',                  value: 20 },
        { label: '9 – King',                value: 10 },
        { label: '4 – 8, Black 3',          value: 5 },
      ]
    }

    case 'wizard': {
      const rows: RuleRow[] = [
        { label: 'Exact bid bonus',  value: `+${r.exactBidBonus}` },
        { label: 'Per trick (made)', value: `+${r.perTrickScore}` },
        { label: 'Per trick (miss)', value: `-${r.perTrickPenalty}` },
        { label: '3–6 players',      value: '1 deck' },
        { label: '7–12 players',     value: '2 decks' },
        { label: '13–18 players',    value: '3 decks' },
      ]
      if (r.noEvenBids) rows.push({ label: 'Screw the dealer', value: 'Bids cannot equal cards in hand' })
      return rows
    }

    case 'rummy':
      return [
        { label: 'Ace',               value: 1 },
        { label: 'Face cards',        value: 10 },
        { label: 'Number cards',      value: 'Face value' },
        { label: 'Lowest score wins', value: '✓' },
      ]

    case 'play-nine':
      return [
        { label: 'Hole-in-One',         value: -5 },
        { label: 'Mulligan',            value: 0 },
        { label: 'Cards 1–11',          value: 'Face value' },
        { label: 'Out of Bounds',       value: 12 },
        { label: '─── Matching Bonuses ───', value: '' },
        { label: 'Matching 2 (1 col)',  value: 0 },
        { label: 'Matching 4 (2 cols)', value: -10 },
        { label: 'Matching 6 (3 cols)', value: -15 },
        { label: 'Matching 8 (4 cols)', value: -20 },
        { label: 'Total holes',         value: 9 },
      ]

    case 'phase-10':
      return [
        { label: 'Cards 1–9',    value: '5 pts' },
        { label: 'Cards 10–12',  value: '10 pts' },
        { label: 'Wild card',    value: '25 pts' },
        { label: '─── Phases ───', value: '' },
        { label: 'Phase 1',  value: '2 sets of 3' },
        { label: 'Phase 2',  value: '1 set of 3 + 1 run of 4' },
        { label: 'Phase 3',  value: '1 set of 4 + 1 run of 4' },
        { label: 'Phase 4',  value: '1 run of 7' },
        { label: 'Phase 5',  value: '1 run of 8' },
        { label: 'Phase 6',  value: '1 run of 9' },
        { label: 'Phase 7',  value: '2 sets of 4' },
        { label: 'Phase 8',  value: '7 cards of one color' },
        { label: 'Phase 9',  value: '1 set of 5 + 1 set of 2' },
        { label: 'Phase 10', value: '1 set of 5 + 1 set of 3' },
      ]

    default:
      return null
  }
}

function FiveHundredBidTable({ config }: { config: GameConfig }) {
  const r = config.customRules as Record<string, unknown> | undefined
  return (
    <section className="detail-section">
      <h3>Scoring Rules</h3>
      <div className="rules-table-wrap">
        <table className="bid-table">
          <thead>
            <tr>
              <th>Bid</th>
              {SUITS.map(s => <th key={s}>{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {Object.entries(BID_TABLE).map(([tricks, values]) => (
              <tr key={tricks}>
                <td><strong>{tricks}</strong></td>
                {values.map((v, i) => <td key={i}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rules-table-wrap" style={{ marginTop: 8 }}>
        <table className="rules-table">
          <tbody>
            <tr><td>Target score</td><td>{String(r?.targetScore ?? 500)}</td></tr>
            <tr><td>Lose at</td><td className="negative">{String(r?.loseScore ?? -500)}</td></tr>
            <tr><td>Non-bidder per trick</td><td>10</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function ScoringRules({ config }: Props) {
  if (config.id === '500') return <FiveHundredBidTable config={config} />

  const rules = getRules(config)
  if (!rules) return null

  return (
    <section className="detail-section">
      <h3>Scoring Rules</h3>
      <div className="rules-table-wrap">
        <table className="rules-table">
          <tbody>
            {rules.map((row, i) => (
              <tr key={i} className={row.value === '' ? 'divider-row' : ''}>
                <td>{row.label}</td>
                {row.value !== '' && <td className={typeof row.value === 'number' && row.value < 0 ? 'negative' : ''}>{row.value}</td>}
                {row.value === '' && <td />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
