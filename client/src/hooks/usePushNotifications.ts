import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission)
  }, [])

  const subscribe = async () => {
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) return

    const perm = await Notification.requestPermission()
    setPermission(perm)
    if (perm !== 'granted') return

    try {
      const keyRes = await fetch('/api/push/vapid-public-key', {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      const { key } = await keyRes.json()

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key)
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(sub.toJSON())
      })
      setSubscribed(true)
    } catch (err) {
      console.error('Push subscribe failed:', err)
    }
  }

  const unsubscribe = async () => {
    if (!user) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` }
      })
      setSubscribed(false)
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
    }
  }

  const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window

  return { permission, subscribed, subscribe, unsubscribe, isSupported }
}
