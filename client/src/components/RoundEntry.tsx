import { useState } from 'react'
import type { Game, RoundScore } from '@/types'
import { useGame } from '@/context/GameContext'
import WizardRoundEntry from './rounds/WizardRoundEntry'
import FiveHundredRoundEntry from './rounds/FiveHundredRoundEntry'
import HandFootRoundEntry from './rounds/HandFootRoundEntry'
import FreeRoundEntry from './rounds/FreeRoundEntry'
import TheGameRoundEntry from './rounds/TheGameRoundEntry'

interface Props {
  game: Game
  onSave: (updatedGame: Game) => void
  onCancel: () => void
  onComplete?: (updatedGame: Game) => void
}

export default function RoundEntry({ game, onSave, onCancel, onComplete }: Props) {
  const { addRound } = useGame()

  const handleSave = (scores: RoundScore[]) => {
    const updated = addRound(scores)
    onComplete ? onComplete(updated) : onSave(updated)
  }

  const props = { game, onSave: handleSave, onCancel }

  switch (game.config.id) {
    case 'wizard': return <WizardRoundEntry {...props} />
    case '500': return <FiveHundredRoundEntry {...props} />
    case 'hand-and-foot': return <HandFootRoundEntry {...props} />
    case 'the-game': return <TheGameRoundEntry {...props} />
    default: return <FreeRoundEntry {...props} />
  }
}
