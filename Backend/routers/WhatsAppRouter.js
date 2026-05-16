import express from "express";
import {
  scheduleWhatsApp,
  getScheduledMessages,
  cancelScheduledMessage,
  testScheduleTemplate,
  sendViaWA2,
  testWA2,
} from "../controllers/WhatsAppController.js";
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../controllers/WhatsAppTemplateController.js";
import { AuthMiddleware } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// ── Scheduled messages ──────────────────────────────────────────────────────
router.post("/whatsapp/schedule", AuthMiddleware, scheduleWhatsApp);
router.post("/whatsapp/test-schedule", AuthMiddleware, testScheduleTemplate);
router.get("/whatsapp/scheduled", AuthMiddleware, getScheduledMessages);
router.delete("/whatsapp/schedule/:id", AuthMiddleware, cancelScheduledMessage);

// ── Templates ────────────────────────────────────────────────────────────────
router.get("/whatsapp/templates", AuthMiddleware, getTemplates);
router.get("/whatsapp/templates/:id", AuthMiddleware, getTemplateById);
router.post("/whatsapp/templates", AuthMiddleware, createTemplate);
router.put("/whatsapp/templates/:id", AuthMiddleware, updateTemplate);
router.delete("/whatsapp/templates/:id", AuthMiddleware, deleteTemplate);

// ── WA2 (secondary provider) ─────────────────────────────────────────────────
router.post("/whatsapp/wa2/send", AuthMiddleware, sendViaWA2);
router.post("/whatsapp/wa2/test", AuthMiddleware, testWA2);

export default router;
