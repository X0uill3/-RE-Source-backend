import { Router } from 'express';
import { getMe, updateMe, getAllUsers, updateUser, deleteUser, reactivateUser, deleteMe, updateMyPassword } from '../controllers/userController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import { GlobalRole } from '../constants/roles.js';

const router = Router();

// Routes pour les utilisateurs connectés
router.get('/me', protect, getMe);
router.patch('/updateMe', protect, updateMe);
router.delete('/deleteMe', protect, deleteMe);
router.patch('/updateMyPassword', protect, updateMyPassword);

// Routes pour les admins
router.get('/', protect, checkRole([GlobalRole.ADMIN]), getAllUsers);
router.patch('/:id', protect, checkRole([GlobalRole.ADMIN]), updateUser);
router.delete('/:id', protect, checkRole([GlobalRole.ADMIN]), deleteUser);
router.patch('/:id/reactivate', protect, checkRole([GlobalRole.ADMIN]), reactivateUser);

export default router;