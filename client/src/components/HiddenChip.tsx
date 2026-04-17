import { useState, useEffect } from 'react'

const JOKES = [
  "🚨 ALERT: Card counting detected. The authorities have been notified. Please remain seated.",
  "🕵️ We've flagged your account for suspicious mathematical activity. A casino agent is en route.",
  "📞 This app has automatically dialed 1-800-NO-COUNTING. Please step away from the scorecard.",
  "🎰 Nice try, Rain Man. We're calling Vegas.",
  "👮 Sir, this is a card game tracker, not a counting operation. Put the abacus down.",
]

const POSITIONS = [
  { bottom: '12px', left: '8px' },
  { bottom: '12px', right: '8px' },
  { top: '80px', right: '8px' },
]

export default function HiddenChip() {
  const [show, setShow] = useState(false)
  const [joke, setJoke] = useState('')
  const [pos] = useState(() => POSITIONS[Math.floor(Math.random() * POSITIONS.length)])

  useEffect(() => {
    // Show chip after a random delay so it feels discovered
    const t = setTimeout(() => setShow(true), 3000 + Math.random() * 5000)
    return () => clearTimeout(t)
  }, [])

  const handleClick = () => {
    setJoke(JOKES[Math.floor(Math.random() * JOKES.length)])
  }

  if (!show) return null

  return (
    <>
      <button
        className="hidden-chip"
        style={{ ...pos, position: 'fixed' }}
        onClick={handleClick}
        aria-label="Hidden chip"
        title="..."
      >
        🪙
      </button>
      {joke && (
        <div className="modal-overlay" onClick={() => setJoke('')}>
          <div className="modal" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem' }}>{joke}</p>
            <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => setJoke('')}>
              I was not counting cards
            </button>
          </div>
        </div>
      )}
    </>
  )
}
