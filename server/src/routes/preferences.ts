import { Router } from 'express'
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, USERS_TABLE } from '../db'
import { requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res) => {
  const result = await ddb.send(new GetCommand({
    TableName: USERS_TABLE,
    Key: { id: req.userId },
    ProjectionExpression: 'preferences'
  }))
  res.json(result.Item?.preferences ?? {})
})

router.put('/', async (req: AuthRequest, res) => {
  const { gameId, customRules, targetScore } = req.body
  if (!gameId) { res.status(400).json({ error: 'gameId required' }); return }

  const result = await ddb.send(new GetCommand({
    TableName: USERS_TABLE,
    Key: { id: req.userId },
    ProjectionExpression: 'preferences'
  }))

  const existing = result.Item?.preferences ?? {}
  const updated = {
    ...existing,
    [gameId]: { customRules, ...(targetScore !== undefined ? { targetScore } : {}) }
  }

  await ddb.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: { id: req.userId, ...result.Item, preferences: updated }
  }))

  res.json({ ok: true })
})

export default router
