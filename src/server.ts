import { MastraServer } from '@mastra/hono'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import mastra from './mastra'

const app = new Hono()

app.use('*', cors())

const mastraServer = new MastraServer({
  mastra,
  app,
})

await mastraServer.init()

export default app