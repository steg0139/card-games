import { Router } from 'express'
import { GetCommand, PutCommand, QueryCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, GAMES_TABLE } from '../db'
import { requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

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
