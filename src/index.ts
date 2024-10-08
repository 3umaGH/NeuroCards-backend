import express from 'express'
import { FlashCardController } from './controllers/flashCardController'
import { FlashCardRepository } from './repositories/flashCardRepository'
import { FlashCardService } from './services/flashCardService'
const app = express()
const port = 3000

app.use(express.json())

export const flashCardRepository = new FlashCardRepository()
export const flashCardService = new FlashCardService(flashCardRepository)
export const flashCardController = new FlashCardController(flashCardService)

app.use('/v1/quiz', require('./routes/v1/quiz'))

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
