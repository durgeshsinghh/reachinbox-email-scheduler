import { Router } from 'express';
import multer from 'multer';
import { emailController } from '../controllers/emailController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/schedule', authenticateToken, upload.single('csv'), emailController.scheduleEmails);
router.get('/scheduled', authenticateToken, emailController.getScheduledEmails);
router.get('/sent', authenticateToken, emailController.getSentEmails);

export default router;
