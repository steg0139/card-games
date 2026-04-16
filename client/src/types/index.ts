export type PlayerMode = 'individual' | 'teams'

export interface Player {
  id: string
  name: string
  linkedUserId?: string
}

export interface Team {
  id: string
  name: string
  playerIds: string[]
}

export interface RoundScore {
  entityId: string // player or team id
  score: number
  bid?: number
  tricksTaken?: number
  meldPoints?: number
  penaltyPoints?: number
  note?: string
}

export interface Round {
  roundNumber: number
  scores: RoundScore[]
  timestamp: number
}

export interface GameConfig {
  id: string
  name: string
  playerMode: PlayerMode | 'both'
  minPlayers: number
  maxPlayers: number
  minTeams?: number
  maxTeams?: number
  hasBidding: boolean
  hasRounds: boolean
  targetScore?: number        // win when reaching this
  lowestScoreWins?: boolean
  roundScoring: RoundScoringType
  customRules?: Record<string, unknown>
}

export type RoundScoringType = 'free' | 'bid-tricks' | 'meld' | 'hand-foot'

export interface Game {
  id: string
  gameConfigId: string
  playerMode: PlayerMode
  players: Player[]
  teams: Team[]
  rounds: Round[]
  startedAt: number
  endedAt?: number
  winnerId?: string
  note?: string
  pendingBids?: Record<string, number | string>
  config: GameConfig
}

export interface AuthUser {
  id: string
  username: string
  token: string
}
