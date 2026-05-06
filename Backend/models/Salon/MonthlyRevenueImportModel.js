import mongoose from "mongoose";

const monthlyRevenueImportSchema = new mongoose.Schema(
  {
    reportDate: {
      type: Date,
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,
    },
    cash: {
      type: Number,
      default: 0,
    },
    upi: {
      type: Number,
      default: 0,
    },
    tips: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

monthlyRevenueImportSchema.index(
  { reportDate: 1, month: 1, year: 1 },
  { name: "monthly_revenue_import_lookup" }
);

const MonthlyRevenueImport = mongoose.model(
  "MonthlyRevenueImport",
  monthlyRevenueImportSchema
);

export default MonthlyRevenueImport;