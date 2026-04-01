import { Router } from "express";
import { createEntry, getMyEntries, getEmotionReport, deleteEntry } from "../controllers/diaryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect); // Toutes les routes suivantes nécessitent une authentification

router.post('/', createEntry);
router.get('/', getMyEntries);
router.get('/report', getEmotionReport);
router.delete('/:id', deleteEntry);

export default router;