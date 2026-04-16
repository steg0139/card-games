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
    FilterExpression: 'contains(usernameLower, :q) OR contains(username, :qOrig) OR contains(username, :qLower)',
    ExpressionAttributeValues: { ':q': qLower, ':qOrig': q, ':qLower': qLower },
    ProjectionExpression: 'id, username',
    Limit: 20
  }))

  // Deduplicate by id
  const seen = new Set<string>()
  const items = (result.Items ?? []).filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })

  res.json(items)
})

export default router
