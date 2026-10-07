import express from 'express';
import {
  createResult,
  getResults,
  getResultById,
  deleteResult,
  deleteAllResults,
} from '../controllers/resultController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();


// Public route: Students submit their exam results
router.post('/', createResult);

// All exam result routes are protected by admin authentication
router.get('/', protect, getResults);
router.get('/:id', protect, getResultById);
router.delete('/:id', protect, deleteResult);
router.delete('/', protect, deleteAllResults);

export default router;