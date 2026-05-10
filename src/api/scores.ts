import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, SCORES_TABLE } from '#/lib/dynamodb'
import type { HistoryEntry } from '#/routes/games/nfl/dartsai/HistoryCard'

export interface ScoreRecord {
  sport: string
  id: string
  entrantName: string
  finalScore: number
  throwsUsed: number
  history: HistoryEntry[]
  categories: string[]
  createdAt: string
}

export async function saveScoreRecord(record: Omit<ScoreRecord, 'id' | 'createdAt'>): Promise<void> {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  await dynamo.send(
    new PutCommand({
      TableName: SCORES_TABLE,
      Item: {
        sport: record.sport,
        id,
        entrantName: record.entrantName,
        finalScore: record.finalScore,
        throwsUsed: record.throwsUsed,
        history: JSON.stringify(record.history),
        categories: record.categories,
        createdAt,
      },
    }),
  )
}

export async function getLeaderboard(sport: string, limit = 50): Promise<ScoreRecord[]> {
  const res = await dynamo.send(
    new QueryCommand({
      TableName: SCORES_TABLE,
      KeyConditionExpression: 'sport = :sport',
      ExpressionAttributeValues: { ':sport': sport },
      Limit: limit,
      ScanIndexForward: false,
    }),
  )
  const items = (res.Items ?? []) as Array<Record<string, unknown>>
  return items
    .map((item) => ({
      sport: item['sport'] as string,
      id: item['id'] as string,
      entrantName: item['entrantName'] as string,
      finalScore: item['finalScore'] as number,
      throwsUsed: item['throwsUsed'] as number,
      history: JSON.parse(item['history'] as string) as HistoryEntry[],
      categories: item['categories'] as string[],
      createdAt: item['createdAt'] as string,
    }))
    .sort((a, b) => {
      if (a.throwsUsed !== b.throwsUsed) return a.throwsUsed - b.throwsUsed
      return Math.abs(a.finalScore) - Math.abs(b.finalScore)
    })
}
