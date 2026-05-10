import { Router } from "express";
import {
  getAllResources,
  getAllResourcesAdmin,
  getResource,
  getRestrictedResources,
  updateResource,
  deleteResource,
  createResource,
  validateResource,
  startResource,
  getPopularResources,
  stopResource,
  getUserResources,
} from "../controllers/ressourceController.js";
import {
  protect,
  checkRole,
  softProtect,
} from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { GlobalRole } from "../constants/roles.js";

const router = Router();

router.use(softProtect);

router.get("/", getAllResources);
router.get("/restricted", getRestrictedResources);
router.get("/popular", getPopularResources);
router.get("/:id", getResource);

router.use(protect);

router.patch("/:id/start", startResource);
router.patch("/:id/stop", stopResource);
router.patch("/:id", updateResource);

router.post("/", upload.single("image"), createResource);

router.patch(
  "/:id/validate",
  checkRole([GlobalRole.ADMIN, GlobalRole.MODERATOR]),
  validateResource,
);
router.delete("/:id", checkRole([GlobalRole.ADMIN]), deleteResource);
router.get("/user/:id", getUserResources);
router.get("/admin/all", getAllResourcesAdmin);

export default router;