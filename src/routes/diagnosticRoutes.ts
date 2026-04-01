import { Router } from "express";
import {
    getActiveTests, getTestQuestions, saveTestResult, getMyResults,
    getAllTestsAdmin, createTest, updateTest, toggleTestStatus,
    getQuestionsForTestAdmin, createQuestionForTest, updateQuestion, toggleQuestionStatus
} from "../controllers/diagnosticController.js";
import { checkRole, protect } from "../middleware/authMiddleware.js";
import { GlobalRole } from "../constants/roles.js";

const router = Router();

// --- ROUTES MOBILE (PUBLIQUES / SEMI-PUBLIQUES) ---
router.get('/tests', getActiveTests);
router.get('/tests/:testId/questions', getTestQuestions);
router.post('/tests/:testId/results', protect, saveTestResult);
router.get('/my-results', protect, getMyResults);

// --- ROUTES ADMIN (BACK-OFFICE) ---
router.use(protect);
router.use(checkRole([GlobalRole.ADMIN]))

// Gestion des catalogues de tests
router.get('/admin/tests', getAllTestsAdmin);
router.post('/admin/tests', createTest);
router.put('/admin/tests/:id', updateTest);
router.patch('/admin/tests/:id/toggle', toggleTestStatus);

// Gestion des questions au sein d'un test
router.get('/admin/tests/:testId/questions', getQuestionsForTestAdmin);
router.post('/admin/tests/:testId/questions', createQuestionForTest);
router.put('/admin/questions/:id', updateQuestion);
router.patch('/admin/questions/:id/toggle', toggleQuestionStatus);

export default router;