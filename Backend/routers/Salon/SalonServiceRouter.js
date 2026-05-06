import express from "express";
const router = express.Router();
import { AuthMiddleware, authorizeRoles } from "../../middlewares/AuthMiddleware.js";

import {
  createServices,
  getServices,
  updateService,
  deleteService,
  previewServicesImport,
  importServices,
} from "../../controllers/Salon/SalonServicesController.js";

router.route("/create-services").post(createServices);
router.route("/get-services").get(getServices);
router.route("/services/import-preview").post(AuthMiddleware, authorizeRoles("admin"), previewServicesImport);
router.route("/services/import").post(AuthMiddleware, authorizeRoles("admin"), importServices);
router.route("/services/:id").patch(AuthMiddleware, authorizeRoles("admin"), updateService);
router.route("/services/:id").delete(AuthMiddleware, authorizeRoles("admin"), deleteService);

export default router;
