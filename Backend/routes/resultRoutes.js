import express from 'express';
import {
  createResult,
  getResultPDF,
  getAllResultsPDF,
  getPassedResultsPDF, // <--- New
  getFailedResultsPDF, // <--- New
  getResults,
  getResultById,
  deleteResult,
  deleteAllResults,
} from '../controllers/resultController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createResult);
router.get('/', protect, getResults);

// Dedicated PDF Export Routes
router.get('/export-pdf', protect, getAllResultsPDF);
router.get('/export-passed-pdf', protect, getPassedResultsPDF);
router.get('/export-failed-pdf', protect, getFailedResultsPDF);

// Parameterized Routes
router.get('/:id', protect, getResultById);
router.get('/:id/pdf', protect, getResultPDF);
router.delete('/:id', protect, deleteResult);
router.delete('/', protect, deleteAllResults);

export default router;