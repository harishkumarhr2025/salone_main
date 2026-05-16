import mongoose from "mongoose";

const WhatsAppTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    category: {
      type: String,
      enum: ["check-in", "checkout", "reminder", "promotion", "custom"],
      default: "custom",
    },
    body: {
      type: String,
      required: true,
    },
    // Array of variable keys used in this template e.g. ["guest_name","room_no"]
    variables: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const WhatsAppTemplate = mongoose.model("WhatsAppTemplate", WhatsAppTemplateSchema);
export default WhatsAppTemplate;
