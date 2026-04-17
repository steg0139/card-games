import { Router } from 'express'
import { GetCommand, PutCommand, QueryCommand, DeleteCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, GAMES_TABLE, USERS_TABLE } from '../db'
import { requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/public/:id', async (req, res) => {
  const existing = await ddb.send(new GetCommand({ TableName: GAMES_TABLE, Key: { id: req.params.id } }))
  if (!existing.Item) { res.status(404).json({ error: 'Game not found' }); return }
  res.json(JSON.parse(existing.Item.data))
})

// Save a game copy to another user's history (called by game owner on end)
router.post('/linked', async (req, res) => {
  const { game, userId } = req.body
  if (!game || !userId) { res.status(400).json({ error: 'Missing game or userId' }); return }
  await ddb.send(new PutCommand({
    TableName: GAMES_TABLE,
    Item: { id: game.id, userId, data: JSON.stringify(game), startedAt: game.startedAt, endedAt: game.endedAt }
  }))

  // Send push notification to the linked user if they have a subscription
  try {
    const userResult = await ddb.send(new GetCommand({ TableName: USERS_TABLE, Key: { id: userId } }))
    const sub = userResult.Item?.pushSubscription
    if (sub) {
      const { sendPush } = await import('../push.js')
      await sendPush(sub, {
        title: 'Card Score Tracker',
        body: `A completed game of ${game.config?.name ?? 'cards'} has been added to your history!`,
        url: `/history/${game.id}`
      })
    }
  } catch { /* non-critical */ }

  res.json({ ok: true })
})

router.use(requireAuth)

router.get('/active-for-me', async (req: AuthRequest, res) => {
  // Find games where this user is a linked player but not the owner, and game is not ended
  const result = await ddb.send(new ScanCommand({
    TableName: GAMES_TABLE,
    FilterExpression: 'attribute_not_exists(endedAt) AND userId <> :uid AND contains(#data, :linkedId)',
    ExpressionAttributeNames: { '#data': 'data' },
    ExpressionAttributeValues: {
      ':uid': req.userId,
      ':linkedId': req.userId  // userId appears in the JSON data as linkedUserId
    }
  }))

  const games = (result.Items ?? [])
    .map(item => JSON.parse(item.data))
    .filter((g: any) => g.players?.some((p: any) => p.linkedUserId === req.userId))

  res.json(games)
})

router.get('/', async (req: AuthRequest, res) => {
  const result = await ddb.send(new QueryCommand({
    TableName: GAMES_TABLE,
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': req.userId },
    ScanIndexForward: false
  }))
  const games = (result.Items ?? []).map(item => JSON.parse(item.data))
  res.json(games)
})

router.post('/', async (req: AuthRequest, res) => {
  const game = req.body
  await ddb.send(new PutCommand({
    TableName: GAMES_TABLE,
    Item: { id: game.id, userId: req.userId, data: JSON.stringify(game), startedAt: game.startedAt }
  }))
  res.json({ ok: true })
})

router.post('/:id/rounds', async (req: AuthRequest, res) => {
  const existing = await ddb.send(new GetCommand({ TableName: GAMES_TABLE, Key: { id: req.params.id } }))
  if (!existing.Item || existing.Item.userId !== req.userId) {
    res.status(404).json({ error: 'Game not found' }); return
  }
  const game = JSON.parse(existing.Item.data)
  game.rounds.push(req.body)
  await ddb.send(new UpdateCommand({
    TableName: GAMES_TABLE,
    Key: { id: req.params.id },
    UpdateExpression: 'SET #data = :data',
    ExpressionAttributeNames: { '#data': 'data' },
    ExpressionAttributeValues: { ':data': JSON.stringify(game) }
  }))
  res.json({ ok: true })
})

router.post('/:id/end', async (req: AuthRequest, res) => {
  const existing = await ddb.send(new GetCommand({ TableName: GAMES_TABLE, Key: { id: req.params.id } }))
  if (!existing.Item || existing.Item.userId !== req.userId) {
    res.status(404).json({ error: 'Game not found' }); return
  }
  const game = JSON.parse(existing.Item.data)
  game.endedAt = Date.now()
  if (req.body.note) game.note = req.body.note
  await ddb.send(new UpdateCommand({
    TableName: GAMES_TABLE,
    Key: { id: req.params.id },
    UpdateExpression: 'SET #data = :data, endedAt = :endedAt',
    ExpressionAttributeNames: { '#data': 'data' },
    ExpressionAttributeValues: { ':data': JSON.stringify(game), ':endedAt': game.endedAt }
  }))
  res.json({ ok: true })
})

router.delete('/:id', async (req: AuthRequest, res) => {
  const existing = await ddb.send(new GetCommand({ TableName: GAMES_TABLE, Key: { id: req.params.id } }))
  if (!existing.Item || existing.Item.userId !== req.userId) {
    res.status(404).json({ error: 'Game not found' }); return
  }
  await ddb.send(new DeleteCommand({ TableName: GAMES_TABLE, Key: { id: req.params.id } }))
  res.json({ ok: true })
})

export default router
