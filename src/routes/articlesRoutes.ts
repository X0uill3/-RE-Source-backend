import { Router } from 'express';
import { getAllArticles, createArticle, updateArticle, deleteArticle, getArticleById, getAllArticlesAdmin, activateArticle } from '../controllers/articleController.js';
import { protect, checkRole, softProtect } from '../middleware/authMiddleware.js';
import { GlobalRole } from '../constants/roles.js';

const router = Router();

// 1. D'abord les routes avec des mots fixes (Statiques)
router.get('/admin', protect, checkRole([GlobalRole.ADMIN]), getAllArticlesAdmin);
router.post('/admin', protect, checkRole([GlobalRole.ADMIN]), createArticle);

// 2. Ensuite les routes publiques générales
router.get('/', softProtect, checkRole([GlobalRole.ADMIN, GlobalRole.USER, GlobalRole.GUEST]), getAllArticles);

// 3. Enfin, les routes avec des paramètres (Dynamiques) TOUJOURS EN DERNIER
router.get('/:id', softProtect, checkRole([GlobalRole.ADMIN, GlobalRole.USER, GlobalRole.GUEST]), getArticleById);
router.patch('/:id', protect, checkRole([GlobalRole.ADMIN]), updateArticle);
router.delete('/:id', protect, checkRole([GlobalRole.ADMIN]), deleteArticle);
router.patch('/:id/activate', protect, checkRole([GlobalRole.ADMIN]), activateArticle);


export default router;