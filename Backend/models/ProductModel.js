import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    hsnCode: {
      type: String,
      trim: true,
    },
    vendorName: {
      type: String,
      trim: true,
    },
    vendorCode: {
      type: String,
      trim: true,
    },
    manufacturingDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
    uom: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    gstType: {
      type: String,
      trim: true,
    },
    minQuantity: {
      type: Number,
      default: 0,
    },
    maxQuantity: {
      type: Number,
      default: 0,
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    billNumber: {
      type: String,
      trim: true,
    },
    billDate: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

productSchema.index(
  { productName: 1, batchNumber: 1, billNumber: 1 },
  { name: "product_batch_bill_lookup" }
);

const Product = mongoose.model("Product", productSchema);

export default Product;