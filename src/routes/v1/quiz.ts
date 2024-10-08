import { flashCardController } from '../..'
import express from 'express'

const router = express.Router()

router.get('/:id', flashCardController.getQuizById)
router.get('/', flashCardController.getRecentQuizzes)
router.post('/', flashCardController.createQuiz)

module.exports = router
