export type QuizAIResponse = {
  qt: string
  q: { q: string; a: string }[]
}

export type AIError = {
  e: string
}
