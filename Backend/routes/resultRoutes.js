import express from 'express';
import {
  createResult,
  getResultPDF,
  getAllResultsPDF,
  getResults,
  getResultById,
  deleteResult,
  deleteAllResults,
} from '../controllers/resultController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public route for students
router.post('/', createResult);

// Admin protected routes
router.get('/', protect, getResults);

// CRITICAL: Specific named routes MUST come BEFORE parameterized '/:id' routes!
router.get('/export-pdf', protect, getAllResultsPDF);

// Parameterized routes
router.get('/:id', protect, getResultById);
router.get('/:id/pdf', protect, getResultPDF);
router.delete('/:id', protect, deleteResult);
router.delete('/', protect, deleteAllResults);

export default router;