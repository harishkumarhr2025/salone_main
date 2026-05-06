import express from "express";
import { AuthMiddleware, authorizeRoles } from "../middlewares/AuthMiddleware.js";
import {
  createProduct,
  getAllProducts,
  previewProductImport,
  importProducts,
} from "../controllers/ProductController.js";

const router = express.Router();

router.route("/products").get(getAllProducts).post(AuthMiddleware, authorizeRoles("admin"), createProduct);
router.route("/products/import-preview").post(AuthMiddleware, authorizeRoles("admin"), previewProductImport);
router.route("/products/import").post(AuthMiddleware, authorizeRoles("admin"), importProducts);

export default router;