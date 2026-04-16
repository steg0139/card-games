import { Router } from 'express'
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, USERS_TABLE } from '../db'

const router = Router()

// Public user search by username — returns id + username only (no sensitive data)
router.get('/search', async (req, res) => {
  const q = String(req.query.q ?? '').trim()
  if (q.length < 2) { res.json([]); return }

  const qLower = q.toLowerCase()

  const result = await ddb.send(new ScanCommand({
    TableName: USERS_TABLE,
    FilterExpression: 'contains(usernameLower, :q) OR contains(username, :qOrig)',
    ExpressionAttributeValues: { ':q': qLower, ':qOrig': q },
    ProjectionExpression: 'id, username',
    Limit: 20
  }))

  res.json(result.Items ?? [])
})

export default router
