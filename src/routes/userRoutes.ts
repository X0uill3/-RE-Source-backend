import { Router } from 'express';
import { getMe, updateMe, getAllUsers, updateUser, deleteUser, reactivateUser, deleteMe, updateMyPassword } from '../controllers/userController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import { GlobalRole } from '../constants/roles.js';

const router = Router();

router.use(protect);

// Routes pour les utilisateurs connectés
router.get('/me', getMe);
router.patch('/updateMe', updateMe);
router.delete('/deleteMe', deleteMe);
router.patch('/updateMyPassword', updateMyPassword);

// Routes pour les admins
router.use(checkRole([GlobalRole.ADMIN]));

router.get('/', getAllUsers);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/reactivate', reactivateUser);

export default router;