import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../DB/ConnectDB.js";
import Customer from "../models/Salon/CustomerModel.js";
import SalonBooking from "../models/Salon/SalonBookingModel.js";

dotenv.config();

const runMigration = async () => {
  const mongoUrl = process.env.MONGO_URL_PROD || process.env.MONGO_URI;

  if (!mongoUrl) {
    throw new Error("MONGO_URL_PROD or MONGO_URI is missing in environment variables");
  }

  await connectDB(mongoUrl);

  const [customerResult, bookingResult] = await Promise.all([
    Customer.updateMany(
      { "visits.outTime": { $exists: true } },
      { $unset: { "visits.$[].outTime": "" } }
    ),
    SalonBooking.updateMany(
      { appointmentDate: { $exists: true } },
      { $unset: { appointmentDate: "" } }
    ),
  ]);

  console.log("Removed visits.outTime from salon customers:", customerResult.modifiedCount);
  console.log("Removed appointmentDate from salon bookings:", bookingResult.modifiedCount);
};

runMigration()
  .then(async () => {
    await mongoose.disconnect();
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Migration failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
