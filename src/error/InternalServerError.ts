export class InternalServerError extends Error {
  statusCode: number

  constructor(message: string) {
    super(message)
    this.name = 'InternalServerError'
    this.statusCode = 500

    Error.captureStackTrace(this, this.constructor)
  }
}
