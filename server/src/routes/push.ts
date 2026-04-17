import { Router } from 'express'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, USERS_TABLE } from '../db'
import { requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()

// Get VAPID public key — no auth needed, it's a public key
router.get('/vapid-public-key', (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY ?? '' })
})

router.use(requireAuth)

// Save push subscription for this user
router.post('/subscribe', async (req: AuthRequest, res) => {
  const subscription = req.body
  if (!subscription?.endpoint) { res.status(400).json({ error: 'Invalid subscription' }); return }

  await ddb.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { id: req.userId },
    UpdateExpression: 'SET pushSubscription = :sub',
    ExpressionAttributeValues: { ':sub': subscription }
  }))
  res.json({ ok: true })
})

// Remove push subscription
router.post('/unsubscribe', async (req: AuthRequest, res) => {
  await ddb.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { id: req.userId },
    UpdateExpression: 'REMOVE pushSubscription'
  }))
  res.json({ ok: true })
})

export default router
