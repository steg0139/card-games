import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { GAME_CONFIGS } from '@/games/configs'
import type { Game, Player, Team, PlayerMode, RoundScore, Round } from '@/types'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function toTimestamp(dateStr: string) {
  return new Date(dateStr).getTime()
}

export default function LogPastGame() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [selectedGameId, setSelectedGameId] = useState('')
  const [customName, setCustomName] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [playerMode, setPlayerMode] = useState<PlayerMode>('individual')
  const [playerNames, setPlayerNames] = useState<string[]>(['', ''])
  const [teamNames, setTeamNames] = useState<string[]>(['Team 1', 'Team 2'])
  const [teamAssignments, setTeamAssignments] = useState<Record<string, string>>({})
  const [scores, setScores] = useState<Record<string, string>>({})
  const [lowestWins, setLowestWins] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedConfig = GAME_CONFIGS.find(g => g.id === selectedGameId)
  const isCustom = selectedGameId === 'custom'
  const validPlayers = playerNames.filter(n => n.trim())

  const canSave = (selectedGameId || isCustom) &&
    (isCustom ? customName.trim() : true) &&
    validPlayers.length >= 2 &&
    date

  const handleSave = async () => {
    if (!user || !canSave) return
    setSaving(true)

    const config = isCustom ? {
      id: 'custom',
      name: customName.trim(),
      playerMode: 'individual' as PlayerMode,
      minPlayers: 2,
      maxPlayers: 20,
      hasBidding: false,
      hasRounds: true,
      lowestScoreWins: lowestWins,
      roundScoring: 'free' as const
    } : { ...selectedConfig! }

    const players: Player[] = validPlayers.map(name => ({ id: generateId(), name }))

    const teams: Team[] = playerMode === 'teams' && !isCustom
      ? teamNames.filter(n => n.trim()).map((name, i) => ({
          id: generateId(),
          name: name.trim(),
          playerIds: players
            .filter((_, pi) => teamAssignments[String(pi)] === String(i))
            .map(p => p.id)
        }))
      : []

    const entities = playerMode === 'teams' && teams.length ? teams : players

    const roundScores: RoundScore[] = entities.map((e, i) => ({
      entityId: e.id,
      score: Number(scores[String(i)]) || 0
    }))

    const round: Round = {
      roundNumber: 1,
      scores: roundScores,
      timestamp: toTimestamp(date)
    }

    const game: Game = {
      id: generateId(),
      gameConfigId: config.id,
      playerMode,
      players,
      teams,
      rounds: [round],
      startedAt: toTimestamp(date),
      endedAt: toTimestamp(date),
      note: note.trim() || undefined,
      config
    }

    try {
      await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(game)
      })
      navigate('/history')
    } catch {
      alert('Failed to save game. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <button className="btn-ghost back-btn" onClick={() => navigate('/history')}>← Back</button>
      <h2>Log Past Game</h2>

      <section className="setup-section">
        <h3>Game</h3>
        <select value={selectedGameId} onChange={e => setSelectedGameId(e.target.value)}>
          <option value="">Select a game…</option>
          {GAME_CONFIGS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          <option value="custom">Custom / Other</option>
        </select>
        {isCustom && (
          <input
            type="text"
            placeholder="Game name"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
          />
        )}
      </section>

      {isCustom && (
        <section className="setup-section">
          <h3>Scoring</h3>
          <div className="toggle-group">
            <button className={!lowestWins ? 'toggle active' : 'toggle'} onClick={() => setLowestWins(false)}>Highest wins</button>
            <button className={lowestWins ? 'toggle active' : 'toggle'} onClick={() => setLowestWins(true)}>Lowest wins</button>
          </div>
        </section>
      )}

      <section className="setup-section">
        <h3>Date Played</h3>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </section>

      {selectedConfig?.playerMode === 'both' && (
        <section className="setup-section">
          <h3>Mode</h3>
          <div className="toggle-group">
            <button className={playerMode === 'individual' ? 'toggle active' : 'toggle'} onClick={() => setPlayerMode('individual')}>Individual</button>
            <button className={playerMode === 'teams' ? 'toggle active' : 'toggle'} onClick={() => setPlayerMode('teams')}>Teams</button>
          </div>
        </section>
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
              <select value={teamAssignments[String(i)] ?? ''} onChange={e => setTeamAssignments(a => ({ ...a, [String(i)]: e.target.value }))}>
                <option value="">No team</option>
                {teamNames.map((t, ti) => <option key={ti} value={String(ti)}>{t}</option>)}
              </select>
            )}
            {playerNames.length > 2 && (
              <button className="btn-icon" onClick={() => setPlayerNames(p => p.filter((_, idx) => idx !== i))} aria-label="Remove">✕</button>
            )}
          </div>
        ))}
        <button className="btn-secondary" onClick={() => setPlayerNames(p => [...p, ''])}>+ Add Player</button>
      </section>

      {playerMode === 'teams' && !isCustom && (
        <section className="setup-section">
          <h3>Teams</h3>
          {teamNames.map((name, i) => (
            <div key={i} className="player-row">
              <input type="text" value={name} onChange={e => setTeamNames(t => t.map((n, idx) => idx === i ? e.target.value : n))} />
              {teamNames.length > 2 && (
                <button className="btn-icon" onClick={() => setTeamNames(t => t.filter((_, idx) => idx !== i))} aria-label="Remove">✕</button>
              )}
            </div>
          ))}
          <button className="btn-secondary" onClick={() => setTeamNames(t => [...t, `Team ${t.length + 1}`])}>+ Add Team</button>
        </section>
      )}

      {selectedGameId && validPlayers.length >= 2 && (
        <section className="setup-section">
          <h3>Final Scores</h3>
          {(playerMode === 'teams' && teamNames.filter(n => n.trim()).length
            ? teamNames.filter(n => n.trim()).map((name, i) => ({ id: String(i), name }))
            : validPlayers.map((name, i) => ({ id: String(i), name }))
          ).map(e => (
            <div key={e.id} className="score-row">
              <label>{e.name}</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={scores[e.id] ?? ''}
                onChange={ev => setScores(s => ({ ...s, [e.id]: ev.target.value }))}
              />
            </div>
          ))}
        </section>
      )}

      <section className="setup-section">
        <h3>Note (optional)</h3>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Any notes about this game…"
          rows={2}
        />
      </section>

      <button className="btn-primary full-width" onClick={handleSave} disabled={!canSave || saving || !user}>
        {!user ? 'Sign in to save' : saving ? 'Saving…' : 'Save Game'}
      </button>
      {!user && <p className="muted" style={{ textAlign: 'center', fontSize: '0.85rem' }}>You need an account to log past games.</p>}
    </div>
  )
}
