import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGameConfig } from '@/games/configs'
import { useGame } from '@/context/GameContext'
import { useAuth } from '@/context/AuthContext'
import type { Game, Player, Team, PlayerMode, GameConfig } from '@/types'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function GameSetup() {
  const { gameId } = useParams<{ gameId: string }>()
  const baseConfig = getGameConfig(gameId!)
  const navigate = useNavigate()
  const { startGame } = useGame()
  const { user } = useAuth()

  const [config, setConfig] = useState<GameConfig>(baseConfig ? { ...baseConfig } : {} as GameConfig)
  const [playerMode, setPlayerMode] = useState<PlayerMode>('individual')
  const [playerNames, setPlayerNames] = useState<string[]>(['', ''])
  const [teamNames, setTeamNames] = useState<string[]>(['Team 1', 'Team 2'])
  const [teamAssignments, setTeamAssignments] = useState<Record<string, string>>({})
  const [showRules, setShowRules] = useState(false)

  if (!baseConfig) return <div className="page"><p>Game not found.</p></div>

  const addPlayer = () => setPlayerNames(p => [...p, ''])
  const removePlayer = (i: number) => setPlayerNames(p => p.filter((_, idx) => idx !== i))
  const addTeam = () => setTeamNames(t => [...t, `Team ${t.length + 1}`])
  const removeTeam = (i: number) => setTeamNames(t => t.filter((_, idx) => idx !== i))

  const canStart = playerMode === 'individual'
    ? playerNames.filter(n => n.trim()).length >= config.minPlayers
    : teamNames.filter(n => n.trim()).length >= (config.minTeams ?? 2) &&
      playerNames.filter(n => n.trim()).length >= config.minPlayers

  const handleStart = async () => {
    const players: Player[] = playerNames
      .filter(n => n.trim())
      .map(name => ({ id: generateId(), name: name.trim() }))

    const teams: Team[] = playerMode === 'teams'
      ? teamNames.filter(n => n.trim()).map((name, i) => ({
          id: generateId(),
          name: name.trim(),
          playerIds: players
            .filter(p => teamAssignments[p.id] === String(i))
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

    if (user) {
      try {
        await fetch('/api/games', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`
          },
          body: JSON.stringify(game)
        })
      } catch { /* offline, continue with local */ }
    }

    startGame(game)
    navigate('/game')
  }

  return (
    <div className="page">
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
        {playerNames.map((name, i) => (
          <div key={i} className="player-row">
            <input
              type="text"
              placeholder={`Player ${i + 1}`}
              value={name}
              onChange={e => setPlayerNames(p => p.map((n, idx) => idx === i ? e.target.value : n))}
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
            {config.id === 'wizard' && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!!(config.customRules as Record<string, unknown>)?.noEvenBids}
                  onChange={e => setConfig(c => ({ ...c, customRules: { ...c.customRules, noEvenBids: e.target.checked } }))}
                />
                Bids can't equal cards in hand (last bidder rule)
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

      <button className="btn-primary full-width" onClick={handleStart} disabled={!canStart}>
        Start Game
      </button>
    </div>
  )
}
