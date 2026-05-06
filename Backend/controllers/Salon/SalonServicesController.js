import SalonService from "../../models/Salon/SalonServicesModel.js";

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const serviceAliases = {
  category: "category",
  type: "type",
  servicename: "serviceName",
  service_name: "serviceName",
  price: "price",
};

const mapServiceRow = (row) => {
  const mappedRow = {};
  Object.entries(row || {}).forEach(([header, rawValue]) => {
    const targetField = serviceAliases[normalizeHeader(header)];
    if (!targetField) return;
    if (targetField === "price") {
      const numericValue = Number(String(rawValue).replace(/[^0-9.-]/g, ""));
      if (!Number.isNaN(numericValue)) mappedRow.price = numericValue;
      return;
    }
    if (rawValue !== null && typeof rawValue !== "undefined" && String(rawValue).trim() !== "") {
      mappedRow[targetField] = String(rawValue).trim().toUpperCase();
    }
  });
  return mappedRow;
};

const ensureTypePrices = (services, types) =>
  services.map((service) => {
    const nextPrices = {};
    types.forEach((type) => {
      nextPrices[type] = Number(service.prices?.[type] ?? 0);
    });
    return {
      name: service.name,
      prices: nextPrices,
    };
  });

const buildServicePreviewReason = (categoryDoc, row) => {
  if (!categoryDoc) {
    return `Category ${row.category} does not exist and will be inserted`;
  }
  const existingService = categoryDoc.services.find((service) => service.name === row.serviceName);
  if (!existingService) {
    return `Category ${row.category} exists, and service ${row.serviceName} will be inserted`;
  }
  if (!(row.type in Object.fromEntries(existingService.prices))) {
    return `Service ${row.serviceName} exists, and price for type ${row.type} will be inserted`;
  }
  return `Matched ${row.category} / ${row.serviceName} / ${row.type}`;
};

const analyzeServiceRows = async (rows, { persist = false, forceCreate = false } = {}) => {
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const skippedRows = [];
  const rowResults = [];

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const mappedRow = mapServiceRow(rows[index]);

    if (!mappedRow.category || !mappedRow.type || !mappedRow.serviceName || typeof mappedRow.price === "undefined") {
      const reason = "Missing category, type, serviceName, or price";
      skippedCount += 1;
      skippedRows.push({ rowNumber, reason });
      rowResults.push({ rowNumber, action: "skip", reason, label: mappedRow.serviceName || "" });
      continue;
    }

    try {
      const categoryDoc = await SalonService.findOne({ category: mappedRow.category });
      const existingService = categoryDoc?.services.find((service) => service.name === mappedRow.serviceName);
      const willUpdate = categoryDoc && existingService && !forceCreate;

      if (persist) {
        if (!categoryDoc) {
          await SalonService.create({
            category: mappedRow.category,
            types: [mappedRow.type],
            services: [{ name: mappedRow.serviceName, prices: { [mappedRow.type]: mappedRow.price } }],
          });
        } else {
          const nextTypes = Array.from(new Set([...(categoryDoc.types || []), mappedRow.type]));
          let nextServices = ensureTypePrices(categoryDoc.services || [], nextTypes);

          const serviceIndex = nextServices.findIndex((service) => service.name === mappedRow.serviceName);
          if (serviceIndex >= 0 && !forceCreate) {
            nextServices[serviceIndex].prices[mappedRow.type] = mappedRow.price;
          } else {
            const newPrices = {};
            nextTypes.forEach((type) => {
              newPrices[type] = type === mappedRow.type ? mappedRow.price : 0;
            });
            nextServices.push({ name: mappedRow.serviceName, prices: newPrices });
          }

          categoryDoc.types = nextTypes;
          categoryDoc.services = nextServices;
          await categoryDoc.save();
        }
      }

      if (willUpdate) {
        updatedCount += 1;
        rowResults.push({
          rowNumber,
          action: "update",
          reason: buildServicePreviewReason(categoryDoc, mappedRow),
          label: `${mappedRow.category} / ${mappedRow.serviceName}`,
        });
      } else {
        insertedCount += 1;
        rowResults.push({
          rowNumber,
          action: "insert",
          reason: forceCreate ? "Force create mode enabled" : buildServicePreviewReason(categoryDoc, mappedRow),
          label: `${mappedRow.category} / ${mappedRow.serviceName}`,
        });
      }
    } catch (error) {
      skippedCount += 1;
      skippedRows.push({ rowNumber, reason: error.message });
      rowResults.push({ rowNumber, action: "skip", reason: error.message, label: mappedRow.serviceName || "" });
    }
  }

  return {
    insertedCount,
    updatedCount,
    skippedCount,
    skippedRows,
    rowResults,
    note: forceCreate
      ? "Force create mode inserts imported salon service rows as new service entries."
      : "Matching salon service rows update existing prices; non-matching rows are inserted.",
  };
};

