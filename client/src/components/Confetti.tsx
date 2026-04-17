import { useEffect, useState } from 'react'

interface Piece {
  id: number
  x: number
  color: string
  duration: number
  delay: number
  size: number
}

const COLORS = ['#2d6a4f', '#52b788', '#f4a261', '#e76f51', '#264653', '#e9c46a']

export default function Confetti({ onDone }: { onDone: () => void }) {
  const [pieces] = useState<Piece[]>(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      duration: 1.5 + Math.random() * 1,
      delay: Math.random() * 0.5,
      size: 6 + Math.random() * 8,
    }))
  )

  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="confetti-overlay" onClick={onDone}>
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            background: p.color,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <div className="konami-message">
        <p>🎮 Cheat mode activated!</p>
        <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Unlimited wildcards... just kidding 😄</p>
      </div>
    </div>
  )
}
