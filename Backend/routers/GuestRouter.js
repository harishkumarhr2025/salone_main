import express from "express";
const router = express.Router();
import { AuthMiddleware, authorizeRoles } from "../middlewares/AuthMiddleware.js";
import {
  createGuest,
  getAllGuest,
  fetchGuestById,
  updateGuestById,
  guestCheckout,
  checkGuestExists,
  previewGuestImport,
  importGuests,
} from "../controllers/GuestController.js";

import { getSignature } from "../controllers/getSignature.js";

router.post("/getSignature", getSignature);
router.route("/create-new-guest").post(createGuest);
router.route("/get-all-guest").get(AuthMiddleware, authorizeRoles("admin"), getAllGuest);
router.route("/fetch-guest-by-id/:guestId").get(AuthMiddleware, authorizeRoles("admin"), fetchGuestById);
router.route("/import-guests/preview").post(AuthMiddleware, authorizeRoles("admin"), previewGuestImport);
router.route("/import-guests").post(AuthMiddleware, authorizeRoles("admin"), importGuests);
router.route("/update-guest/:guestId").patch(AuthMiddleware, authorizeRoles("admin"), updateGuestById);
router.route("/guests/:guestId/checkout").patch(AuthMiddleware, authorizeRoles("admin"), guestCheckout);
router.route("/guest/:phone").get(AuthMiddleware, authorizeRoles("admin"), checkGuestExists);
export default router;
