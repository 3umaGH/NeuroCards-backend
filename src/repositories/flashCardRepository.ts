import { FlashCardQuiz } from '../types/quiz'

export class FlashCardRepository {
  constructor() {}

  getRecentQuizzes = async () => {
    return []
  }

  getQuizById = async (id: number) => {
    return {}
  }

  saveQuiz = async (quiz: FlashCardQuiz) => {
    return true
  }
}
