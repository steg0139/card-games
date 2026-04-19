import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { usePreferences } from '@/context/PreferencesContext'
import { GAME_CONFIGS } from '@/games/configs'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function Settings() {
  const navigate = useNavigate()
  const { user, login, register, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { getConfig, savePreference } = usePreferences()
  const push = usePushNotifications()

  const [selectedPrefGame, setSelectedPrefGame] = useState('')
  const [prefRules, setPrefRules] = useState<Record<string, unknown>>({})
  const [prefTarget, setPrefTarget] = useState<string>('')
  const [prefSaved, setPrefSaved] = useState(false)

  const CONFIGURABLE_GAMES = GAME_CONFIGS.filter(g =>
    ['hand-and-foot', 'wizard', '500', 'skyjo', 'nerts', 'gin-rummy', 'cribbage', 'euchre', 'mexican-train'].includes(g.id)
  )

  const handleSelectPrefGame = (gameId: string) => {
    setSelectedPrefGame(gameId)
    setPrefSaved(false)
    if (!gameId) return
    const cfg = getConfig(gameId)
    setPrefRules({ ...(cfg.customRules as Record<string, unknown> ?? {}) })
    setPrefTarget(cfg.targetScore ? String(cfg.targetScore) : '')
  }

  const handleSavePref = async () => {
    if (!selectedPrefGame) return
    await savePreference(selectedPrefGame, prefRules, prefTarget ? Number(prefTarget) : undefined)
    setPrefSaved(true)
    setTimeout(() => setPrefSaved(false), 2000)
  }

  const selectedPrefConfig = GAME_CONFIGS.find(g => g.id === selectedPrefGame)

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [newUsername, setNewUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [accountMsg, setAccountMsg] = useState('')
  const [accountError, setAccountError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    try {
      if (authMode === 'login') await login(username, password)
      else await register(username, password)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setAccountMsg(''); setAccountError('')
    try {
      const res = await fetch('/api/auth/username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user!.token}` },
        body: JSON.stringify({ username: newUsername })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setAccountMsg('Username updated. Please sign in again.')
      logout()
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Failed to update username')
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setAccountMsg(''); setAccountError('')
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user!.token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setAccountMsg('Password updated successfully.')
      setCurrentPassword(''); setNewPassword('')
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Failed to update password')
    }
  }

  return (
    <div className="page">
      <button className="btn-ghost back-btn" onClick={() => navigate('/')}>← Back</button>
      <h2>Settings</h2>

      {/* Theme */}
      <section className="setup-section">
        <h3>Appearance</h3>
        <div className="toggle-group">
          {(['system', 'light', 'dark'] as const).map(t => (
            <button key={t} className={theme === t ? 'toggle active' : 'toggle'} onClick={() => setTheme(t)}>
              {t === 'system' ? '⚙️ System' : t === 'light' ? '☀️ Light' : '🌙 Dark'}
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      {user && push.isSupported && (
        <section className="setup-section">
          <h3>Notifications</h3>
          <p className="muted" style={{ fontSize: '0.82rem' }}>
            Get notified when you're added to a game or a game is saved to your history.
          </p>
          {push.permission === 'denied' ? (
            <p className="muted" style={{ fontSize: '0.82rem' }}>
              Notifications are blocked. Enable them in your browser settings.
            </p>
          ) : push.subscribed ? (
            <button className="btn-secondary" onClick={push.unsubscribe}>
              Turn off notifications
            </button>
          ) : (
            <button className="btn-primary" onClick={push.subscribe}>
              Enable notifications
            </button>
          )}
        </section>
      )}

      {/* Game Defaults */}
      {user && (
        <section className="setup-section">
          <h3>Game Defaults</h3>
          <p className="muted" style={{ fontSize: '0.82rem' }}>Save your preferred rules for each game. These will be pre-filled when you start a new game.</p>
          <select value={selectedPrefGame} onChange={e => handleSelectPrefGame(e.target.value)}>
            <option value="">Select a game…</option>
            {CONFIGURABLE_GAMES.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          {selectedPrefGame && selectedPrefConfig && (
            <div className="pref-rules">
              {/* Target score */}
              {(selectedPrefConfig.customRules as Record<string, unknown>)?.targetScore !== undefined && (
                <label>
                  Target Score
                  <input type="number" value={prefTarget}
                    onChange={e => setPrefTarget(e.target.value)} />
                </label>
              )}

              {/* Hand & Foot specific */}
              {selectedPrefGame === 'hand-and-foot' && (
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
                      <input type="text" inputMode="numeric"
                        value={String(prefRules[key] ?? '')}
                        onChange={e => setPrefRules(r => ({ ...r, [key]: e.target.value === '' ? '' : Number(e.target.value) || e.target.value }))}
                      />
                    </label>
                  ))}
                </div>
              )}

              {/* Wizard specific */}
              {selectedPrefGame === 'wizard' && (
                <div className="hf-rules-grid">
                  {([
                    ['exactBidBonus',  'Exact Bid Bonus'],
                    ['perTrickScore',  'Per Trick (made)'],
                    ['perTrickPenalty','Per Trick (miss)'],
                  ] as [string, string][]).map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input type="number" inputMode="numeric"
                        value={String(prefRules[key] ?? '')}
                        onChange={e => setPrefRules(r => ({ ...r, [key]: Number(e.target.value) }))}
                      />
                    </label>
                  ))}
                  <label className="checkbox-label full-span">
                    <input type="checkbox"
                      checked={!!prefRules.noEvenBids}
                      onChange={e => setPrefRules(r => ({ ...r, noEvenBids: e.target.checked }))}
                    />
                    Screw the dealer
                  </label>
                </div>
              )}

              {/* Mexican Train specific */}
              {selectedPrefGame === 'mexican-train' && (
                <div className="hf-rules-grid">
                  <label>
                    Double set
                    <select
                      value={String(prefRules.doubleSet ?? 9)}
                      onChange={e => setPrefRules(r => ({ ...r, doubleSet: Number(e.target.value) }))}
                    >
                      {[6, 9, 12, 15].map(n => (
                        <option key={n} value={n}>Double-{n} ({n + 1} rounds)</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Double-blank value
                    <input type="number" inputMode="numeric"
                      value={String(prefRules.doubleBlankValue ?? 0)}
                      onChange={e => setPrefRules(r => ({ ...r, doubleBlankValue: Number(e.target.value) }))}
                    />
                  </label>
                </div>
              )}

              <button className="btn-primary" onClick={handleSavePref}>
                {prefSaved ? '✓ Saved!' : 'Save Defaults'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Auth */}
      {!user ? (
        <section className="setup-section">
          <h3>{authMode === 'login' ? 'Sign In' : 'Create Account'}</h3>
          <form onSubmit={handleAuth} className="form">
            <label>
              Username
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} />
            </label>
            {authError && <p className="error">{authError}</p>}
            <button className="btn-primary" type="submit" disabled={authLoading}>
              {authLoading ? 'Loading…' : authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <button className="btn-ghost" onClick={() => setAuthMode(m => m === 'login' ? 'register' : 'login')}>
            {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>
        </section>
      ) : (
        <>
          <section className="setup-section">
            <h3>Account</h3>
            <p>Signed in as <strong>{user.username}</strong></p>
            <button className="btn-secondary" onClick={logout}>Sign Out</button>
          </section>

          <section className="setup-section">
            <h3>Change Username</h3>
            <form onSubmit={handleUpdateUsername} className="form">
              <label>
                New username
                <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} required autoComplete="username" />
              </label>
              <button className="btn-primary" type="submit" disabled={!newUsername.trim()}>Update Username</button>
            </form>
          </section>

          <section className="setup-section">
            <h3>Change Password</h3>
            <form onSubmit={handleUpdatePassword} className="form">
              <label>
                Current password
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
              </label>
              <label>
                New password
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoComplete="new-password" />
              </label>
              <button className="btn-primary" type="submit" disabled={!currentPassword || !newPassword}>Update Password</button>
            </form>
          </section>

          {accountMsg && <p className="muted" style={{ textAlign: 'center' }}>{accountMsg}</p>}
          {accountError && <p className="error" style={{ textAlign: 'center' }}>{accountError}</p>}
        </>
      )}
    </div>
  )
}
