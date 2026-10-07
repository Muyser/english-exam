import express from 'express';
import {
  getQuestions,
  createQuestion,
  getDashboardStats,
  updateQuestion,
  bulkUpdateQuestions,
  deleteQuestion,
} from '../controllers/questionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All question management routes require admin authentication
router.get('/',  getQuestions);
router.post('/', protect, createQuestion);
router.get('/stats', protect, getDashboardStats);
router.patch('/bulk', protect, bulkUpdateQuestions);
router.put('/:id', protect, updateQuestion);
router.delete('/:id', protect, deleteQuestion);

export default router;