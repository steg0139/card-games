import type { GameConfig } from '@/types'

export const GAME_CONFIGS: GameConfig[] = [
  {
    id: 'rummy',
    name: 'Rummy',
    playerMode: 'individual',
    minPlayers: 2,
    maxPlayers: 6,
    hasBidding: false,
    hasRounds: true,
    lowestScoreWins: true,
    roundScoring: 'free',
    customRules: {
      description: 'Players score points for cards left in hand. Lowest score wins.',
      cardValues: { ace: 1, face: 10, number: 'face value' }
    }
  },
  {
    id: 'hand-and-foot',
    name: 'Hand & Foot',
    playerMode: 'both',
    minPlayers: 2,
    maxPlayers: 10,
    minTeams: 2,
    maxTeams: 4,
    hasBidding: false,
    hasRounds: true,
    lowestScoreWins: false,
    roundScoring: 'hand-foot',
    customRules: {
      description: 'Score melds and books. First team/player to 10,000 wins.',
      targetScore: 10000,
      cleanBook: 500,
      dirtyBook: 300,
      redThree: -500,
      blackThree: 0,
      goingOut: 100
    }
  },
  {
    id: 'wizard',
    name: 'Wizard',
    playerMode: 'individual',
    minPlayers: 3,
    maxPlayers: 6,
    hasBidding: true,
    hasRounds: true,
    lowestScoreWins: false,
    roundScoring: 'bid-tricks',
    customRules: {
      description: 'Bid the number of tricks you will take. Exact bid scores 20 + 10 per trick. Wrong bid loses 10 per trick off.',
      exactBidBonus: 20,
      perTrickScore: 10,
      perTrickPenalty: 10,
      noEvenBids: false
    }
  },
  {
    id: 'the-game',
    name: 'The Game',
    playerMode: 'individual',
    minPlayers: 2,
    maxPlayers: 4,
    hasBidding: false,
    hasRounds: false,
    lowestScoreWins: true,
    roundScoring: 'free',
    customRules: {
      description: 'Cooperative game. Score is the total number of cards left in all players\' hands at the end. Lower is better.',
      cooperative: true
    }
  },
  {
    id: '500',
    name: '500',
    playerMode: 'both',
    minPlayers: 2,
    maxPlayers: 6,
    minTeams: 2,
    maxTeams: 3,
    hasBidding: true,
    hasRounds: true,
    lowestScoreWins: false,
    roundScoring: 'bid-tricks',
    customRules: {
      description: 'Bid and win tricks. First to 500 wins, first to -500 loses.',
      targetScore: 500,
      loseScore: -500,
      bidTable: {
        '6': { spades: 40, clubs: 60, diamonds: 80, hearts: 100, notrump: 120 },
        '7': { spades: 140, clubs: 160, diamonds: 180, hearts: 200, notrump: 220 },
        '8': { spades: 240, clubs: 260, diamonds: 280, hearts: 300, notrump: 320 },
        '9': { spades: 340, clubs: 360, diamonds: 380, hearts: 400, notrump: 420 },
        '10': { spades: 440, clubs: 460, diamonds: 480, hearts: 500, notrump: 520 }
      }
    }
  }
]

export const getGameConfig = (id: string) => GAME_CONFIGS.find(g => g.id === id)
