import { NextFunction, Request, Response } from 'express'
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
      if (req.body.draft) {
        // manual creation
        //todo: validation
      }

      if (req.body.text) {
        // ai creation

        const aiResult = await this.openAIService.generateFlashCards(req.body.text)
        res.status(200).json(aiResult)
      }
    } catch (err) {
      next(err)
    }
  }
}
