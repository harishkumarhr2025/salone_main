// import mongoose from "mongoose";

// const paymentMethodSchema = new mongoose.Schema({
//   method: {
//     type: String,
//     enum: ["cash", "card", "upi"],
//     required: true,
//   },
//   amount: {
//     type: Number,
//     required: true,
//     min: 0,
//   },
//   transactionId: {
//     type: String,
//     required: true,
//     default: () =>
//       `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
//   },
//   timestamp: {
//     type: Date,
//     default: Date.now,
//   },
// });

// const salonBookingSchema = new mongoose.Schema(
//   {
//     customer: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customer",
//       required: true,
//     },
//     visit: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//     },
//     services: [
//       {
//         service: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "SalonService",
//         },
//         category: String,
//         serviceName: String,
//         variant: String,
//         price: Number,
//         staff: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Employee",
//           required: true,
//         },
//         tipAmount: {
//           type: Number,
//           default: 0,
//           min: 0,
//         },
//       },
//     ],
//     totalAmount: {
//       type: Number,
//       required: true,
//     },
//     totalTips: {
//       type: Number,
//       default: 0,
//     },
//     totalPayment: {
//       type: Number,
//       required: true,
//       validate: {
//         validator: function (value) {
//           return value === this.totalAmount + this.totalTips;
//         },
//         message: (props) =>
//           `Total payment (${props.value}) must equal total amount + tips (${
//             this.totalAmount + this.totalTips
//           })`,
//       },
//     },
//     paymentMethods: [paymentMethodSchema],
//     paymentStatus: {
//       type: String,
//       enum: ["full", "split"],
//       default: "full",
//     },
//     status: {
//       type: String,
//       enum: ["pending", "completed", "canceled"],
//       default: "pending",
//     },
//     appointmentDate: {
//       type: Date,
//       required: true,
//     },
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   }
// );

// // Add validation for payment methods
// salonBookingSchema.pre("validate", function (next) {
//   if (this.paymentMethods.length === 0) {
//     this.invalidate(
//       "paymentMethods",
//       "At least one payment method is required"
//     );
//   }

//   const paymentSum = this.paymentMethods.reduce(
//     (sum, method) => sum + method.amount,
//     0
//   );
//   if (paymentSum !== this.totalPayment) {
//     this.invalidate(
//       "paymentMethods",
//       `Payment sum (${paymentSum}) must equal total payment (${this.totalPayment})`
//     );
//   }

//   next();
// });

// const SalonBooking = mongoose.model("SalonBooking", salonBookingSchema);
// export default SalonBooking;

import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ["cash", "card", "upi"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  transactionId: {
    type: String,
    required: true,
    default: () =>
      `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const salonBookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    visit: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    services: [
      {
        service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SalonService",
        },
        category: String,
        serviceName: String,
        variant: String,
        price: Number,
        staff: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        tipAmount: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
    originalTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: {
        type: String,
        enum: ["fixed", "percentage"],
      },
      value: {
        type: Number,
        min: 0,
      },
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      code: String,
      description: String,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    totalTips: {
      type: Number,
      default: 0,
    },
    totalPayment: {
      type: Number,
      required: true,
      validate: {
        validator: function (value) {
          return value === this.totalAmount + this.totalTips;
        },
        message: (props) =>
          `Total payment (${props.value}) must equal total amount + tips (${
            this.totalAmount + this.totalTips
          })`,
      },
    },
    paymentMethods: [paymentMethodSchema],
    paymentStatus: {
      type: String,
      enum: ["full", "split"],
      default: "full",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "canceled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

salonBookingSchema.pre("validate", function (next) {
  // Validate originalTotal matches sum of service prices
  const servicesSum = this.services.reduce(
    (sum, service) => sum + (service.price || 0),
    0
  );
  if (this.originalTotal !== servicesSum) {
    this.invalidate(
      "originalTotal",
      `Original total (${this.originalTotal}) must equal sum of service prices (${servicesSum})`
    );
  }

  if (typeof this.originalTotal === "undefined") {
    this.invalidate("originalTotal", "Original total is required");
    return next();
  }

  // Validate discount calculations
  if (this.discount?.type && typeof this.discount.value !== "undefined") {
    let expectedAmount;
    const discountValue = Number(this.discount.value);
    const originalTotal = Number(this.originalTotal);

    if (this.discount.type === "fixed") {
      expectedAmount = discountValue;
    } else if (this.discount.type === "percentage") {
      expectedAmount = (originalTotal * discountValue) / 100;
    }

    if (Number(this.discount.amount) !== expectedAmount) {
      this.invalidate(
        "discount.amount",
        `Discount amount (${this.discount.amount}) must be ${expectedAmount} for ${this.discount.type} discount`
      );
    }
  }
  // Validate totalAmount calculation
  const expectedTotalAmount =
    Number(this.originalTotal) - (Number(this.discount?.amount) || 0);
  if (Number(this.totalAmount) !== expectedTotalAmount) {
    this.invalidate(
      "totalAmount",
      `Total amount must be ${expectedTotalAmount} (Original: ${
        this.originalTotal
      } - Discount: ${this.discount?.amount || 0})`
    );
  }

  // Existing payment validations
  if (this.paymentMethods.length === 0) {
    this.invalidate(
      "paymentMethods",
      "At least one payment method is required"
    );
  }

  const paymentSum = this.paymentMethods.reduce(
    (sum, method) => sum + method.amount,
    0
  );
  if (paymentSum !== this.totalPayment) {
    this.invalidate(
      "paymentMethods",
      `Payment sum (${paymentSum}) must equal total payment (${this.totalPayment})`
    );
  }

  next();
});

const SalonBooking = mongoose.model("SalonBooking", salonBookingSchema);
export default SalonBooking;
