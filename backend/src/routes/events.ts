import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const prisma = new PrismaClient()
export const eventsRouter = new Hono()

eventsRouter.use('*', authMiddleware)

const eventSchema = z.object({
  name: z.string().min(1),
  date: z.string().datetime(),
})

eventsRouter.get('/', async (c) => {
  const userId = c.get('userId')
  const events = await prisma.competitionEvent.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  })
  return c.json(events)
})

eventsRouter.post('/', zValidator('json', eventSchema), async (c) => {
  const userId = c.get('userId')
  const { name, date } = c.req.valid('json')
  const event = await prisma.competitionEvent.create({
    data: { userId, name, date: new Date(date) },
  })
  return c.json(event, 201)
})

eventsRouter.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  await prisma.competitionEvent.deleteMany({ where: { id, userId } })
  return c.json({ success: true })
})
