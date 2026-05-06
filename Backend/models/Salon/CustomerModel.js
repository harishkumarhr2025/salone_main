import mongoose from "mongoose";

const visitSchema = new mongoose.Schema({
  inTime: {
    type: Date,
    default: Date.now,
  },
  serviceNumber: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  bookings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalonBooking",
    },
  ],
  totalAmount: {
    type: Number,
    min: [0, "Amount cannot be negative"],
  },
});

const customerSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    visits: [visitSchema],
  },
  { timestamps: true }
);

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
