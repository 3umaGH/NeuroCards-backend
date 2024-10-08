import { NextFunction, Request, Response } from 'express'
import { FlashCardService } from '../services/flashCardService'
import { OpenAIService } from '../services/openAiService'
import { BadRequestError } from '../error/BadRequestError'

export class FlashCardController {
  private service: FlashCardService
  private openAIService: OpenAIService

  constructor(service: FlashCardService, openAIService: OpenAIService) {
    this.service = service
    this.openAIService = openAIService
  }

  getQuizById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getQuizById(0)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  }

  getRecentQuizzes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getRecentQuizzes()
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  }

  createQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.draft && typeof req.body.draft === 'object') {
        const result = await this.service.createQuiz(req.body.draft)

        res.status(200).json(result)
        return
      }

      if (req.body.text && typeof req.body.text === 'string') {
        // ai creation

        const aiResult = await this.openAIService.generateFlashCards(req.body.text)
        res.status(200).json(aiResult)
        return
      }

      throw new BadRequestError('Invalid payload.')
    } catch (err) {
      next(err)
    }
  }
}
