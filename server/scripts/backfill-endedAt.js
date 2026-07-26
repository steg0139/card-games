// Run with: node scripts/backfill-endedAt.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb')

const client = new DynamoDBClient({ region: 'us-east-2' })
const ddb = DynamoDBDocumentClient.from(client)
const TABLE = 'card-tracker-games'

async function backfill() {
  const result = await ddb.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: 'attribute_not_exists(endedAt)'
  }))

  let fixed = 0
  for (const item of result.Items ?? []) {
    const game = JSON.parse(item.data)
    if (game.endedAt) {
      await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { id: item.id },
        UpdateExpression: 'SET endedAt = :e',
        ExpressionAttributeValues: { ':e': game.endedAt }
      }))
      console.log(`Fixed: ${item.id} (endedAt: ${game.endedAt})`)
      fixed++
    }
  }
  console.log(`Done. Fixed ${fixed} games.`)
}

backfill().catch(console.error)
