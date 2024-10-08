import { Request } from 'express'

export const getRequestIPAddr = (req: Request) => {
  return req.ip || req.socket.remoteAddress
}
