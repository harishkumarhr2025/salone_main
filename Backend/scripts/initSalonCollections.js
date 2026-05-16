import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../DB/ConnectDB.js";

import Customer from "../models/Salon/CustomerModel.js";
import SalonService from "../models/Salon/SalonServicesModel.js";
import SalonBooking from "../models/Salon/SalonBookingModel.js";
import SalonRegistration from "../models/Salon/SalonRegistrationModel.js";
import MonthlyRevenueImport from "../models/Salon/MonthlyRevenueImportModel.js";
import Counter from "../models/Salon/CounterModel.js";

dotenv.config();

const models = [
  Customer,
  SalonService,
  SalonBooking,
  SalonRegistration,
  MonthlyRevenueImport,
  Counter,
];

const ensureCollection = async (model) => {
  try {
    await model.createCollection();
    console.log(`Created collection: ${model.collection.name}`);
  } catch (error) {
    // MongoDB error code 48 means namespace already exists.
    if (error?.code === 48 || /already exists/i.test(error?.message || "")) {
      console.log(`Collection already exists: ${model.collection.name}`);
    } else {
      throw error;
    }
  }

  await model.syncIndexes();
  const count = await model.estimatedDocumentCount();
  console.log(`Ready: ${model.collection.name} (documents: ${count})`);
};

const run = async () => {
  const mongoUrl = process.env.MONGO_URL_PROD || process.env.MONGO_URI;

  if (!mongoUrl) {
    throw new Error("MONGO_URL_PROD or MONGO_URI is missing in environment variables");
  }

  await connectDB(mongoUrl);

  for (const model of models) {
    await ensureCollection(model);
  }

  console.log("Salon collections are initialized and ready.");
};

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Initialization failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
