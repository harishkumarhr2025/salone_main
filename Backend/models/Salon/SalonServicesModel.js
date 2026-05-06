import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, "Category is required"],
    trim: true,
    uppercase: true,
  },
  types: {
    type: [String],
    required: [true, "At least one type is required"],
    validate: {
      validator: function (types) {
        return types.length > 0;
      },
      message: "At least one type is required",
    },
  },
  services: [
    {
      name: {
        type: String,
        required: [true, "Service name is required"],
        trim: true,
        uppercase: true,
      },
      prices: {
        type: Map,
        of: Number,
        required: [true, "Prices are required"],
        validate: {
          validator: function (prices) {
            return this.parent().types.every((type) => prices.has(type));
          },
          message: "Prices must be provided for all types",
        },
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
serviceSchema.index({ category: 1 }, { unique: true });

const SalonService = mongoose.model("SalonService", serviceSchema);

export default SalonService;
