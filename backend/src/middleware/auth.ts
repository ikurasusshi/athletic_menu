import { createMiddleware } from 'hono/factory'
import jwt from 'jsonwebtoken'

type Variables = {
  userId: string
}

export const authMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    c.set('userId', payload.userId)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})
