import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'

export interface LinkedPlayer {
  name: string
  linkedUserId?: string
}

interface Props {
  value: LinkedPlayer
  onChange: (player: LinkedPlayer) => void
  placeholder?: string
}

interface UserResult {
  id: string
  username: string
}

export default function PlayerInput({ value, onChange, placeholder = 'Player name' }: Props) {
  const { user } = useAuth()
  const [query, setQuery] = useState(value.name)
  const [results, setResults] = useState<UserResult[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cancelRef = useRef(false)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!user || query.length < 2 || value.linkedUserId) { setResults([]); return }
    cancelRef.current = false
    const timeout = setTimeout(async () => {
      if (cancelRef.current) return
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (cancelRef.current) return
        setResults(data)
        setOpen(data.length > 0)
      } catch { setResults([]) }
    }, 300)
    return () => clearTimeout(timeout)
  }, [query, user])

  const select = (u: UserResult) => {
    setQuery(u.username)
    setOpen(false)
    setResults([])
    onChange({ name: u.username, linkedUserId: u.id })
  }

  const handleChange = (val: string) => {
    setQuery(val)
    // Clear link if user manually edits after selecting
    if (value.linkedUserId) onChange({ name: val })
    else onChange({ name: val })
  }

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => { cancelRef.current = true; setTimeout(() => setOpen(false), 150) }}
        onKeyDown={e => { if (e.key === 'Tab') { cancelRef.current = true; setOpen(false) } }}
        style={{ width: '100%' }}
      />
      {value.linkedUserId && (
        <span className="linked-badge" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
          linked
        </span>
      )}
      {open && results.length > 0 && (
        <div className="search-results" style={{ position: 'absolute', zIndex: 10, width: '100%', top: '100%', marginTop: 2 }}>
          {results.map(u => (
            <button key={u.id} className="search-result-item" onMouseDown={() => select(u)}>
              {u.username}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
