import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, USERS_TABLE } from '../db'
import { signToken } from '../middleware/auth'

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
