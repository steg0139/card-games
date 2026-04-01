import type { GameConfig } from '@/types'

interface Props {
  config: GameConfig
}

interface RuleRow {
  label: string
  value: string | number
}

function getRules(config: GameConfig): RuleRow[] | null {
  const r = config.customRules as Record<string, unknown> | undefined
  if (!r) return null

  switch (config.id) {
    case 'hand-and-foot': {
      const laydown = r.laydownRequirements as { minScore: number; maxScore: number; required: number }[] | undefined
      return [
        { label: 'Clean Book',        value: r.cleanBook as number },
        { label: 'Dirty Book',        value: r.dirtyBook as number },
        { label: 'Red Three',         value: r.redThree as number },
        { label: 'Black Three',       value: r.blackThree as number },
        { label: 'Going Out Bonus',   value: r.goingOut as number },
        { label: 'Target Score',      value: r.targetScore as number },
        { label: '─── Initial Laydown ───', value: '' },
        ...(laydown ?? []).map(l => ({
          label: `${l.minScore.toLocaleString()} – ${l.maxScore.toLocaleString()} pts`,
          value: l.required
        })),
        { label: '─── Card Values ───', value: '' },
        { label: 'Joker',             value: 50 },
        { label: 'Ace, 2',            value: 20 },
        { label: '9 – King',          value: 10 },
        { label: '4 – 8, Black 3',    value: 5 },
      ]
    }

    case 'wizard': {
      const rows: RuleRow[] = [
        { label: 'Exact bid bonus',   value: `+${r.exactBidBonus}` },
        { label: 'Per trick (made)',  value: `+${r.perTrickScore}` },
        { label: 'Per trick (miss)',  value: `-${r.perTrickPenalty}` },
      ]
      if (r.noEvenBids) rows.push({ label: 'Last bidder rule', value: 'Bids cannot equal cards in hand' })
      return rows
    }

    case '500':
      return [
        { label: 'Target score', value: r.targetScore as number },
        { label: 'Lose at',      value: r.loseScore as number },
        { label: '6 Spades',     value: 40 },
        { label: '6 Clubs',      value: 60 },
        { label: '6 Diamonds',   value: 80 },
        { label: '6 Hearts',     value: 100 },
        { label: '6 No Trump',   value: 120 },
        { label: '7 Spades',     value: 140 },
        { label: '7 No Trump',   value: 220 },
        { label: '8 No Trump',   value: 320 },
        { label: '9 No Trump',   value: 420 },
        { label: '10 No Trump',  value: 520 },
      ]

    case 'rummy':
      return [
        { label: 'Ace',         value: 1 },
        { label: 'Face cards',  value: 10 },
        { label: 'Number cards', value: 'Face value' },
        { label: 'Lowest score wins', value: '✓' },
      ]

    default:
      return null
  }
}

export default function ScoringRules({ config }: Props) {
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
