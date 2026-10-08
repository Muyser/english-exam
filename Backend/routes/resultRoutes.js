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

// Public route
router.post('/', createResult);

// Protected Admin Routes
router.get('/', protect, getResults);
router.get('/export-pdf', protect, getAllResultsPDF); 
router.get('/:id', protect, getResultById);
router.get('/:id/pdf', protect, getResultPDF);
router.delete('/:id', protect, deleteResult);
router.delete('/', protect, deleteAllResults);

export default router;