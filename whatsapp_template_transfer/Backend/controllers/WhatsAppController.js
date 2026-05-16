import ScheduledWhatsApp from "../models/ScheduledWhatsAppModel.js";
import WhatsAppTemplate from "../models/WhatsAppTemplateModel.js";
import sendWhatsApp2 from "../utils/sendWhatsApp2.js";

/**
 * POST /api/v1/whatsapp/schedule
 * Body: { to, body, scheduledAt, guestId (optional) }
 */
export const scheduleWhatsApp = async (req, res) => {
  try {
    const { to, body, scheduledAt, guestId } = req.body;

    if (!to || !body || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: "to, body and scheduledAt are required",
      });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid scheduledAt date",
      });
    }

    const msg = await ScheduledWhatsApp.create({
      to: String(to).replace(/\D/g, ""),
      body,
      scheduledAt: scheduledDate,
      ...(guestId ? { guestId } : {}),
    });

    return res.status(201).json({
      success: true,
      message: "WhatsApp message scheduled",
      data: msg,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to schedule message",
      error: error.message,
    });
  }
};

/**
 * GET /api/v1/whatsapp/scheduled
 * Query: status (optional) — pending | sent | failed
 */
export const getScheduledMessages = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const messages = await ScheduledWhatsApp.find(filter)
      .sort({ scheduledAt: 1 })
      .populate("guestId", "Guest_name Room_no GRC_No");

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch scheduled messages",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/v1/whatsapp/schedule/:id
 * Cancel a pending scheduled message
 */
export const cancelScheduledMessage = async (req, res) => {
  try {
    const msg = await ScheduledWhatsApp.findById(req.params.id);
    if (!msg) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    if (msg.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a message with status '${msg.status}'`,
      });
    }
    await msg.deleteOne();
    return res.status(200).json({ success: true, message: "Scheduled message cancelled" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel message",
      error: error.message,
    });
  }
};

/**
 * POST /api/v1/whatsapp/test-schedule
 * Body: { templateId, to }
 * Schedules a template message 1 minute from now with sample data.
 */
export const testScheduleTemplate = async (req, res) => {
  try {
    const { templateId, to } = req.body;

    if (!templateId || !to) {
      return res.status(400).json({ success: false, message: "templateId and to are required" });
    }

    const mobile = String(to).replace(/\D/g, "");
    if (mobile.length < 10) {
      return res.status(400).json({ success: false, message: "Invalid mobile number" });
    }

    const template = await WhatsAppTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    // Fill with sample/dummy values
    const now = new Date();
    const sampleBody = template.body
      .replace(/\{\{guest_name\}\}/g, "Test Guest")
      .replace(/\{\{room_no\}\}/g, "101")
      .replace(/\{\{grc_no\}\}/g, "GRC-TEST-001")
      .replace(/\{\{arrival_date\}\}/g, now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }))
      .replace(/\{\{checkout_date\}\}/g, new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }))
      .replace(/\{\{amount\}\}/g, "₹2,500")
      .replace(/\{\{hotel_name\}\}/g, "Mantri In")
      .replace(/\{\{contact_number\}\}/g, mobile)
      .replace(/\{\{agent_name\}\}/g, "Test Agent")
      .replace(/\{\{days\}\}/g, "2");

    // Schedule 1 minute from now
    const scheduledAt = new Date(now.getTime() + 60 * 1000);

    const msg = await ScheduledWhatsApp.create({
      to: mobile,
      body: sampleBody,
      scheduledAt,
    });

    return res.status(201).json({
      success: true,
      message: `Test message scheduled for ${scheduledAt.toLocaleTimeString("en-IN")} (1 minute from now)`,
      data: { _id: msg._id, scheduledAt, to: mobile, preview: sampleBody },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/whatsapp/wa2/send
 * Direct send via secondary WhatsApp provider (WA2_API_KEY / WA2_DOMAIN).
 * Body: { to, body, img1?, img2?, img3?, img4?, pdf?, video? }
 */
export const sendViaWA2 = async (req, res) => {
  try {
    const { to, body, img1, img2, img3, img4, pdf, video } = req.body;

    if (!to || !body) {
      return res.status(400).json({ success: false, message: "to and body are required" });
    }

    const result = await sendWhatsApp2({ to, body, img1, img2, img3, img4, pdf, video });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/v1/whatsapp/wa2/test
 * Quick test: send a short test message to a given number right now.
 * Body: { to, message? }
 */
export const testWA2 = async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, message: "to is required" });
    }

    const mobile = String(to).replace(/\D/g, "");
    if (mobile.length !== 10) {
      return res.status(400).json({ success: false, message: "Mobile must be 10 digits" });
    }

    const body =
      message?.trim() ||
      `This is a test message from Mantri In WhatsApp API.\nSent at: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;

    const result = await sendWhatsApp2({ to: mobile, body });

    return res.status(200).json({
      success: true,
      message: "Test message sent successfully",
      data: { to: mobile, body, apiResponse: result },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
