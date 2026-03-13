import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'
import { authMiddleware } from '../middleware/auth.js'

const prisma = new PrismaClient()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MOCK_MENU = `
1. ウォームアップ（15分）
- ジョグ 800m
- 動的ストレッチ（レッグスウィング・ヒップサークル各10回）
- 流し 60m × 3本

2. メインメニュー
- 200m × 4本（レスト 3分・強度 80%）
- 300m × 2本（レスト 5分・強度 85%）

3. クールダウン（10分）
- 軽いジョグ 400m
- 静的ストレッチ（大腿四頭筋・ハムストリング各30秒）

4. 本日のアドバイス
[モック] これはモックレスポンスです。USE_MOCK_AI=false にすると Claude API を使用します。
`.trim()

export const sessionsRouter = new Hono()
sessionsRouter.use('*', authMiddleware)

const conditionSchema = z.object({
  motivation: z.number().int().min(1).max(5),
  muscleSoreness: z.record(z.enum(['NONE', 'MILD', 'SEVERE'])),
  injuryStatus: z.array(z.object({ part: z.string(), detail: z.string() })),
  goalCommitment: z.number().int().min(1).max(5),
})

sessionsRouter.post('/', zValidator('json', conditionSchema), async (c) => {
  const userId = c.get('userId')
  const condition = c.req.valid('json')

  const profile = await prisma.profile.findUnique({ where: { userId } })
  if (!profile) return c.json({ error: 'Profile not found. Please set up your profile first.' }, 400)

  let generatedMenu: string
  if (process.env.USE_MOCK_AI === 'true') {
    generatedMenu = MOCK_MENU
  } else {
    const prompt = buildPrompt(profile, condition)
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    generatedMenu = message.content[0].type === 'text' ? message.content[0].text : ''
  }

  const session = await prisma.trainingSession.create({
    data: {
      userId,
      motivation: condition.motivation,
      muscleSoreness: condition.muscleSoreness,
      injuryStatus: condition.injuryStatus,
      goalCommitment: condition.goalCommitment,
      generatedMenu,
    },
  })

  return c.json(session, 201)
})

sessionsRouter.get('/', async (c) => {
  const userId = c.get('userId')
  const sessions = await prisma.trainingSession.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    select: { id: true, date: true, motivation: true, goalCommitment: true, createdAt: true },
  })
  return c.json(sessions)
})

sessionsRouter.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const session = await prisma.trainingSession.findFirst({ where: { id, userId } })
  if (!session) return c.json({ error: 'Not found' }, 404)
  return c.json(session)
})

function buildPrompt(profile: { event: string; age: number; gender: string; targetRecord: string | null; personalBest: string | null }, condition: z.infer<typeof conditionSchema>): string {
  const eventMap: Record<string, string> = {
    SHORT: '短距離（100〜400m）',
    MIDDLE_LONG: '中長距離（800m〜）',
    JUMP: '跳躍',
    THROW: '投擲',
  }

  const sorenessText = Object.entries(condition.muscleSoreness)
    .map(([part, level]) => `${part}: ${level}`)
    .join(', ')

  const injuryText = condition.injuryStatus.length > 0
    ? condition.injuryStatus.map((i) => `${i.part}（${i.detail}）`).join(', ')
    : 'なし'

  return `あなたは陸上競技のコーチです。以下の選手情報とコンディションに基づき、本日のトレーニングメニューを作成してください。

【選手情報】
- 種目: ${eventMap[profile.event] ?? profile.event}
- 年齢: ${profile.age}歳
- 性別: ${profile.gender}
- 目標記録: ${profile.targetRecord ?? '未設定'}
- 自己ベスト: ${profile.personalBest ?? '未設定'}

【本日のコンディション】
- モチベーション: ${condition.motivation}/5
- 目標へのコミット度: ${condition.goalCommitment}/5
- 筋肉痛: ${sorenessText}
- 怪我・痛み: ${injuryText}

【出力形式】
以下の構成でメニューを作成してください：
1. ウォームアップ（内容・時間）
2. メインメニュー（種目・セット数・回数または距離・レスト時間・負荷強度）
3. クールダウン（内容・時間）
4. 本日のアドバイス（コンディションに応じた注意点）`
}
