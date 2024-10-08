import OpenAI from 'openai'
import { BadRequestError } from '../error/BadRequestError'
import { InternalServerError } from '../error/InternalServerError'
import { FlashCardRepository } from '../repositories/flashCardRepository'
import { AIError, QuizAIResponse } from '../types/ai'
import { FlashCardQuiz } from '../types/quiz'
import { Config } from '../types/config'

export class OpenAIService {
  private repository: FlashCardRepository
  private openAI: OpenAI
  private config: Config

  constructor(repository: FlashCardRepository, config: Config) {
    this.repository = repository
    this.openAI = new OpenAI({ apiKey: config.OPEN_AI_KEY })
    this.config = config
  }

  generateFlashCards = async (input: string) => {
    if (input.length < this.config.MIN_AI_INPUT || input.length > this.config.MAX_AI_INPUT) {
      throw new BadRequestError(
        `Invalid input length. Provide between ${this.config.MIN_AI_INPUT}-${this.config.MAX_AI_INPUT} chars.`
      )
    }

    const completion = await this.openAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: [
            {
              text:
                'Convert user-submitted text into flashcards and handle inappropriate content or text that cannot be turned into flash cards. The flash cards are used to train memory, so do questions in a format that favors remembering information.\n\nThe age limit is 14, so light swearing can be appropriate. You can create flash cards in any supported language.\n\nTry to create from at least 10 flash cards for smaller input, to 30 for bigger input (maximum is about 5000 characters).\n\nEnsure that the flashcards are created with questions and answers formatted in a JSON structure. In answers property, add b[ in front of and ]b at the end of he important words. Identify any aggressive, unethical, or harmful content and handle it by providing an error message.\n\n# Steps\n\n1. **Identify Quiz Topic**: Analyze the user-submitted text to determine a general name with length of between ' +
                this.config.MIN_QUIZ_TITLE_LENGTH +
                ' to ' +
                this.config.MAX_QUIZ_TITLE_LENGTH +
                'for the questions, which will be used as the `qt`.\n2. **Extract Questions and Answers**: \n   - Parse the text to identify distinct questions and their corresponding answers.\n   - Each should be represented as a pair in the JSON structure.\n3. **Content Filtering**: \n   - Scan the content for any aggressive, unethical, or harmful data.\n   - If such content is detected, prepare an error message without creating flashcards.\n4. **Format Output**: \n   - If content is appropriate, structure the extracted data into the specified JSON format for flashcards.\n\n# Output Format\n\n- **For valid content**:\n  ```json\n  {\n    "qt": "string",\n    "q": [\n      {"q": "string", "a": "string"}\n    ]\n  }\n  ```\n- **For inappropriate content / text that cannot be turned into flash card**:\n  ```json\n  {\n    "e": "string"\n  }\n  ```\n\n# Examples\n\n**Example 1: Appropriate Content**\n\n_Input_: "The capital of France? Paris."\n\n_Output_:\n```json\n{\n  "qt": "General Knowledge",\n  "q": [\n    {"q": "The capital of France?", "a": "The capital of France is b[Paris]b"}\n  ]\n}\n```\n\n**Example 2: Inappropriate Content**\n\n_Input_: Aggressive or unethical statement.\n\n_Output_:\n```json\n{\n  "e": "Inappropriate content detected. Flashcards cannot be created."\n}\n```\n\n**Example 3: Content that cannot be turned into flash cards**\n\n_Input_: Random gibberish, spam, or low value text and its impossible to create at least ' +
                this.config.MIN_QUESTIONS_IN_QUIZ +
                ' cards, but no more than' +
                this.config.MAX_QUESTIONS_IN_QUIZ +
                '.\n\n_Output_:\n```json\n{\n  "e": "This content does not contain enough information. Flashcards cannot be created."\n}\n```\n\n# Notes\n\n- Be vigilant about filtering content to ensure that no harmful data is passed through to the flashcard creation stage.\n- The `quiz_topic` should be a broad category reflecting the general theme of the provided questions and answers.',
              type: 'text',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: input,
            },
          ],
        },
      ],
      temperature: 1,
      max_completion_tokens: 6000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: {
        type: 'json_object',
      },
    })

    const result: Partial<QuizAIResponse | AIError> = JSON.parse(completion.choices[0].message.content ?? '')

    // It's an error
    if ('e' in result && result.e && typeof result.e === 'string') {
      throw new BadRequestError(result.e)
    }

    // Double check the return type
    if ('qt' in result && typeof result.qt === 'string' && 'q' in result && Array.isArray(result.q)) {
      const array = result.q
      const newQuiz: FlashCardQuiz = { id: -1, quiz_topic: result.qt, questions: [] }

      array.forEach(question => {
        if (newQuiz.questions.length > this.config.MAX_QUESTIONS_IN_QUIZ) {
          return
        }

        if (typeof question.q === 'string' && typeof question.a === 'string') {
          if (
            question.q.length > this.config.MAX_QUESTION_LENGTH ||
            question.q.length < this.config.MIN_QUESTION_LENGTH
          ) {
            return
          }

          if (
            question.a.length > this.config.MAX_ANSWER_LENGTH ||
            question.a.length < this.config.MIN_QUESTION_LENGTH
          ) {
            return
          }

          newQuiz.questions.push({ id: newQuiz.questions.length, question: question.q, answer: question.a })
        }
      })

      if (newQuiz.questions.length < this.config.MIN_QUESTIONS_IN_QUIZ) {
        throw new InternalServerError(
          `OpenAI returned quiz with less than ${this.config.MIN_QUESTIONS_IN_QUIZ} valid flash cards.`
        )
      }

      return await this.repository.saveQuiz(newQuiz)
    }

    throw new InternalServerError(`AI returned quiz in an unexpected format. Result: ${JSON.stringify(result)}`)
  }
}
