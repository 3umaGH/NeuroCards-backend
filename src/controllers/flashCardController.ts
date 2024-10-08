import { NextFunction, Request, Response } from 'express'
import { FlashCardService } from '../services/flashCardService'

export class FlashCardController {
  private service: FlashCardService

  constructor(service: FlashCardService) {
    this.service = service
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
      /* todo */
    } catch (err) {
      next(err)
    }
  }
}
