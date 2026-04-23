import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGameConfig } from '@/games/configs'
import { useGame } from '@/context/GameContext'
import { useAuth } from '@/context/AuthContext'
import { usePreferences } from '@/context/PreferencesContext'
import type { Game, Player, Team, PlayerMode, GameConfig } from '@/types'
import PlayerInput, { type LinkedPlayer } from '@/components/PlayerInput'
import LoginNudge from '@/components/LoginNudge'
import { useLoginNudge } from '@/hooks/useLoginNudge'
import AppHeader from '@/components/AppHeader'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function GameSetup() {
  const { gameId } = useParams<{ gameId: string }>()
  const baseConfig = getGameConfig(gameId!)
  const navigate = useNavigate()
  const { startGame } = useGame()
  const { user } = useAuth()
  const { getConfig } = usePreferences()
  const nudge = useLoginNudge()

  const [config, setConfig] = useState<GameConfig>(baseConfig ? getConfig(gameId!) : {} as GameConfig)
  const [playerMode, setPlayerMode] = useState<PlayerMode>('individual')
  const [playerNames, setPlayerNames] = useState<LinkedPlayer[]>(() => [
    user ? { name: user.username, linkedUserId: user.id } : { name: '' },
    { name: '' }
  ])
  const [teamNames, setTeamNames] = useState<string[]>(['Team 1', 'Team 2'])
  const [teamAssignments, setTeamAssignments] = useState<Record<string, string>>({})
  const [showRules, setShowRules] = useState(false)

  if (!baseConfig) return <div className="page"><p>Game not found.</p></div>

  const addPlayer = () => setPlayerNames(p => [...p, { name: '' }])
  const removePlayer = (i: number) => setPlayerNames(p => p.filter((_, idx) => idx !== i))
  const addTeam = () => setTeamNames(t => [...t, `Team ${t.length + 1}`])
  const removeTeam = (i: number) => setTeamNames(t => t.filter((_, idx) => idx !== i))

  const canStart = playerMode === 'individual'
    ? playerNames.filter(n => n.name.trim()).length >= config.minPlayers
    : teamNames.filter(n => n.trim()).length >= (config.minTeams ?? 2) &&
      playerNames.filter(n => n.name.trim()).length >= config.minPlayers

  const handleStart = async () => {
    const players: Player[] = playerNames
      .filter(n => n.name.trim())
      .map(p => ({ id: generateId(), name: p.name.trim(), ...(p.linkedUserId ? { linkedUserId: p.linkedUserId } : {}) }))

    const teams: Team[] = playerMode === 'teams'
      ? teamNames.filter(n => n.trim()).map((name, i) => ({
          id: generateId(),
          name: name.trim(),
          playerIds: players
            .filter((_, playerIndex) => teamAssignments[String(playerIndex)] === String(i))
            .map(p => p.id)
        }))
      : []

    const game: Game = {
      id: generateId(),
      gameConfigId: config.id,
      playerMode,
      players,
      teams,
      rounds: [],
      startedAt: Date.now(),
      config
    }

    startGame(game)
    navigate('/game')
  }

  return (
    <div className="page">
      <AppHeader />
      <button className="btn-ghost back-btn" onClick={() => navigate('/')}>← Back</button>
      <h2>Set Up {config.name}</h2>

      {config.playerMode === 'both' && (
        <div className="toggle-group">
          <button
            className={playerMode === 'individual' ? 'toggle active' : 'toggle'}
            onClick={() => setPlayerMode('individual')}
          >Individual</button>
          <button
            className={playerMode === 'teams' ? 'toggle active' : 'toggle'}
            onClick={() => setPlayerMode('teams')}
          >Teams</button>
        </div>
      )}

      <section className="setup-section">
        <h3>Players</h3>
        {playerNames.map((player, i) => (
          <div key={i} className="player-row">
            <PlayerInput
              value={player}
              onChange={p => setPlayerNames(arr => arr.map((n, idx) => idx === i ? p : n))}
              placeholder={`Player ${i + 1}`}
            />
            {playerMode === 'teams' && (
              <select
                value={teamAssignments[String(i)] ?? ''}
                onChange={e => setTeamAssignments(a => ({ ...a, [String(i)]: e.target.value }))}
              >
                <option value="">No team</option>
                {teamNames.map((t, ti) => <option key={ti} value={String(ti)}>{t}</option>)}
              </select>
            )}
            {playerNames.length > config.minPlayers && (
              <button className="btn-icon" onClick={() => removePlayer(i)} aria-label="Remove player">✕</button>
            )}
          </div>
        ))}
        {playerNames.length < config.maxPlayers && (
          <button className="btn-secondary" onClick={addPlayer}>+ Add Player</button>
        )}
      </section>

      {playerMode === 'teams' && (
        <section className="setup-section">
          <h3>Teams</h3>
          {teamNames.map((name, i) => (
            <div key={i} className="player-row">
              <input
                type="text"
                value={name}
                onChange={e => setTeamNames(t => t.map((n, idx) => idx === i ? e.target.value : n))}
              />
              {teamNames.length > (config.minTeams ?? 2) && (
                <button className="btn-icon" onClick={() => removeTeam(i)} aria-label="Remove team">✕</button>
              )}
            </div>
          ))}
          {teamNames.length < (config.maxTeams ?? 4) && (
            <button className="btn-secondary" onClick={addTeam}>+ Add Team</button>
          )}
        </section>
      )}

      <section className="setup-section">
        <button className="btn-ghost" onClick={() => setShowRules(r => !r)}>
          {showRules ? '▲' : '▼'} Game Rules &amp; Settings
        </button>
        {showRules && (
          <div className="rules-panel">
            <p className="rules-desc">{String(config.customRules?.description ?? '')}</p>
            {config.targetScore && (
              <label>
                Target Score
                <input
                  type="number"
                  value={config.targetScore}
                  onChange={e => setConfig(c => ({ ...c, targetScore: Number(e.target.value) }))}
                />
              </label>
            )}
            {config.id === 'mexican-train' && (() => {
              const r = config.customRules as Record<string, number>
              return (
                <div className="hf-rules-grid">
                  <label>
                    Double set
                    <select
                      value={r.doubleSet ?? 9}
                      onChange={e => setConfig(c => ({ ...c, customRules: { ...c.customRules, doubleSet: Number(e.target.value) } }))}
                    >
                      {[6, 9, 12, 15].map(n => (
                        <option key={n} value={n}>Double-{n} ({n + 1} rounds)</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Double-blank value
                    <input
                      type="number"
                      inputMode="numeric"
                      value={r.doubleBlankValue ?? 0}
                      onChange={e => setConfig(c => ({ ...c, customRules: { ...c.customRules, doubleBlankValue: Number(e.target.value) } }))}
                    />
                  </label>
                </div>
              )
            })()}
            {config.id === 'wizard' && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!!(config.customRules as Record<string, unknown>)?.noEvenBids}
                  onChange={e => setConfig(c => ({ ...c, customRules: { ...c.customRules, noEvenBids: e.target.checked } }))}
                />
                Screw the dealer (bids can't equal cards in hand)
              </label>
            )}
            {config.id === 'hand-and-foot' && (() => {
              const r = config.customRules as Record<string, number>
              const setRule = (key: string, raw: string) => {
                const val = raw === '' || raw === '-' ? raw : Number(raw)
                if (raw === '' || raw === '-' || !isNaN(Number(raw))) {
                  setConfig(c => ({ ...c, customRules: { ...c.customRules, [key]: val } }))
                }
              }
              return (
                <div className="hf-rules-grid">
                  {([
                    ['cleanBook',  'Clean Book'],
                    ['dirtyBook',  'Dirty Book'],
                    ['redThree',   'Red Three'],
                    ['blackThree', 'Black Three'],
                    ['goingOut',   'Going Out Bonus'],
                  ] as [string, string][]).map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        type="text"
                        inputMode="numeric"
                        value={r[key] ?? 0}
                        onChange={e => setRule(key, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              )
            })()}
          </div>
        )}
      </section>

      <button className="btn-primary full-width" onClick={() => {
        if (!user) nudge.show()
        handleStart()
      }} disabled={!canStart}>
        Start Game
      </button>
      {nudge.visible && !user && (
        <LoginNudge
          message="Sign in to save this game to your history and track your stats."
          onDismiss={nudge.dismiss}
        />
      )}
    </div>
  )
}
