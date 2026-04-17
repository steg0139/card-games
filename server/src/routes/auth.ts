import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, USERS_TABLE } from '../db'
import { signToken, requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()

router.post('/register', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' })
    return
  }
  const existing = await ddb.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: 'username-index',
    KeyConditionExpression: 'username = :u',
    ExpressionAttributeValues: { ':u': username }
  }))
  if (existing.Items?.length) {
    res.status(409).json({ error: 'Username already taken' })
    return
  }
  const id = randomUUID()
  const passwordHash = await bcrypt.hash(password, 10)
  await ddb.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: { id, username, usernameLower: username.toLowerCase(), passwordHash, createdAt: Date.now() }
  }))
  res.json({ id, username, token: signToken(id) })
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const result = await ddb.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: 'username-index',
    KeyConditionExpression: 'username = :u',
    ExpressionAttributeValues: { ':u': username }
  }))
  const user = result.Items?.[0] as { id: string; username: string; passwordHash: string; usernameLower?: string } | undefined
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  // Backfill usernameLower for existing users
  if (!user.usernameLower) {
    await ddb.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: user.id },
      UpdateExpression: 'SET usernameLower = :ul',
      ExpressionAttributeValues: { ':ul': user.username.toLowerCase() }
    }))
  }
  res.json({ id: user.id, username: user.username, token: signToken(user.id) })
})

export default router

// Update username
router.put('/username', requireAuth, async (req: AuthRequest, res) => {
  const { username } = req.body
  if (!username?.trim()) { res.status(400).json({ error: 'Username required' }); return }
  const existing = await ddb.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: 'username-index',
    KeyConditionExpression: 'username = :u',
    ExpressionAttributeValues: { ':u': username }
  }))
  if (existing.Items?.length) { res.status(409).json({ error: 'Username already taken' }); return }
  await ddb.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { id: req.userId },
    UpdateExpression: 'SET username = :u, usernameLower = :ul',
    ExpressionAttributeValues: { ':u': username, ':ul': username.toLowerCase() }
  }))
  res.json({ username })
})

// Update password
router.put('/password', requireAuth, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) { res.status(400).json({ error: 'Both passwords required' }); return }
  const result = await ddb.send(new GetCommand({ TableName: USERS_TABLE, Key: { id: req.userId } }))
  const user = result.Item as { passwordHash: string } | undefined
  if (!user) { res.status(404).json({ error: 'User not found' }); return }
  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) { res.status(401).json({ error: 'Current password is incorrect' }); return }
  const passwordHash = await bcrypt.hash(newPassword, 10)
  await ddb.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { id: req.userId },
    UpdateExpression: 'SET passwordHash = :h',
    ExpressionAttributeValues: { ':h': passwordHash }
  }))
  res.json({ ok: true })
})
