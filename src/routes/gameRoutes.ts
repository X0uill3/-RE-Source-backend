import { Router } from 'express';
import { getAllGames, getGame, createGame, updateGame, disableGame, enableGame } from '../controllers/gameController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import { GlobalRole } from '../constants/roles.js';

const router = Router();
router.use(protect);

router.get('/', getAllGames);
router.get('/:id', getGame);

router.use(checkRole([GlobalRole.ADMIN]));

router.post('/', createGame);
router.patch('/:id', updateGame);
router.patch('/:id/disable', disableGame);
router.patch('/:id/enable', enableGame);

export default router;