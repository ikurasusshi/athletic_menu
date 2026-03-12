import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export const authRouter = new Hono()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return c.json({ error: 'Email already in use' }, 409)

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, passwordHash } })

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' })
  return c.json({ token }, 201)
})

authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return c.json({ error: 'Invalid credentials' }, 401)

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401)

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' })
  return c.json({ token })
})
