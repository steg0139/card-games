import { useState } from 'react'
import type { Game, RoundScore } from '@/types'
import { useGame } from '@/context/GameContext'
import WizardRoundEntry from './rounds/WizardRoundEntry'
import FiveHundredRoundEntry from './rounds/FiveHundredRoundEntry'
import HandFootRoundEntry from './rounds/HandFootRoundEntry'
import FreeRoundEntry from './rounds/FreeRoundEntry'
import TheGameRoundEntry from './rounds/TheGameRoundEntry'
import PlayNineRoundEntry from './rounds/PlayNineRoundEntry'
import Phase10RoundEntry from './rounds/Phase10RoundEntry'

interface Props {
  game: Game
  onSave: (updatedGame: Game) => void
  onCancel: () => void
  onComplete?: (updatedGame: Game) => void
  onBidsChange?: (bids: Record<string, number | string>) => void
}

export default function RoundEntry({ game, onSave, onCancel, onComplete, onBidsChange }: Props) {
  const { addRound } = useGame()

  const handleSave = (scores: RoundScore[]) => {
    const updated = addRound(scores)
    onComplete ? onComplete(updated) : onSave(updated)
  }

  const props = { game, onSave: handleSave, onCancel }

  switch (game.config.id) {
    case 'wizard': return <WizardRoundEntry {...props} onBidsChange={onBidsChange} />
    case '500': return <FiveHundredRoundEntry {...props} onBidsChange={onBidsChange} />
    case 'hand-and-foot': return <HandFootRoundEntry {...props} />
    case 'the-game': return <TheGameRoundEntry {...props} />
    case 'play-nine': return <PlayNineRoundEntry {...props} />
    case 'phase-10': return <Phase10RoundEntry {...props} />
    default: return <FreeRoundEntry {...props} />
  }
}
