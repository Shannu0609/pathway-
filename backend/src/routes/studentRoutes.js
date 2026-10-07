import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getStudentDashboard, getStudentProfile, updateStudentProfile, getStudentRoadmap, updateRoadmapProgress } from '../controllers/studentController.js';

const router = express.Router();
router.use(protect);
router.use(authorize('student'));

router.get('/dashboard', getStudentDashboard);
router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);
router.get('/roadmap', getStudentRoadmap);
router.put('/roadmap/progress', updateRoadmapProgress);

export default router;
