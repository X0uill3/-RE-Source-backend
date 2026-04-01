import { Router } from 'express';
import { getAllLogs } from '../controllers/logController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import { GlobalRole } from '../constants/roles.js';

const router = Router();

router.use(protect);
router.use(checkRole([GlobalRole.ADMIN]));

router.get('/', getAllLogs);

export default router;
