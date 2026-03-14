import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'
import { authMiddleware } from '../middleware/auth.js'

const prisma = new PrismaClient()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MOCK_MENU = `
1. Warm-up (15 min)
- Easy jog 800m
- Dynamic stretching (leg swings, hip circles — 10 reps each)
- Strides 60m × 3

2. Main Menu
- 200m × 4 reps (rest 3 min / intensity 80%)
- 300m × 2 reps (rest 5 min / intensity 85%)

3. Cool-down (10 min)
- Light jog 400m
- Static stretching (quadriceps, hamstrings — 30 sec each)

4. Today's Advice
[MOCK] This is a mock response. Set USE_MOCK_AI=false to use the Claude API.
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
    SHORT: 'Sprints (100–400m)',
    MIDDLE_LONG: 'Middle/Long Distance (800m+)',
    JUMP: 'Jumps',
    THROW: 'Throws',
  }

  const sorenessText = Object.entries(condition.muscleSoreness)
    .map(([part, level]) => `${part}: ${level}`)
    .join(', ')

  const injuryText = condition.injuryStatus.length > 0
    ? condition.injuryStatus.map((i) => `${i.part} (${i.detail})`).join(', ')
    : 'None'

  return `You are a track and field coach. Based on the athlete information and condition below, create today's training menu.

[Athlete Information]
- Event: ${eventMap[profile.event] ?? profile.event}
- Age: ${profile.age}
- Gender: ${profile.gender}
- Target Record: ${profile.targetRecord ?? 'Not set'}
- Personal Best: ${profile.personalBest ?? 'Not set'}

[Today's Condition]
- Motivation: ${condition.motivation}/5
- Goal Commitment: ${condition.goalCommitment}/5
- Muscle Soreness: ${sorenessText}
- Injury / Pain: ${injuryText}

[Output Format]
Please structure the menu as follows:
1. Warm-up (content and duration)
2. Main Menu (exercise, sets, reps or distance, rest time, intensity)
3. Cool-down (content and duration)
4. Today's Advice (notes based on current condition)`
}
