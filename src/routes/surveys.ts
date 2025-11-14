import express from 'express';
import authMiddleware from '../middleware/auth';
import optionalAuth from '../middleware/optionalAuth';
import { 
  createSurvey, 
  getSurveys, 
  getSurvey, 
  updateSurvey, 
  deleteSurvey,
  getPublicSurvey
} from '../controllers/surveyController';

const router = express.Router();

// Public route for taking surveys (accepts token optionally)
router.get('/public/:id', optionalAuth, getPublicSurvey);

// Protected routes
router.use(authMiddleware);

router.post('/', createSurvey);
router.get('/', getSurveys);
router.get('/:id', getSurvey);
router.put('/:id', updateSurvey);
router.delete('/:id', deleteSurvey);

export default router;
