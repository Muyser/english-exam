import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get and update exam settings (protected by admin authentication)
router.get('/', protect, getSettings);
router.put('/', protect, updateSettings);

export default router;