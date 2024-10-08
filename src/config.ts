import 'dotenv/config'

export const CONFIG = {
  OPEN_AI_KEY: process.env.OPEN_AI_KEY ?? '',
  MAX_AI_INPUT: 10000,
  MIN_AI_INPUT: 50,
}
