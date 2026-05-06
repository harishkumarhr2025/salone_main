import moment from "moment";
import Product from "../models/ProductModel.js";

const productFieldAliases = {
  productname: "productName",
  hsncode: "hsnCode",
  vendorname: "vendorName",
  vendorcode: "vendorCode",
  manufacturingdate: "manufacturingDate",
  expirydate: "expiryDate",
  uom: "uom",
  price: "price",
  gsttype: "gstType",
  minquantity: "minQuantity",
  maxquantity: "maxQuantity",
  batchnumber: "batchNumber",
  billnumber: "billNumber",
  billdate: "billDate",
  remarks: "remarks",
};

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const parseDate = (value) => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const excelDate = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(excelDate.getTime()) ? undefined : excelDate;
  }
  const parsed = moment(value, [moment.ISO_8601, "DD/MM/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"], true);
  return parsed.isValid() ? parsed.toDate() : undefined;
};

const parseNumber = (value) => {
  if (value === null || typeof value === "undefined" || value === "") return undefined;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isNaN(numeric) ? undefined : numeric;
};

const mapProductRow = (row) => {
  const mapped = {};
  Object.entries(row || {}).forEach(([header, rawValue]) => {
    const targetField = productFieldAliases[normalizeHeader(header)];
    if (!targetField) return;

    if (["manufacturingDate", "expiryDate", "billDate"].includes(targetField)) {
      const parsedDate = parseDate(rawValue);
      if (parsedDate) mapped[targetField] = parsedDate;
      return;
    }

    if (["price", "minQuantity", "maxQuantity"].includes(targetField)) {
      const parsedNumber = parseNumber(rawValue);
      if (typeof parsedNumber !== "undefined") mapped[targetField] = parsedNumber;
      return;
    }

    if (rawValue !== null && typeof rawValue !== "undefined" && String(rawValue).trim() !== "") {
      mapped[targetField] = String(rawValue).trim();
    }
  });
  return mapped;
};

const getProductMatch = async (mappedRow) => {
  if (mappedRow.batchNumber && mappedRow.billNumber) {
    const existingProduct = await Product.findOne({
      batchNumber: mappedRow.batchNumber,
      billNumber: mappedRow.billNumber,
    });
    if (existingProduct) {
      return {
        existingProduct,
        matchReason: `Matched by batchNumber ${mappedRow.batchNumber} and billNumber ${mappedRow.billNumber}`,
      };
    }
  }

  if (mappedRow.productName && mappedRow.vendorCode) {
    const existingProduct = await Product.findOne({
      productName: mappedRow.productName,
      vendorCode: mappedRow.vendorCode,
    });
    if (existingProduct) {
      return {
        existingProduct,
        matchReason: `Matched by productName ${mappedRow.productName} and vendorCode ${mappedRow.vendorCode}`,
      };
    }
  }

  return { existingProduct: null, matchReason: null };
};

const analyzeProductRows = async (rows, { persist = false, forceCreate = false } = {}) => {
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const skippedRows = [];
  const rowResults = [];

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const mappedRow = mapProductRow(rows[index]);

    if (!mappedRow.productName) {
      skippedCount += 1;
      const reason = "Missing productName";
      skippedRows.push({ rowNumber, reason });
      rowResults.push({ rowNumber, action: "skip", reason, productName: "" });
      continue;
    }

    try {
      const { existingProduct, matchReason } = forceCreate
        ? { existingProduct: null, matchReason: "Force create mode enabled" }
        : await getProductMatch(mappedRow);

      if (existingProduct && !forceCreate) {
        if (persist) {
          Object.entries(mappedRow).forEach(([field, value]) => {
            if (typeof value !== "undefined") existingProduct[field] = value;
          });
          await existingProduct.save();
        }
        updatedCount += 1;
        rowResults.push({
          rowNumber,
          action: "update",
          reason: matchReason,
          productName: mappedRow.productName,
        });
        continue;
      }

      if (persist) {
        await Product.create(mappedRow);
      }
      insertedCount += 1;
      rowResults.push({
        rowNumber,
        action: "insert",
        reason: forceCreate ? "Force create mode enabled" : "New product will be inserted",
        productName: mappedRow.productName,
      });
    } catch (error) {
      skippedCount += 1;
      skippedRows.push({ rowNumber, reason: error.message });
      rowResults.push({
        rowNumber,
        action: "skip",
        reason: error.message,
        productName: mappedRow.productName || "",
      });
    }
  }

  return {
    insertedCount,
    updatedCount,
    skippedCount,
    skippedRows,
    rowResults,
    note: forceCreate
      ? "Force create mode inserts every imported product row as a new record."
      : "Matching product rows update existing product records; non-matching rows are inserted.",
  };
};

const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    return res.status(201).json({ success: true, message: "Product created successfully", product });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create product", error: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch products", error: error.message });
  }
};

const previewProductImport = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const forceCreate = Boolean(req.body?.forceCreate);
    if (!rows.length) {
      return res.status(400).json({ success: false, message: "No rows found in the uploaded sheet" });
    }
    const preview = await analyzeProductRows(rows, { persist: false, forceCreate });
    return res.status(200).json({ success: true, message: "Product import preview generated", ...preview });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to preview product import", error: error.message });
  }
};

const importProducts = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const forceCreate = Boolean(req.body?.forceCreate);
    if (!rows.length) {
      return res.status(400).json({ success: false, message: "No rows found in the uploaded sheet" });
    }
    const result = await analyzeProductRows(rows, { persist: true, forceCreate });
    return res.status(200).json({ success: true, message: "Product import completed", ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to import products", error: error.message });
  }
};

export { createProduct, getAllProducts, previewProductImport, importProducts };