import compression from 'compression'
import session from 'cookie-session'
import express from 'express'
import fs from 'fs'
import helmet from 'helmet'
import sslRedirect from 'heroku-ssl-redirect'
import path from 'path'
import { api } from './api'
// import './express-session'

async function startup() {
  const app = express()
  app.use(sslRedirect())
  app.use(
    '/api',
    session({
      secret:
        process.env['NODE_ENV'] === 'production'
          ? process.env['SESSION_SECRET']!
          : process.env['SESSION_SECRET_DEV'] || 'construction-secret-dev-key',
      maxAge: 365 * 24 * 60 * 60 * 1000,
    })
  )
  app.use(compression())
  app.use(helmet({ contentSecurityPolicy: false }))

  app.use(api)

  app.post('/api/wapp/received', (req, res) => {
    const { key } = req.query
    console.log('webhook-key', key)
    if (!(key === process.env['SERVER_API_KEY'])) {
      console.log('Un-Autorized request received.')
    }
    console.log('webhook-body', JSON.stringify(req.body))
    return res.status(200).send('TX')
  })

  let dist = path.resolve('dist/construction/browser')
  if (!fs.existsSync(dist)) {
    dist = path.resolve('../construction/browser')
  }
  app.use(express.static(dist))
  app.use('/*', async (req, res) => {
    if (req.headers.accept?.includes('json')) {
      console.log(req)
      res.status(404).json('missing route: ' + req.originalUrl)
      return
    }
    try {
      res.sendFile(dist + '/index.html')
    } catch (err) {
      res.sendStatus(500)
    }
  })
  let port = process.env['PORT'] || 3002
  app.listen(port)
}
startup()
