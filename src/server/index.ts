import compression from 'compression'
import session from 'cookie-session'
import express from 'express'
import fs from 'fs'
import helmet from 'helmet'
import sslRedirect from 'heroku-ssl-redirect'
import path from 'path'
import { api } from './api'
import { processIncomingWebhook, sendMessage } from './wapp'
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

  // WhatsApp webhook endpoint - receives incoming messages from Green API
  app.post('/api/wapp/received', api.withRemult, express.json(), async (req, res) => {
    const { key } = req.query

    // Validate API key
    if (key !== process.env['SERVER_API_KEY']) {
      console.log('[WAPP] Unauthorized webhook request', key, process.env['SERVER_API_KEY'])
      return res.status(401).send('Unauthorized')
    }

    console.log('[WAPP] Webhook received:', JSON.stringify(req.body))

    try {
      await processIncomingWebhook(req.body)
      return res.status(200).send('OK')
    } catch (error) {
      console.error('[WAPP] Webhook error:', error)
      return res.status(500).send('Error')
    }
  })

  // Send WhatsApp message endpoint (for testing/manual sends)
  app.post('/api/wapp/send', api.withRemult, express.json(), async (req, res) => {
    const { key } = req.query

    // Validate API key
    if (key !== process.env['SERVER_API_KEY']) {
      console.log('[WAPP] Unauthorized send request')
      return res.status(401).send('Unauthorized')
    }

    const { phone, message } = req.body

    if (!phone || !message) {
      return res.status(400).json({ error: 'phone and message are required' })
    }

    try {
      const result = await sendMessage(phone, message)
      if (result) {
        return res.status(200).json(result)
      } else {
        return res.status(500).json({ error: 'Failed to send message' })
      }
    } catch (error) {
      console.error('[WAPP] Send error:', error)
      return res.status(500).json({ error: 'Send failed' })
    }
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
