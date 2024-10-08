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

    console.log('MySQL Connected.')
  }

  getRecentQuizzes = async (): Promise<QuizTableItem[]> => {
    return this.pool
      .query('SELECT * FROM quizzes ORDER BY id DESC')
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
    return this.pool
      .query(
        `SELECT 
          quizzes.id,
          quizzes.topic,
          GROUP_CONCAT(quiz_questions.question ORDER BY quiz_questions.id) AS questions,
          GROUP_CONCAT(quiz_questions.answer ORDER BY quiz_questions.id) AS answers
          FROM quizzes
          JOIN quiz_questions ON quizzes.id = quiz_questions.quiz_id
          WHERE quizzes.id = ?
          GROUP BY quizzes.id;`,
        [id]
      )
      .then(([rows, _]) => {
        const row = (
          rows as {
            id: number
            topic: string
            questions: string
            answers: string
          }[]
        )[0]

        if (!row) {
          throw new EntityNotFoundError(`Quiz with id ${id} does not exist.`)
        }

        const questionsArray = row.questions.split(',')
        const answersArray = row.answers.split(',')
        const mappedQuestions = questionsArray.map((question, index) => ({
          id: index,
          question,
          answer: answersArray[index],
        }))

        const quiz: FlashCardQuiz = { id: row.id, quiz_topic: row.topic, questions: mappedQuestions }

        return quiz
      })
      .catch(err => {
        throw new InternalServerError(err)
      })
  }

  saveQuiz = async (quiz: FlashCardQuiz) => {
    const connection = await this.pool.getConnection()

    try {
      await connection.beginTransaction()

      const [quizResult] = await connection.query<ResultSetHeader>(
        'INSERT INTO quizzes (topic,questions) VALUES (?,?)',
        [quiz.quiz_topic, quiz.questions.length]
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
