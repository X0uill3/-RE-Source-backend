import { Router } from "express";
import {
  getAllResources,
  getResource,
  getRestrictedResources,
  updateResource,
  deleteResource,
  createResource,
  validateResource,
  startResource,
  getPopularResources,
} from "../controllers/ressourceController.js";
import {
  protect,
  checkRole,
  softProtect,
} from "../middleware/authMiddleware.js";
import { GlobalRole } from "../constants/roles.js";

const router = Router();
router.use(softProtect);

router.get("/", getAllResources);
router.get("/restricted", getRestrictedResources);
router.get("/popular", getPopularResources);
router.get("/:id", getResource);

router.use(protect);

router.patch("/:id/start", startResource);
router.patch("/:id", updateResource);
router.post("/", createResource);

router.patch(
  "/:id/validate",
  checkRole([GlobalRole.ADMIN, GlobalRole.MODERATOR]),
  validateResource,
);
router.delete("/:id", checkRole([GlobalRole.ADMIN]), deleteResource);

export default router;
