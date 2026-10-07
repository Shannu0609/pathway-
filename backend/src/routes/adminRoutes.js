import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getAdminDashboard, getAdminUsers, approveCompany } from '../controllers/adminController.js';

const router = express.Router();
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAdminUsers);
router.patch('/companies/:id/approve', approveCompany);

export default router;
