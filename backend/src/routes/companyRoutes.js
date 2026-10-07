import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getCompanyDashboard, createJob, updateApplicationStatus, scheduleInterview, shortlistApplication } from '../controllers/companyController.js';

const router = express.Router();
router.use(protect);
router.use(authorize('company'));

router.get('/dashboard', getCompanyDashboard);
router.post('/jobs', createJob);
router.put('/applications/:id/status', updateApplicationStatus);
router.post('/interviews', scheduleInterview);
router.put('/applications/:id/shortlist', shortlistApplication);

export default router;
