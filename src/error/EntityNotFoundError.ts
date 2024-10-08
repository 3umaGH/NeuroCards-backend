export class EntityNotFoundError extends Error {
  statusCode: number

  constructor(message: string) {
    super(message)
    this.name = 'EntityNotFoundError'
    this.statusCode = 404

    Error.captureStackTrace(this, this.constructor)
  }
}
