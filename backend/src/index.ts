import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { authRouter } from './routes/auth.js'
import { profileRouter } from './routes/profile.js'
import { sessionsRouter } from './routes/sessions.js'
import { eventsRouter } from './routes/events.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }))

app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/auth', authRouter)
app.route('/profile', profileRouter)
app.route('/sessions', sessionsRouter)
app.route('/events', eventsRouter)

const port = Number(process.env.PORT ?? 3001)
console.log(`Server running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })
