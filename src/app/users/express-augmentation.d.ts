import type express from 'express'

declare module 'remult' {
  export interface RemultContext {
    request?: express.Request & { session?: any }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    session?: any
  }
}
