import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

export default function Settings() {
  const navigate = useNavigate()
  const { user, login, register, logout } = useAuth()
  const { theme, setTheme } = useTheme()

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
