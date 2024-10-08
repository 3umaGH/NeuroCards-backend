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

    this.pool
      .query('SET SESSION group_concat_max_len = 30000')
      .then(() => {
        console.log('Set group_concat_max_len to 30k')
        console.log('MySQL Connected.')
      })
      .catch(err => {
        console.error('Error setting session variable:', err)
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
    //TODO: This feels like not correct way of doing this, need to look into this later.
    return this.pool
      .query(
        ` SELECT 
          quizzes.id,
          quizzes.topic,
          GROUP_CONCAT(quiz_questions.question SEPARATOR ';---;') AS questions,
          GROUP_CONCAT(quiz_questions.answer SEPARATOR ';---;') AS answers
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

        const questionsArray = row.questions.split(';---;')
        const answersArray = row.answers.split(';---;')

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
