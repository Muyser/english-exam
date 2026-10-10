import express from 'express';
import {
  createResult,
  getResults,
  getResultById,
  updateResult,
  deleteResult,
  deleteAllResults,
  getResultPDF,
  getAllResultsPDF,
  getPassedResultsPDF,
  getFailedResultsPDF,
  getAttendancePDF,
} from '../controllers/resultController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createResult);
router.get('/', protect, getResults);

// Export PDF Endpoints (accepts ?startDate=...&endDate=...)
router.get('/export-pdf', protect, getAllResultsPDF);
router.get('/export-passed-pdf', protect, getPassedResultsPDF);
router.get('/export-failed-pdf', protect, getFailedResultsPDF);
router.get('/export-attendance-pdf',protect, getAttendancePDF);

router.get('/:id', protect, getResultById);
router.get('/:id/pdf', protect, getResultPDF);
router.put('/:id', protect, updateResult);
router.delete('/:id', protect, deleteResult);
router.delete('/', protect, deleteAllResults);

export default router;