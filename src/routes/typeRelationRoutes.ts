import { Router } from 'express';
import { createTypeRelation, getAllTypeRelation, getTypeRelation, getAllTypeRelationAdmin, updateTypeRelation, disableTypeRelation, enableTypeRelation } from '../controllers/typeRelationController.js';
import { protect, checkRole, softProtect } from '../middleware/authMiddleware.js';
import { GlobalRole } from '../constants/roles.js';

const router = Router();

router.use(softProtect);

router.get('/', getAllTypeRelation);
router.get('/:id', getTypeRelation);

router.use(checkRole([GlobalRole.ADMIN]));

router.get('/all', getAllTypeRelationAdmin);
router.post('/', createTypeRelation);
router.patch('/:id', updateTypeRelation);
router.patch('/:id/disable', disableTypeRelation);
router.patch('/:id/enable', enableTypeRelation);

export default router;
