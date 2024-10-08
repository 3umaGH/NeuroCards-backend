import 'dotenv/config'
import { Config } from './types/config'

export const CONFIG: Config = {
  OPEN_AI_KEY: process.env.OPEN_AI_KEY ?? '',
  MAX_AI_INPUT: 10000,
  MIN_AI_INPUT: 50,

  MIN_QUIZ_TITLE_LENGTH: 8,
  MAX_QUIZ_TITLE_LENGTH: 150,

  MIN_QUESTIONS_IN_QUIZ: 3,
  MAX_QUESTIONS_IN_QUIZ: 30,

  MIN_QUESTION_LENGTH: 3,
  MAX_QUESTION_LENGTH: 150,

  MIN_ANSWER_LENGTH: 3,
  MAX_ANSWER_LENGTH: 300,

  DB: {
    HOST: process.env.DB_HOST ?? '',
    PORT: Number(process.env.DB_PORT ?? 0),
    USER: process.env.DB_USER ?? '',
    PASSWORD: process.env.DB_PASSWORD ?? '',
    DB: process.env.DB_DB ?? '',
  },
}
