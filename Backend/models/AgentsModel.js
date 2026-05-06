import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    agent_ID: {
      type: String,
      unique: true,
      trim: true,
    },
    Agent_name: {
      type: String,
      trim: true,
    },
    Agent_aadhar_No: {
      type: String,
    },
    Agent_contact_number: {
      type: String,
    },
    Agent_registration_date: {
      type: Date,
      default: Date.now,
    },
    Agent_registration_time: {
      type: String,
    },
    Agent_vehicle_no: {
      type: String,
    },
    Agent_commission_type: {
      type: String,
    },
    Agent_commission_amount: {
      type: String,
    },
    Agent_remark: {
      type: String,
    },
    Agent_commission_history: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number },
        details: { type: String },
      },
    ],
    status: {
      type: String,
      default: "Active",
    },
  },
  { timestamps: true }
);

const Agent = mongoose.model("Agent", agentSchema);
export default Agent;
