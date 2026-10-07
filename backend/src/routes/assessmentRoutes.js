import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { createAssessment, getAssessments, submitAssessment, getAssessmentResults } from '../controllers/assessmentController.js';

const router = express.Router();

router.use(protect);
router.post('/', authorize('company', 'admin'), createAssessment);
router.get('/', getAssessments);
router.post('/:id/submit', authorize('student'), submitAssessment);
router.get('/results', authorize('student'), getAssessmentResults);

export default router;
