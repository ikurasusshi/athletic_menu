import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const prisma = new PrismaClient()
export const profileRouter = new Hono()

profileRouter.use('*', authMiddleware)

const profileSchema = z.object({
  event: z.enum(['SHORT', 'MIDDLE_LONG', 'JUMP', 'THROW']),
  age: z.number().int().min(1).max(120),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  targetRecord: z.string().optional(),
  personalBest: z.string().optional(),
})

profileRouter.get('/', async (c) => {
  const userId = c.get('userId')
  const profile = await prisma.profile.findUnique({ where: { userId } })
  if (!profile) return c.json({ error: 'Profile not found' }, 404)
  return c.json(profile)
})

profileRouter.put('/', zValidator('json', profileSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  const profile = await prisma.profile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  })
  return c.json(profile)
})
