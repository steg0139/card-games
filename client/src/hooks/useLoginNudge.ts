import { useState, useCallback } from 'react'

const DISMISS_KEY = 'login_nudge_dismissed'
const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 hours

export function useLoginNudge() {
  const [visible, setVisible] = useState(false)

  const shouldShow = () => {
    const last = localStorage.getItem(DISMISS_KEY)
    if (!last) return true
    return Date.now() - Number(last) > COOLDOWN_MS
  }

  const show = useCallback(() => {
    if (shouldShow()) setVisible(true)
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  }, [])

  return { visible, show, dismiss }
}
