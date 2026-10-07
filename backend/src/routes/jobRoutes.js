import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getJobs, getJobById, applyToJob, getJobMatches } from '../controllers/jobController.js';

const router = express.Router();

router.get('/', getJobs);
router.get('/matches', protect, authorize('student'), getJobMatches);
router.get('/:id', getJobById);
router.post('/:id/apply', protect, authorize('student'), applyToJob);

export default router;
