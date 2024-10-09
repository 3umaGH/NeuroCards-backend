import { NextFunction, Request, Response } from 'express'
import { BadRequestError } from '../error/BadRequestError'
import { FlashCardService } from '../services/flashCardService'
import { OpenAIService } from '../services/openAiService'

export class FlashCardController {
  private service: FlashCardService
  private openAIService: OpenAIService

  constructor(service: FlashCardService, openAIService: OpenAIService) {
    this.service = service
    this.openAIService = openAIService
  }

  getQuizById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id)

      if (isNaN(id)) {
        throw new BadRequestError('ID must be a number.')
      }

      const result = await this.service.getQuizById(id)
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

        const aiResult = await this.openAIService.generateAIQuiz(req.body.text, req.body.showInList === true)
        res.status(200).json(aiResult)
        return
      }

      throw new BadRequestError('Invalid payload.')
    } catch (err) {
      next(err)
    }
  }
}
