import mongoose from "mongoose";

const guestSchema = new mongoose.Schema(
  {
    GRC_No: {
      type: String,
      trim: true,
    },
    financialYear: {
      type: String,
    },
    Guest_name: {
      type: String,
      trim: true,
    },
    Guest_picture: {
      type: String,
    },
    Guest_email: {
      type: String,
      trim: true,
    },
    Guest_type: {
      type: String,
    },
    Guest_aadhar_No: {
      type: String,
    },
    Contact_number: {
      type: String,
    },
    Guest_address: {
      type: String,
      trim: true,
    },
    Emergency_number: {
      type: String,
    },
    Arrival_date: {
      type: Date,
      default: Date.now,
    },
    Arrival_time: {
      type: String,
    },
    Checkout_date: {
      type: Date,
    },
    Checkout_time: {
      type: String,
    },
    Room_no: {
      type: String,
    },
    Room_type: {
      type: String,
    },
    Room_tariff: {
      type: String,
      min: 0,
    },
    Adults: {
      type: String,
      min: 1,
    },
    Children: {
      type: String,
      min: 0,
    },
    Booking_details: {
      type: String,
    },
    Purpose_of_visit: {
      type: String,
    },
    Payment_type: {
      type: String,
    },
    Agent_commission: {
      type: String,
      min: 0,
      default: 0,
    },
    Profession_type: {
      type: String,
    },
    status: {
      type: String,
    },
    totalRoomRent: {
      type: Number,
    },
    GSTAmount: {
      type: Number,
    },
    grand_total: {
      type: Number,
    },
    remark: {
      type: String,
    },
    Guest_nationality: {
      type: String,
    },
    Guest_ID_Proof: [
      {
        imageUrl: {
          type: String,
        },
      },
    ],
    meal_plan: {
      type: [String],
      enum: ["breakfast", "lunch", "dinner"],
      default: [],
    },
    registration_fee: {
      type: Number,
      min: 0,
      default: 0,
    },
    advance_deposit: {
      type: Number,
      min: 0,
      default: 0,
    },
    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed", // Reference to Bed model
    },
    bedNumber: {
      type: String,
      trim: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
  },
  { timestamps: true }
);

guestSchema.index(
  { financialYear: 1, GRC_No: 1 },
  { unique: true, name: "financialYear_GRCNo_unique" }
);

const Guest = mongoose.model("Guest", guestSchema);
export default Guest;
