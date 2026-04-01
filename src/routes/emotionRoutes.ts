import { Router } from "express";
import { getAllBaseEmotions, getDetailsByBase, getAllEmotionsWithDetails, createBaseEmotion, createEmotionDetail, updateBaseEmotion, updateEmotionDetail, deactivateBaseEmotion, deactivateEmotionDetail } from "../controllers/emotionController.js";
import { protect, checkRole } from "../middleware/authMiddleware.js";
import { GlobalRole } from "../constants/roles.js";

const router = Router();

router.use(protect);

// 1. ROUTES STATIQUES (Toujours en haut)
router.get('/admin', checkRole([GlobalRole.ADMIN]), getAllEmotionsWithDetails);
router.post('/details', checkRole([GlobalRole.ADMIN]), createEmotionDetail);

// 2. ROUTES DE NIVEAU 1 (Base)
router.get('/', getAllBaseEmotions);
router.post('/', checkRole([GlobalRole.ADMIN]), createBaseEmotion);

// 3. ROUTES DYNAMIQUES DE NIVEAU 2
// On les met avant les :id génériques pour éviter les conflits
router.patch('/details/:id', checkRole([GlobalRole.ADMIN]), updateEmotionDetail);
router.delete('/details/:id', checkRole([GlobalRole.ADMIN]), deactivateEmotionDetail);

// 4. ROUTES DYNAMIQUES GÉNÉRIQUES (Toujours en dernier)
router.get('/:baseId/details', getDetailsByBase);
router.patch('/:id', checkRole([GlobalRole.ADMIN]), updateBaseEmotion);
router.delete('/:id', checkRole([GlobalRole.ADMIN]), deactivateBaseEmotion);

export default router;