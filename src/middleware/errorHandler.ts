import { NextFunction, Response, Request } from 'express'
import { BadRequestError } from '../error/BadRequestError'
import { EntityNotFoundError } from '../error/EntityNotFoundError'
import { InternalServerError } from '../error/InternalServerError'
import { getRequestIPAddr } from '../util/util'

export const errorHandler = (err: Error, req: Request, res: Response, _: NextFunction) => {
  const ignoredErrors = [BadRequestError, EntityNotFoundError]
  const timestamp = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`

  let statusCode = 500

  if ('statusCode' in err) {
    statusCode = err.statusCode as number
  }

  if (!ignoredErrors.some(ignored => err instanceof ignored)) {
    console.error(
      `[${timestamp}]`,
      `${err.name}:`,
      err.message,
      `
    Status: ${statusCode} | URL: ${req.url} (Method: ${req.method})
    IP: ${getRequestIPAddr(req)}

    Body: ${JSON.stringify(req.body)} | Stack: ${err.stack}
    ------------------------------------------------
    `
    )
  }

  if (err instanceof InternalServerError) {
    res.status(statusCode).json({ ...err, message: 'Something unexpected happened, please try again later' })
  } else {
    res.status(statusCode).json({ ...err, message: err.message })
  }
}
