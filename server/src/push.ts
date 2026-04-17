import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL ?? 'mailto:admin@example.com',
  process.env.VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
)

export interface PushSubscription {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function sendPush(subscription: PushSubscription, payload: object) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
  } catch (err: any) {
    // 410 = subscription expired/unsubscribed
    if (err.statusCode === 410) return 'expired'
    console.error('Push failed:', err.message)
  }
}
