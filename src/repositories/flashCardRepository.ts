import mysql, { ResultSetHeader } from 'mysql2/promise'
import { EntityNotFoundError } from '../error/EntityNotFoundError'
import { InternalServerError } from '../error/InternalServerError'
import { Config } from '../types/config'
import { FlashCardQuiz, QuizTableItem } from '../types/quiz'

type RecentQuizzesQueryRes = { id: number; topic: string; questions: number }[]
type QuestionsQueryRes = { question: string; answer: string }[]
type QuizQueryRes = {
  id: number
  topic: string
  questions: number
  ai_generated: 1 | 0
}

export class FlashCardRepository {
  private pool: mysql.Pool

  constructor(config: Config) {
    this.pool = mysql.createPool({
      connectionLimit: 10,
      host: config.DB.HOST,
      port: config.DB.PORT,
      user: config.DB.USER,
      password: config.DB.PASSWORD,
      database: config.DB.DB,
    })
  }

  getRecentQuizzes = async (): Promise<QuizTableItem[]> => {
    return this.pool
      .query('SELECT * FROM quizzes WHERE list_visible = true ORDER BY id DESC LIMIT 200')
      .then(([rows, _]) => {
        return (rows as RecentQuizzesQueryRes).map(row => ({
          id: row.id,
          quiz_topic: row.topic,
          questions_amount: row.questions,
        }))
      })
      .catch(err => {
        throw new InternalServerError(err)
      })
  }

  getQuizById = async (id: number) => {
    const questions = await this.pool
      .query(`SELECT * FROM quiz_questions WHERE quiz_id = ?`, [id])
      .then(([rows, _]) => {
        return (rows as QuestionsQueryRes).map((row, index) => ({
          id: index,
          question: row.question,
          answer: row.answer,
        }))
      })

    const quiz = await this.pool
      .query(`SELECT * FROM quizzes where id = ?`, [id])
      .then(([rows, _]) => (rows as QuizQueryRes[])[0])

    if (!quiz || questions.length === 0) {
      throw new EntityNotFoundError(`Quiz with id ${id} does not exist.`)
    }

    const mappedQuiz: FlashCardQuiz = { id: quiz.id, quiz_topic: quiz.topic, questions: questions }
    return mappedQuiz
  }

  saveQuiz = async (quiz: FlashCardQuiz, list_visible: boolean) => {
    const connection = await this.pool.getConnection()

    try {
      await connection.beginTransaction()

      const [quizResult] = await connection.query<ResultSetHeader>(
        'INSERT INTO quizzes (topic, questions, list_visible) VALUES (?, ?, ?)',
        [quiz.quiz_topic, quiz.questions.length, list_visible]
      )

      const quizId = quizResult.insertId

      const questionInsertPromises = quiz.questions.map(q =>
        connection.query('INSERT INTO quiz_questions (quiz_id, question, answer) VALUES (?, ?, ?)', [
          quizId,
          q.question,
          q.answer,
        ])
      )

      await Promise.all(questionInsertPromises)
      await connection.commit()

      return { ...quiz, id: quizId }
    } catch (error) {
      await connection.rollback()
      throw new InternalServerError(error instanceof Error ? error.message : 'Unknown Error')
    } finally {
      connection.release()
    }
  }
}
