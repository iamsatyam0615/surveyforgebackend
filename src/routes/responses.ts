import express from 'express';
import authMiddleware from '../middleware/auth';
import optionalAuth from '../middleware/optionalAuth';
import { submitResponse, getResponses, exportCSV } from '../controllers/responseController';

const router = express.Router();

// Public route for submitting responses (but check for auth token if provided)
router.post('/', optionalAuth, submitResponse);

// Protected routes
router.use(authMiddleware);

router.get('/:surveyId', getResponses);
router.get('/:surveyId/export', exportCSV);

export default router;
