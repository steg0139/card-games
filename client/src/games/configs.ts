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
      goingOut: 100,
      laydownRequirements: [
        { minScore: 0,    maxScore: 2000,  required: 50  },
        { minScore: 2001, maxScore: 4000,  required: 90  },
        { minScore: 4001, maxScore: 6000,  required: 120 },
        { minScore: 6001, maxScore: 8000,  required: 150 },
        { minScore: 8001, maxScore: 10000, required: 180 }
      ],
      cardValues: {
        joker: 50,
        ace: 20,
        two: 20,
        king: 10,
        queen: 10,
        jack: 10,
        ten: 10,
        nine: 10,
        eight: 5,
        seven: 5,
        six: 5,
        five: 5,
        four: 5,
        blackThree: 5
      }
    }
  },
  {
    id: 'wizard',
    name: 'Wizard',
    playerMode: 'individual',
    minPlayers: 3,
    maxPlayers: 18,
    hasBidding: true,
    hasRounds: true,
    lowestScoreWins: false,
    roundScoring: 'bid-tricks',
    customRules: {
      description: 'Bid the number of tricks you will take. Exact bid scores 20 + 10 per trick. Wrong bid loses 10 per trick off.',
      exactBidBonus: 20,
      perTrickScore: 10,
      perTrickPenalty: 10,
      noEvenBids: false,
      deckThresholds: [
        { minPlayers: 3,  maxPlayers: 6,  decks: 1 },
        { minPlayers: 7,  maxPlayers: 12, decks: 2 },
        { minPlayers: 13, maxPlayers: 18, decks: 3 },
      ]
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
    id: 'phase-10',
    name: 'Phase 10',
    playerMode: 'individual',
    minPlayers: 2,
    maxPlayers: 6,
    hasBidding: false,
    hasRounds: true,
    lowestScoreWins: true,
    roundScoring: 'free',
    customRules: {
      description: 'Complete all 10 phases. Score points for cards left in hand. Lowest score wins when someone completes Phase 10.',
      phases: [
        '2 sets of 3',
        '1 set of 3 + 1 run of 4',
        '1 set of 4 + 1 run of 4',
        '1 run of 7',
        '1 run of 8',
        '1 run of 9',
        '2 sets of 4',
        '7 cards of one color',
        '1 set of 5 + 1 set of 2',
        '1 set of 5 + 1 set of 3',
      ],
      cardValues: {
        numbered: '5 pts (1–9)',
        skipAndColored: '10 pts (10–12)',
        wild: '25 pts',
      }
    }
  },
  {
    id: 'skyjo',
    name: 'Skyjo',
    playerMode: 'individual',
    minPlayers: 2,
    maxPlayers: 8,
    hasBidding: false,
    hasRounds: true,
    lowestScoreWins: true,
    roundScoring: 'free',
    customRules: {
      description: 'Lowest score wins. Game ends when a player reaches 100+ points. If the player who ended the round doesn\'t have the lowest score that round, they double their points.',
      targetScore: 100,
      cardValues: {
        min: -2,
        max: 12,
      },
      doubleRule: 'If the round-ender does not have the lowest score, their round points are doubled.'
    }
  },
  {
    id: 'euchre',
    name: 'Euchre',
    playerMode: 'both',
    minPlayers: 4,
    maxPlayers: 4,
    minTeams: 2,
    maxTeams: 2,
    hasBidding: true,
    hasRounds: true,
    lowestScoreWins: false,
    roundScoring: 'bid-tricks',
    customRules: {
      description: 'Trick-taking game for 2 teams of 2. Makers must win 3+ tricks. First team to 10 points wins.',
      targetScore: 10,
      scoring: {
        makers3or4Tricks: 1,
        makersMarch: 2,
        loner3or4Tricks: 1,
        lonerMarch: 4,
        euchred: 2,
      }
    }
  },
  {
    id: 'play-nine',
    name: 'Play Nine',
    playerMode: 'individual',
    minPlayers: 2,
    maxPlayers: 8,
    hasBidding: false,
    hasRounds: true,
    lowestScoreWins: true,
    roundScoring: 'free',
    customRules: {
      description: 'Golf-themed card game. 9 holes, lowest total score wins. Cards 0–12, Hole-in-One = -5.',
      totalHoles: 9,
      cardValues: {
        mulligan: 0,
        holeInOne: -5,
        outOfBounds: 12
      },
      matchingBonuses: {
        twoCards: 0,
        fourCards: -10,
        sixCards: -15,
        eightCards: -20
      }
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
