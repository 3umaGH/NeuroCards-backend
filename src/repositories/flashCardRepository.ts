import { mockQuiz, mockQuizListItems } from '../constants/mocks'
import { FlashCardQuiz } from '../types/quiz'

export class FlashCardRepository {
  constructor() {}

  getRecentQuizzes = async () => {
    return mockQuizListItems
  }

  getQuizById = async (id: number) => {
    return mockQuiz
  }

  saveQuiz = async (quiz: FlashCardQuiz) => {
    return true
  }
}
