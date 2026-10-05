import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/google', authController.googleLogin);
router.get('/me', authenticateToken, authController.getMe);

export default router;
