import cors from 'cors'
import express, { Request, Response } from 'express'
import { CONFIG } from './config'
import { FlashCardController } from './controllers/flashCardController'
import { errorHandler } from './middleware/errorHandler'
import { FlashCardRepository } from './repositories/flashCardRepository'
import { FlashCardService } from './services/flashCardService'
import { OpenAIService } from './services/openAiService'
import { rateLimit } from 'express-rate-limit'

const app = express()
const port = 3000

app.use(express.json())

app.use(
  cors({
    origin: '*',
    optionsSuccessStatus: 200,
  })
)

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 100 requests per minute
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

export const quizSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 requests per 15 minutes.
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

export const flashCardRepository = new FlashCardRepository(CONFIG)
export const openAIService = new OpenAIService(flashCardRepository, CONFIG)
export const flashCardService = new FlashCardService(flashCardRepository, CONFIG)
export const flashCardController = new FlashCardController(flashCardService, openAIService)

app.use('/v1/quiz', generalLimiter, require('./routes/v1/quiz'))
app.use('/v1/config', generalLimiter, require('./routes/v1/config'))

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
