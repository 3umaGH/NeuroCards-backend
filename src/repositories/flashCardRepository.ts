import { EntityNotFoundError } from '../error/EntityNotFoundError'
import { InternalServerError } from '../error/InternalServerError'
import { Config } from '../types/config'
import { FlashCardQuiz, QuizTableItem } from '../types/quiz'

import mysql, { ResultSetHeader } from 'mysql2/promise'

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
      .query('SELECT * FROM quizzes WHERE ai_generated = true ORDER BY id DESC')
      .then(([rows, _]) => {
        return (rows as { id: number; topic: string; questions: number }[]).map(row => ({
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
        return (rows as { question: string; answer: string }[]).map((row, index) => ({
          id: index,
          question: row.question,
          answer: row.answer,
        }))
      })

    const quiz = (await this.pool
      .query(`SELECT * FROM quizzes where id = ?`, [id])
      .then(([rows, _]) => (rows as unknown[])[0])) as {
      id: number
      topic: string
      questions: number
      ai_generated: 1 | 0
    }

    if (!quiz || questions.length === 0) {
      throw new EntityNotFoundError(`Quiz with id ${id} does not exist.`)
    }

    const mappedQuiz: FlashCardQuiz = { id: quiz.id, quiz_topic: quiz.topic, questions: questions }

    return mappedQuiz
  }

  saveQuiz = async (quiz: FlashCardQuiz, aiGenerated: boolean) => {
    const connection = await this.pool.getConnection()

    try {
      await connection.beginTransaction()

      const [quizResult] = await connection.query<ResultSetHeader>(
        'INSERT INTO quizzes (topic, questions, ai_generated) VALUES (?, ?, ?)',
        [quiz.quiz_topic, quiz.questions.length, aiGenerated]
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
