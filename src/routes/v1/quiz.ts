import { flashCardController, quizSubmitLimiter } from '../..'
import express from 'express'

const router = express.Router()

router.get('/:id', flashCardController.getQuizById)
router.get('/', flashCardController.getRecentQuizzes)
router.post('/', quizSubmitLimiter, flashCardController.createQuiz)

module.exports = router
