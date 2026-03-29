import { useState } from 'react'
import type { Game, RoundScore } from '@/types'
import { useGame } from '@/context/GameContext'
import WizardRoundEntry from './rounds/WizardRoundEntry'
import FiveHundredRoundEntry from './rounds/FiveHundredRoundEntry'
import HandFootRoundEntry from './rounds/HandFootRoundEntry'
import FreeRoundEntry from './rounds/FreeRoundEntry'

interface Props {
  game: Game
  onSave: () => void
  onCancel: () => void
}

export default function RoundEntry({ game, onSave, onCancel }: Props) {
  const { addRound } = useGame()

  const handleSave = (scores: RoundScore[]) => {
    addRound(scores)
    onSave()
  }

  const props = { game, onSave: handleSave, onCancel }

  switch (game.config.id) {
    case 'wizard': return <WizardRoundEntry {...props} />
    case '500': return <FiveHundredRoundEntry {...props} />
    case 'hand-and-foot': return <HandFootRoundEntry {...props} />
    default: return <FreeRoundEntry {...props} />
  }
}
