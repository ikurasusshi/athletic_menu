import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'

config() // .env を手動ロード

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
})
