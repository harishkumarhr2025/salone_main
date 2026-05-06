import express from "express";

const router = express.Router();
import { AuthMiddleware, authorizeRoles } from "../middlewares/AuthMiddleware.js";

import {
  AddEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "../controllers/EMS/EmployeeController.js";

router.route("/addEmployee").post(AddEmployee);
router.route("/getAllEmployees").get(getAllEmployees);
router.route("/getEmployeeById/:employeeId").get(getEmployeeById);
router.route("/updateEmployee/:employeeId").patch(AuthMiddleware, authorizeRoles("admin"), updateEmployee);
router.route("/deleteEmployee/:employeeId").delete(AuthMiddleware, authorizeRoles("admin"), deleteEmployee);

export default router;
