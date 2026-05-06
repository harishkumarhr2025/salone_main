import express from "express";
const router = express.Router();
import { AuthMiddleware, authorizeRoles } from "../../middlewares/AuthMiddleware.js";

import {
  addCustomer,
  getAllCustomers,
  getCustomerWithId,
  previewCustomerImport,
  importCustomers,
  createCheckout,
  getBookingDetails,
  checkCustomerByMobile,
} from "../../controllers/Salon/CustomerController.js";

import {
  registerSalon,
  getAllSalonRegistrations,
  getSalonById,
  updateSalon,
  approveSalon,
  rejectSalon,
  deleteSalon,
} from "../../controllers/Salon/SalonRegistrationController.js";

// Customer routes
router.route("/addNewCustomer").post(addCustomer);
router.route("/getAllCustomers").get(AuthMiddleware, authorizeRoles("admin"), getAllCustomers);
router.route("/customers/import-preview").post(AuthMiddleware, authorizeRoles("admin"), previewCustomerImport);
router.route("/customers/import").post(AuthMiddleware, authorizeRoles("admin"), importCustomers);
router.route("/customers/:customerId").get(AuthMiddleware, authorizeRoles("admin"), getCustomerWithId);
router.route("/checkout").post(AuthMiddleware, authorizeRoles("admin"), createCheckout);
router.route("/bookings").post(AuthMiddleware, authorizeRoles("admin"), getBookingDetails);
router.route("/customer/detail").get(AuthMiddleware, authorizeRoles("admin"), checkCustomerByMobile);

// Salon Registration routes
router.route("/salon/register").post(registerSalon);
router.route("/salons").get(AuthMiddleware, authorizeRoles("admin"), getAllSalonRegistrations);
router.route("/salon/:salonId").get(AuthMiddleware, authorizeRoles("admin"), getSalonById);
router.route("/salon/:salonId").patch(AuthMiddleware, authorizeRoles("admin"), updateSalon);
router.route("/salon/:salonId/approve").patch(AuthMiddleware, authorizeRoles("admin"), approveSalon);
router.route("/salon/:salonId/reject").patch(AuthMiddleware, authorizeRoles("admin"), rejectSalon);
router.route("/salon/:salonId").delete(AuthMiddleware, authorizeRoles("admin"), deleteSalon);

export default router;
