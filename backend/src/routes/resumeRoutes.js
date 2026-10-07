import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/auth.js';
import { uploadResume, getResumeAnalysis } from '../controllers/resumeController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const parseResume = (req, res, next) => upload.single('resume')(req, res, (error) => {
  if (!error) {
    return next();
  }

  const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
  return res.status(status).json({
    message: error.code === 'LIMIT_FILE_SIZE' ? 'Resume must be 5MB or smaller.' : 'Resume upload failed.'
  });
});

router.use(protect);
router.use(authorize('student'));

router.post('/upload', parseResume, uploadResume);
router.get('/analysis', getResumeAnalysis);

export default router;
