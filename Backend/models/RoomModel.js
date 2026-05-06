import mongoose from "mongoose";

const BedHistorySchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guest",
      required: true,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
    },
    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    movedOutReason: {
      type: String,
      enum: ["completed", "transferred", "terminated", "other"],
    },
    durationDays: {
      type: Number,
      virtual: true,
      get: function () {
        if (this.checkOutDate) {
          return Math.ceil(
            (this.checkOutDate - this.checkInDate) / (1000 * 60 * 60 * 24)
          );
        }
        return null;
      },
    },
  },
  { timestamps: true }
);

const BedSchema = new mongoose.Schema({
  bedNumber: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["available", "occupied", "under-maintenance"],
    default: "available",
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Guest",
    default: null,
  },
  history: [BedHistorySchema],
  movedInAt: {
    type: Date,
    default: null,
  },
  movedOutAt: {
    type: Date,
    default: null,
  },
});

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      uniques: true,
    },
    roomType: {
      type: String,
      enum: ["AC", "Non-AC"],
    },
    capacity: {
      type: String,
    },
    amenities: [
      {
        name: String,
        description: String,
        isAvailable: {
          type: Boolean,
          default: true,
        },
      },
    ],
    floor: {
      type: Number,
    },
    beds: [BedSchema],
    currentOccupancy: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["vacant", "partially-occupied", "fully-occupied", "unavailable"],
      default: "vacant",
    },
    checkInCheckOutHistory: [BedHistorySchema],
  },
  { timestamps: true }
);

// Indexes for faster querying
roomSchema.index({ roomNumber: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ "beds.tenant": 1 });

const Room = mongoose.model("Room", roomSchema);

export { Room };
