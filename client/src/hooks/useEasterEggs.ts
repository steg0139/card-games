import { useEffect, useRef, useCallback } from 'react'

const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']

export function useKonami(onActivate: () => void) {
  const progress = useRef(0)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === KONAMI[progress.current]) {
        progress.current++
        if (progress.current === KONAMI.length) {
          progress.current = 0
          onActivate()
        }
      } else {
        progress.current = e.key === KONAMI[0] ? 1 : 0
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onActivate])
}

// Name easter eggs
export const NAME_EGGS: Record<string, string> = {
  kris:          '🦖',
  frank:         '💩',
  dealer:        '🎰',
  cheater:       '🕵️',
  josh:          '👑',
  anna:          '👻',
  megan:         '👑',
  gabby:         '💬',
  johnny:        '🏈',
  mason:         '🐶',
  ryan:          '🥸',
  rypup:         '🥸',
  cami:          '💃',
  matt:          '💪',
  paul:          '⛪',
  'father paul': '⛪',
  'father':      '⛪',
  'fr paul':     '⛪',
  'fr.paul':     '⛪',
  'fr.':         '⛪',
}

export function getNameEmoji(name: string): string | null {
  return NAME_EGGS[name.toLowerCase().trim()] ?? null
}

// Long game threshold
export const LONG_GAME_ROUNDS = 20
