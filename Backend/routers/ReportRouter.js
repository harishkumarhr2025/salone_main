import express from "express";
import {
  GenerateReport,
  generateSalonReport,
  generateSalonDailyReport,
  generateDailyCumulativeReport,
  getMonthlyRevenueReport,
  previewMonthlyRevenueImport,
  importMonthlyRevenueReport,
} from "../controllers/ReportController.js";
import { exportDatabaseToExcel } from "../controllers/ExportController.js";
import { AuthMiddleware, authorizeRoles } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

router.route("/reports/daily").post(AuthMiddleware, authorizeRoles("admin"), GenerateReport);
router.route("/reports/salon").post(AuthMiddleware, authorizeRoles("admin"), generateSalonReport);
router.route("/test-daily-report").get(AuthMiddleware, authorizeRoles("admin"), generateSalonDailyReport);
router.get("/reports/cumulative", AuthMiddleware, authorizeRoles("admin"), generateDailyCumulativeReport);
router.route("/salon-monthly-report").get(AuthMiddleware, authorizeRoles("admin"), getMonthlyRevenueReport);
router.route("/salon-monthly-report/preview-import").post(AuthMiddleware, authorizeRoles("admin"), previewMonthlyRevenueImport);
router.route("/salon-monthly-report/import").post(AuthMiddleware, authorizeRoles("admin"), importMonthlyRevenueReport);
router.get(
  "/exports/database-excel",
  AuthMiddleware,
  authorizeRoles("admin"),
  exportDatabaseToExcel
);

export default router;
