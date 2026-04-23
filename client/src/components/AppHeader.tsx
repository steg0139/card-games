import { useNavigate } from 'react-router-dom'

interface Props {
  children?: React.ReactNode  // optional right-side actions
}

export default function AppHeader({ children }: Props) {
  const navigate = useNavigate()
  return (
    <header className="app-header">
      <button className="btn-ghost home-logo" onClick={() => navigate('/')} aria-label="Home">
        🃏 <span className="home-logo-text">Card Scores</span>
      </button>
      {children && <div className="header-actions">{children}</div>}
    </header>
  )
}
