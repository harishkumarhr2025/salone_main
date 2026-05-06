import express from "express";
const router = express.Router();

import { AuthMiddleware, authorizeRoles } from "../middlewares/AuthMiddleware.js";

import {
  register,
  login,
  loggedInUser,
  verifyUser,
  getAllUsersForRoleManagement,
  updateUserRole,
} from "../controllers/AuthController.js";

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/auth/user").get(AuthMiddleware, loggedInUser);
router.route("/api/auth/verify").get(verifyUser);
router.route("/auth/users").get(AuthMiddleware, authorizeRoles("admin"), getAllUsersForRoleManagement);
router.route("/auth/users/:userId/role").patch(AuthMiddleware, authorizeRoles("admin"), updateUserRole);

export default router;
