import { Router } from 'express';
import { searchController } from '../controllers/searchController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, searchController.searchEmails);

export default router;
