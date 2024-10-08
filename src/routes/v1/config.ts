import express, { NextFunction, Request, Response } from 'express'
import { CONFIG } from '../../config'
import { ConfigDTO } from '../../types/config'

const router = express.Router()

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  const {
    MAX_AI_INPUT,
    MIN_AI_INPUT,
    MIN_QUIZ_TITLE_LENGTH,
    MAX_QUIZ_TITLE_LENGTH,
    MIN_QUESTIONS_IN_QUIZ,
    MAX_QUESTIONS_IN_QUIZ,
    MIN_QUESTION_LENGTH,
    MAX_QUESTION_LENGTH,
    MIN_ANSWER_LENGTH,
    MAX_ANSWER_LENGTH,
  } = CONFIG

  const dto: ConfigDTO = {
    MAX_AI_INPUT,
    MIN_AI_INPUT,
    MIN_QUIZ_TITLE_LENGTH,
    MAX_QUIZ_TITLE_LENGTH,
    MIN_QUESTIONS_IN_QUIZ,
    MAX_QUESTIONS_IN_QUIZ,
    MIN_QUESTION_LENGTH,
    MAX_QUESTION_LENGTH,
    MIN_ANSWER_LENGTH,
    MAX_ANSWER_LENGTH,
  }

  res.status(200).json(dto)
})

module.exports = router
