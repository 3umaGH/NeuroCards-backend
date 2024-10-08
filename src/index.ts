import express, { Request, Response } from 'express'
import { FlashCardController } from './controllers/flashCardController'
import { errorHandler } from './middleware/errorHandler'
import { FlashCardRepository } from './repositories/flashCardRepository'
import { FlashCardService } from './services/flashCardService'
import cors from 'cors'

const app = express()
const port = 3000

app.use(express.json())
app.use(errorHandler)

app.use(
  cors({
    origin: '*',
    optionsSuccessStatus: 200,
  })
)

export const flashCardRepository = new FlashCardRepository()
export const flashCardService = new FlashCardService(flashCardRepository)
export const flashCardController = new FlashCardController(flashCardService)

app.use('/v1/quiz', require('./routes/v1/quiz'))

app.get('*', (req: Request, res: Response) => {
  res.status(404).json({
    name: 'EntityNotFoundError',
    statusCode: 404,
    message: 'Invalid Path',
  })
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
