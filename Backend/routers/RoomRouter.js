import express from "express";
const router = express.Router();
import { AuthMiddleware, authorizeRoles } from "../middlewares/AuthMiddleware.js";

import {
  addRoom,
  getAllRoom,
  availableRoom,
  availableBeds,
  guestInRoom,
  roomHistory,
  editRoom,
  deleteRoom,
} from "../controllers/RoomController.js";

router.route("/addRoom").post(addRoom);
router.route("/get-all-room").get(AuthMiddleware, authorizeRoles("admin"), getAllRoom);
router.route("/availableRoom").get(availableRoom);
router.route("/:roomId/available-beds").get(availableBeds);
router.route("/rooms/:roomId/guests").get(AuthMiddleware, authorizeRoles("admin"), guestInRoom);
router.route("/rooms/:roomId/room-history").get(AuthMiddleware, authorizeRoles("admin"), roomHistory);
router.route("/rooms/:roomId/edit-room").patch(AuthMiddleware, authorizeRoles("admin"), editRoom);
router.route("/rooms/:roomId/delete-room").delete(AuthMiddleware, authorizeRoles("admin"), deleteRoom);

export default router;
