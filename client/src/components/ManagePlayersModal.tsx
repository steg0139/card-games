import { useState, useEffect } from 'react'
import type { Game } from '@/types'
import { useGame } from '@/context/GameContext'
import { useAuth } from '@/context/AuthContext'

interface Props {
  game: Game
  onClose: () => void
}

interface UserResult {
  id: string
  username: string
}

export default function ManagePlayersModal({ game, onClose }: Props) {
  const { addPlayer, removePlayer } = useGame()
  const { user } = useAuth()
  const [newName, setNewName] = useState('')
  const [startingScore, setStartingScore] = useState('0')
  const [position, setPosition] = useState<string>('')
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [linkedUser, setLinkedUser] = useState<UserResult | null>(null)

  const hasOrdering = game.config.hasBidding

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
        setSearchResults(await res.json())
      } catch { setSearchResults([]) }
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const handleAdd = () => {
    const name = linkedUser ? linkedUser.username : newName.trim()
    if (!name) return
    const pos = position !== '' ? Number(position) : undefined
    addPlayer(name, Number(startingScore) || 0, pos, linkedUser?.id)
    setNewName('')
    setStartingScore('0')
    setPosition('')
    setLinkedUser(null)
    setSearchQuery('')
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 380 }}>
        <h3>Manage Players</h3>

        <section className="setup-section">
          <h3>Current Players</h3>
          {game.players.map((p, i) => (
            <div key={p.id} className="player-manage-row">
              <span className="player-position">{i + 1}</span>
              <span className="player-manage-name">
                {p.name}
                {p.linkedUserId && <span className="linked-badge">linked</span>}
              </span>
              {confirmRemove === p.id ? (
                <div className="confirm-remove">
                  <span className="muted" style={{ fontSize: '0.8rem' }}>Remove?</span>
                  <button className="btn-ghost danger" style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                    onClick={() => { removePlayer(p.id); setConfirmRemove(null) }}>Yes</button>
                  <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                    onClick={() => setConfirmRemove(null)}>No</button>
                </div>
              ) : (
                <button className="btn-icon" onClick={() => setConfirmRemove(p.id)} aria-label="Remove player">✕</button>
              )}
            </div>
          ))}
        </section>

        <section className="setup-section">
          <h3>Add Player</h3>

          {user && (
            <>
              <label>Search by username
                <input
                  type="text"
                  placeholder="Type to search…"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setLinkedUser(null) }}
                />
              </label>
              {searchResults.length > 0 && !linkedUser && (
                <div className="search-results">
                  {searchResults.map(u => (
                    <button key={u.id} className="search-result-item" onClick={() => {
                      setLinkedUser(u)
                      setNewName(u.username)
                      setSearchQuery(u.username)
                      setSearchResults([])
                    }}>
                      {u.username}
                    </button>
                  ))}
                </div>
              )}
              {linkedUser && (
                <p className="muted" style={{ fontSize: '0.82rem' }}>
                  Linked to @{linkedUser.username} — game will appear in their history when complete.
                  <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: '0.78rem' }}
                    onClick={() => { setLinkedUser(null); setNewName(''); setSearchQuery('') }}>✕</button>
                </p>
              )}
              {!linkedUser && <p className="muted" style={{ fontSize: '0.78rem' }}>Or enter a name manually:</p>}
            </>
          )}

          {!linkedUser && (
            <input
              type="text"
              placeholder="Player name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          )}

          <label>
            Starting score
            <input
              type="number"
              inputMode="numeric"
              value={startingScore}
              onChange={e => setStartingScore(e.target.value)}
            />
          </label>

          {hasOrdering && (
            <label>
              Insert at position (leave blank for end)
              <select value={position} onChange={e => setPosition(e.target.value)}>
                <option value="">End of list</option>
                {game.players.map((p, i) => (
                  <option key={i} value={String(i)}>Before {p.name} (position {i + 1})</option>
                ))}
              </select>
            </label>
          )}

          <button className="btn-secondary" onClick={handleAdd}
            disabled={!linkedUser && !newName.trim()}>
            + Add Player
          </button>
        </section>

        <button className="btn-primary full-width" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}
