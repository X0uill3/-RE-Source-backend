import { Router } from 'express';
import { getAllActivities, getActivity, createActivity, updateActivity, deleteActivity, enableActivity, disableActivity } from '../controllers/activityController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import { GlobalRole } from '../constants/roles.js';

const router = Router();
router.use(protect);

router.get('/', getAllActivities);
router.get('/:id', getActivity);

router.use(checkRole([GlobalRole.ADMIN]));

router.post('/', createActivity);
router.patch('/:id', updateActivity);
router.patch('/:id/disable', disableActivity);
router.patch('/:id/enable', enableActivity);
router.delete('/:id', deleteActivity);

export default router;