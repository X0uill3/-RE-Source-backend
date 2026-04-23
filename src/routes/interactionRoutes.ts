import { Router } from 'express';
import { recordInteraction, getUserInteractions, deleteInteraction, getRessourceInteractions, getUserSavedResources, getUserFavoriteResources } from '../controllers/interactionController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import { GlobalRole } from '../constants/roles.js';

const router = Router();
router.use(protect);

router.post('/', recordInteraction);
router.get('/user', getUserInteractions);
router.get('/ressource/:id', getRessourceInteractions);
router.delete('/:id', deleteInteraction);

router.get('/user/saved', getUserSavedResources);
router.get('/user/favorites', getUserFavoriteResources);

export default router;