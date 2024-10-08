import cors from 'cors'
import express, { Request, Response } from 'express'
import { CONFIG } from './config'
import { FlashCardController } from './controllers/flashCardController'
import { errorHandler } from './middleware/errorHandler'
import { FlashCardRepository } from './repositories/flashCardRepository'
import { FlashCardService } from './services/flashCardService'
import { OpenAIService } from './services/openAiService'

const app = express()
const port = 3000

app.use(express.json())

app.use(
  cors({
    origin: '*',
    optionsSuccessStatus: 200,
  })
)

export const flashCardRepository = new FlashCardRepository()
export const openAIService = new OpenAIService(CONFIG.OPEN_AI_KEY)
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

app.use(errorHandler)
