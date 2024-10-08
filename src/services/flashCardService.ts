import { BadRequestError } from '../error/BadRequestError'
import { FlashCardRepository } from '../repositories/flashCardRepository'
import { Config } from '../types/config'
import { FlashCardQuiz, FlashCardQuizDraft } from '../types/quiz'

export class FlashCardService {
  private repository: FlashCardRepository
  private config: Config

  constructor(repository: FlashCardRepository, config: Config) {
    this.repository = repository
    this.config = config
  }

  createQuiz = async (draft: FlashCardQuizDraft) => {
    if (
      !draft.quiz_topic ||
      typeof draft.quiz_topic !== 'string' ||
      !draft.questions ||
      !Array.isArray(draft.questions)
    ) {
      throw new BadRequestError('Invalid Draft')
    }

    if (
      draft.quiz_topic.length > this.config.MAX_QUIZ_TITLE_LENGTH ||
      draft.quiz_topic.length < this.config.MIN_QUIZ_TITLE_LENGTH
    ) {
      throw new BadRequestError('Invalid quiz title length.')
    }

    const newQuiz: FlashCardQuiz = { id: -1, quiz_topic: draft.quiz_topic, questions: [] }

    draft.questions.forEach(question => {
      if (newQuiz.questions.length > this.config.MAX_QUESTIONS_IN_QUIZ) {
        return
      }

      if (typeof question.question === 'string' && typeof question.answer === 'string') {
        if (
          question.question.length > this.config.MAX_QUESTION_LENGTH ||
          question.question.length < this.config.MIN_QUESTION_LENGTH
        ) {
          return
        }

        if (
          question.answer.length > this.config.MAX_ANSWER_LENGTH ||
          question.answer.length < this.config.MIN_QUESTION_LENGTH
        ) {
          return
        }

        newQuiz.questions.push({ id: newQuiz.questions.length, question: question.question, answer: question.answer })
      }
    })

    return await this.repository.saveQuiz(newQuiz, false)
  }

  getRecentQuizzes = async () => {
    return await this.repository.getRecentQuizzes()
  }

  getQuizById = async (id: number) => {
    return await this.repository.getQuizById(id)
  }
}
