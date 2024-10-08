import { FlashCardRepository } from '../repositories/flashCardRepository'

export class FlashCardService {
  private repository: FlashCardRepository

  constructor(repository: FlashCardRepository) {
    this.repository = repository
  }

  getRecentQuizzes = () => {
    return this.repository.getRecentQuizzes()
  }

  getQuizById = (id: number) => {
    return this.repository.getQuizById(id)
  }
}
