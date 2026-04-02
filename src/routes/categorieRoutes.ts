import { Router } from "express";
import {
  getAllCategories,
  getAllCategoriesAdmin,
  getCategory,
  createCategory,
  updateCategory,
  disableCategory,
  enableCategory,
} from "../controllers/categorieController.js";
import {
  protect,
  checkRole,
  softProtect,
} from "../middleware/authMiddleware.js";
import { GlobalRole } from "../constants/roles.js";

const router = Router();
router.use(softProtect);

router.get("/", getAllCategories);
router.get(
  "/all",
  protect,
  checkRole([GlobalRole.ADMIN]),
  getAllCategoriesAdmin,
);

router.get("/:id", getCategory);

router.use(protect);
router.use(checkRole([GlobalRole.ADMIN]));

router.post("/", createCategory);

router.patch("/:id", updateCategory);
router.patch("/:id/disable", disableCategory);
router.patch("/:id/enable", enableCategory);

export default router;
