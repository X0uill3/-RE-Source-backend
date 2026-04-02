import { Router } from 'express';
import { getCommentsByRessource, addComment, deleteComment, updateComment, getCommentsByUser, deleteCommentsByRessource, deleteCommentsByUser, getAllComments } from '../controllers/commentController.js';
import { protect, checkRole, softProtect } from '../middleware/authMiddleware.js';
import { GlobalRole } from '../constants/roles.js';

const router = Router();

router.use(softProtect);

router.get('/ressource/:id', getCommentsByRessource);

router.use(protect);

router.post('/ressource/:id', addComment);
router.patch('/:id', updateComment);
router.delete('/:id', deleteComment);
router.get('/user/:id', getCommentsByUser);

router.use(checkRole([GlobalRole.ADMIN]));

router.get('/admin/comments', getAllComments);
router.delete('/ressource/:id', deleteCommentsByRessource);
router.delete('/user/:id', deleteCommentsByUser);

export default router;