const createServices = async (req, res) => {
  try {
    const categories = req.body; // Directly get the array from request body

    // Validate input is an array
    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request format - expected array of categories",
      });
    }

    // Process categories
    const createdServices = [];

    for (const categoryData of categories) {
      const { category, types, services } = categoryData;

      // Validate category data structure
      if (!category || !types || !services) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields in category object",
        });
      }

      // Validate types
      if (!Array.isArray(types) || types.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Types must be a non-empty array",
        });
      }

      // Check for existing category
      const existingCategory = await SalonService.findOne({ category });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: `Category ${category} already exists`,
        });
      }

      // Validate services
      const validatedServices = services.map((service) => {
        // Check if prices match types
        const missingTypes = types.filter((t) => !(t in service.prices));
        if (missingTypes.length > 0) {
          throw new Error(
            `Service ${service.name} missing prices for: ${missingTypes.join(
              ", "
            )}`
          );
        }

        return {
          name: service.name,
          prices: service.prices,
        };
      });

      // Create and save service
      const newService = new SalonService({
        category,
        types,
        services: validatedServices,
      });

      const savedService = await newService.save();
      createdServices.push(savedService);
    }

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      // data: createdServices,
    });
  } catch (error) {
    console.error("Error creating salon services:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const getServices = async (req, res) => {
  try {
    const services = await SalonService.find({});

    return res.status(200).json({ success: true, services });
  } catch (error) {
    console.log("Error fetching services:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    let { category, types, services } = req.body;

    console.log("Update request body:", req.body);
    console.log("Update request ID:", id);

    // Validate input
    if (!category || !types || !services) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: category, types, or services",
      });
    }

    // Find existing category
    const existingCategory = await SalonService.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    console.log("Existing category:", existingCategory);

    services = services.map((service) => {
      let prices = {};
      types.forEach((type) => {
        prices[type] = service.prices?.[type] || "";
      });
      return {
        name: service.name,
        prices,
      };
    });

    // Update category
    const updatedCategory = await SalonService.findByIdAndUpdate(
      id,
      {
        category,
        types,
        services,
      },
      { new: true, runValidators: true }
    );

    console.log("Updated category:", updatedCategory);

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCategory = await SalonService.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: deletedCategory,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const previewServicesImport = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const forceCreate = Boolean(req.body?.forceCreate);
    if (!rows.length) {
      return res.status(400).json({ success: false, message: "No rows found in the uploaded sheet" });
    }
    const preview = await analyzeServiceRows(rows, { persist: false, forceCreate });
    return res.status(200).json({ success: true, message: "Salon services import preview generated", ...preview });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to preview salon services import", error: error.message });
  }
};

const importServices = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const forceCreate = Boolean(req.body?.forceCreate);
    if (!rows.length) {
      return res.status(400).json({ success: false, message: "No rows found in the uploaded sheet" });
    }
    const result = await analyzeServiceRows(rows, { persist: true, forceCreate });
    return res.status(200).json({ success: true, message: "Salon services import completed", ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to import salon services", error: error.message });
  }
};

export { createServices, getServices, updateService, deleteService, previewServicesImport, importServices };
