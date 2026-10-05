import { Router } from 'express';
import { slackController } from '../controllers/slackController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/connect', authenticateToken, slackController.connect);
router.get('/callback', slackController.callback);
router.get('/status', authenticateToken, slackController.getStatus);
router.delete('/disconnect', authenticateToken, slackController.disconnect);

export default router;
