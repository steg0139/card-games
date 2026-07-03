import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '@/components/AppHeader'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'username' | 'answer' | 'done'>('username')
  const [username, setUsername] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`/api/auth/security-question/${encodeURIComponent(username)}`)
      if (!res.ok) throw new Error((await res.json()).error)
      const data = await res.json()
      setQuestion(data.question)
      setStep('answer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User not found')
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, answer, newPassword })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    }
  }

  return (
    <div className="page centered">
      <AppHeader />
      <div className="auth-card">
        <h2>Reset Password</h2>

        {step === 'username' && (
          <form onSubmit={handleLookup} className="form">
            <label>
              Username
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
            </label>
            {error && <p className="error">{error}</p>}
            <button className="btn-primary" type="submit" disabled={!username.trim()}>Next</button>
          </form>
        )}

        {step === 'answer' && (
          <form onSubmit={handleReset} className="form">
            <p className="muted" style={{ fontSize: '0.9rem' }}>{question}</p>
            <label>
              Your answer
              <input type="text" value={answer} onChange={e => setAnswer(e.target.value)} required />
            </label>
            <label>
              New password
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoComplete="new-password" />
            </label>
            {error && <p className="error">{error}</p>}
            <button className="btn-primary" type="submit" disabled={!answer.trim() || !newPassword}>Reset Password</button>
          </form>
        )}

        {step === 'done' && (
          <>
            <p style={{ textAlign: 'center' }}>✓ Password reset successfully.</p>
            <button className="btn-primary full-width" onClick={() => navigate('/settings')}>Sign In</button>
          </>
        )}

        <button className="btn-ghost" onClick={() => navigate('/settings')}>← Back to Sign In</button>
      </div>
    </div>
  )
}
