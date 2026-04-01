import { Router } from 'express';
import { getAllCategories, getAllCategoriesAdmin, getCategory, createCategory, updateCategory, disableCategory, enableCategory } from '../controllers/categorieController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import { GlobalRole } from '../constants/roles.js';

const router = Router();
router.use(protect);

router.get('/', getAllCategories);
router.get('/:id', getCategory);

router.use(checkRole([GlobalRole.ADMIN]));

router.post('/', createCategory);

router.get('/all', getAllCategoriesAdmin);

router.patch('/:id', updateCategory);
router.patch('/:id/disable', disableCategory);
router.patch('/:id/enable', enableCategory);

export default router;