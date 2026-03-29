import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'us-east-1' })
export const ddb = DynamoDBDocumentClient.from(client)

export const USERS_TABLE = process.env.USERS_TABLE ?? 'card-tracker-users'
export const GAMES_TABLE = process.env.GAMES_TABLE ?? 'card-tracker-games'
