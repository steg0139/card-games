import { useEffect, useState } from 'react'

const CARDS = ['🂡', '🂱', '🃁', '🃑', '🂢', '🂲', '🃂', '🃒', '🂣', '🂳', '🃃', '🃓', '🂤', '🂴', '🃄', '🃔', '🂥', '🂵', '🃅', '🃕']
const MESSAGES = [
  'Shuffling the deck...',
  'Dealing you in!',
  'May the cards be with you 🃏',
  'No peeking!',
  'Ante up!',
  'Go fish? Wrong game.',
]

interface FlyingCard {
  id: number
  card: string
  x: number
  y: number
  rotation: number
  duration: number
  delay: number
}

export default function CardShuffle({ onDone }: { onDone: () => void }) {
  const [cards] = useState<FlyingCard[]>(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      card: CARDS[Math.floor(Math.random() * CARDS.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 720 - 360,
      duration: 0.6 + Math.random() * 0.6,
      delay: i * 0.06,
    }))
  )
  const [message] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)])

  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="card-shuffle-overlay" onClick={onDone}>
      {cards.map(c => (
        <span
          key={c.id}
          className="flying-card"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
            '--rotation': `${c.rotation}deg`,
          } as React.CSSProperties}
        >
          {c.card}
        </span>
      ))}
      <p className="shuffle-message">{message}</p>
    </div>
  )
}
