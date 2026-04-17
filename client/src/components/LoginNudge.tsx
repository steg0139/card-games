import { useNavigate } from 'react-router-dom'

interface Props {
  message?: string
  onDismiss: () => void
}

export default function LoginNudge({ message, onDismiss }: Props) {
  const navigate = useNavigate()

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '1.3rem', marginBottom: 4 }}>🃏</p>
        <h3>Save your progress</h3>
        <p className="muted" style={{ fontSize: '0.9rem', marginTop: 6 }}>
          {message ?? 'Sign in or create a free account to save game history, track stats, and sync across devices.'}
        </p>
        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn-primary" onClick={() => { onDismiss(); navigate('/settings') }}>
            Sign In / Register
          </button>
          <button className="btn-ghost" onClick={onDismiss}>Maybe later</button>
        </div>
      </div>
    </div>
  )
}
