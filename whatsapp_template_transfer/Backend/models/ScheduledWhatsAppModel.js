import mongoose from "mongoose";

const scheduledWhatsAppSchema = new mongoose.Schema(
  {
    to: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guest",
    },
    sentAt: {
      type: Date,
    },
    error: {
      type: String,
    },
  },
  { timestamps: true }
);

const ScheduledWhatsApp = mongoose.model(
  "ScheduledWhatsApp",
  scheduledWhatsAppSchema
);

export default ScheduledWhatsApp;
