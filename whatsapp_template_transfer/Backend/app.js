import dotenv from "dotenv";
dotenv.config();
import express from "express";
const app = express();
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import GuestRouter from "./routers/GuestRouter.js";
import AgentRouter from "./routers/AgentRouter.js";
import AuthRouter from "./routers/AuthRouter.js";
import ReportRouter from "./routers/ReportRouter.js";
import RoomRouter from "./routers/RoomRouter.js";
import SalonServiceRouter from "./routers/Salon/SalonServiceRouter.js";
import EmployeeRouter from "./routers/EmployeeRouter.js";
import SalonRouter from "./routers/Salon/SalonRouter.js";
import ProductRouter from "./routers/ProductRouter.js";
import WhatsAppRouter from "./routers/WhatsAppRouter.js";
import { initDailyReportCron, initScheduledWhatsAppCron, initCheckoutReminderCron, initBirthdayReschedulerCron } from "./Services/cronJob.js";
import { seedWhatsAppTemplates } from "./scripts/seedWhatsAppTemplates.js";

import connectDB from "./DB/ConnectDB.js";
// import { generateMonthlySalonReportPDF } from "./PDF/Salon/generateSalonReportPDF.js";

const PORT = process.env.PORT || 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsRootDir = path.join(__dirname, "uploads");
const guestUploadDir = path.join(uploadsRootDir, "guest-docs");
fs.mkdirSync(guestUploadDir, { recursive: true });

const sanitizeFileName = (name = "") =>
  name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 120);

const localUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, guestUploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "") || ".jpg";
      const base = path.basename(file.originalname || "file", ext);
      cb(null, `${Date.now()}-${sanitizeFileName(base)}${ext.toLowerCase()}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only JPEG/PNG images are allowed"));
  },
});

connectDB(process.env.MONGO_URL_PROD).then(() => seedWhatsAppTemplates());
// connectDB(process.env.MONGO_URL_DEV).then(() => seedWhatsAppTemplates());
// Start cron when server starts
initDailyReportCron();
initScheduledWhatsAppCron();
initCheckoutReminderCron();
initBirthdayReschedulerCron();
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsRootDir));

app.post("/api/v1/local-upload", (req, res) => {
  localUpload.single("file")(req, res, (error) => {
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const secureUrl = `${req.protocol}://${req.get("host")}/uploads/guest-docs/${req.file.filename}`;
    return res.status(200).json({ success: true, secure_url: secureUrl });
  });
});

// Route Middleware
app.use("/api/v1", GuestRouter);
app.use("/api/v1", AgentRouter);
app.use("/api/v1", AuthRouter);
app.use("/api/v1", ReportRouter);
app.use("/api/v1", RoomRouter);
app.use("/api/v1", SalonServiceRouter);
app.use("/api/v1", EmployeeRouter);
app.use("/api/v1", SalonRouter);
app.use("/api/v1", ProductRouter);
app.use("/api/v1", WhatsAppRouter);

app.listen(PORT, () => {
  console.log(`Server is running at Port:${PORT}`);
});
