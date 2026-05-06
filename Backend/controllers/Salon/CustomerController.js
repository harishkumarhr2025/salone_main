import moment from "moment";
import mongoose from "mongoose";
import Customer from "../../models/Salon/CustomerModel.js";
import Counter from "../../models/Salon/CounterModel.js";
import sendWhatsappMessage from "../../utils/sendWhatsappMessage.js";
import SalonBooking from "../../models/Salon/SalonBookingModel.js";
import SalonService from "../../models/Salon/SalonServicesModel.js";
import { SendEmail } from "../../utils/SendEmail.js";
import Employee from "../../models/EMS/EmployeeModel.js";

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const customerAliases = {
  customername: "customerName",
  customer_name: "customerName",
  mobilenumber: "mobileNumber",
  mobile_number: "mobileNumber",
  mobileno: "mobileNumber",
  status: "status",
  isactive: "isActive",
};

const mapCustomerRow = (row) => {
  const mappedRow = {};
  Object.entries(row || {}).forEach(([header, rawValue]) => {
    const targetField = customerAliases[normalizeHeader(header)];
    if (!targetField) return;
    if (targetField === "isActive") {
      mappedRow.isActive = ["true", "1", "yes", "active"].includes(
        String(rawValue).trim().toLowerCase()
      );
      return;
    }
    if (targetField === "status") {
      mappedRow.isActive = ["true", "1", "yes", "active"].includes(
        String(rawValue).trim().toLowerCase()
      );
      return;
    }
    if (rawValue !== null && typeof rawValue !== "undefined" && String(rawValue).trim() !== "") {
      mappedRow[targetField] = String(rawValue).trim();
    }
  });
  return mappedRow;
};

const getCustomerMatch = async (mappedRow) => {
  if (mappedRow.mobileNumber) {
    const existingCustomer = await Customer.findOne({ mobileNumber: mappedRow.mobileNumber });
    if (existingCustomer) {
      return { existingCustomer, matchReason: `Matched by mobileNumber ${mappedRow.mobileNumber}` };
    }
  }
  return { existingCustomer: null, matchReason: null };
};

const analyzeCustomerRows = async (rows, { persist = false, forceCreate = false } = {}) => {
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const skippedRows = [];
  const rowResults = [];

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const mappedRow = mapCustomerRow(rows[index]);

    if (!mappedRow.customerName || !mappedRow.mobileNumber) {
      const reason = "Missing customerName or mobileNumber";
      skippedCount += 1;
      skippedRows.push({ rowNumber, reason });
      rowResults.push({ rowNumber, action: "skip", reason, label: mappedRow.customerName || "" });
      continue;
    }

    try {
      const { existingCustomer, matchReason } = forceCreate
        ? { existingCustomer: null, matchReason: "Force create mode enabled" }
        : await getCustomerMatch(mappedRow);

      if (existingCustomer && !forceCreate) {
        if (persist) {
          Object.entries(mappedRow).forEach(([field, value]) => {
            if (typeof value !== "undefined") existingCustomer[field] = value;
          });
          await existingCustomer.save();
        }
        updatedCount += 1;
        rowResults.push({ rowNumber, action: "update", reason: matchReason, label: mappedRow.customerName });
        continue;
      }

      if (persist) {
        await Customer.create({
          customerName: mappedRow.customerName,
          mobileNumber: mappedRow.mobileNumber,
          isActive: typeof mappedRow.isActive === "boolean" ? mappedRow.isActive : true,
          visits: [],
        });
      }
      insertedCount += 1;
      rowResults.push({
        rowNumber,
        action: "insert",
        reason: forceCreate ? "Force create mode enabled" : "New customer will be inserted",
        label: mappedRow.customerName,
      });
    } catch (error) {
      skippedCount += 1;
      skippedRows.push({ rowNumber, reason: error.message });
      rowResults.push({ rowNumber, action: "skip", reason: error.message, label: mappedRow.customerName || "" });
    }
  }

  return {
    insertedCount,
    updatedCount,
    skippedCount,
    skippedRows,
    rowResults,
    note: forceCreate
      ? "Force create mode inserts every imported salon customer row as a new record."
      : "Matching salon customer rows update existing customers; non-matching rows are inserted.",
  };
};

const addCustomer = async (req, res) => {
  try {
    const { customerName, mobileNumber } = req.body;

    if (!customerName || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Customer name and mobile number are required",
      });
    }

    // Check for existing customer
    const existingCustomer = await Customer.findOne({
      mobileNumber,
    })
      .populate("visits")
      .exec();

    // Generate service number for the visit (not the customer)
    const counter = await Counter.findOneAndUpdate(
      { _id: "serviceNumber" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const serviceNumber = `LMS${counter.seq.toString().padStart(4, "0")}`;

    // Create new visit if Customer already  exists
    const newVisit = {
      inTime: Date.now(),
      serviceNumber,
      isActive: true,
    };

    const whatsappMessageOptions = {
      body: `Welcome to Likeme Salon! 
            We're thrilled to have you here 💇‍♀️✨ Whether you're in for a fresh cut, 
            a relaxing facial, or a quick touch-up — you're in great hands.
            Sit back, relax, and let us pamper you.  
            If you need anything during your visit, feel free to ask. 💁‍♀️
            – Team Likeme 💖`,
      to: mobileNumber,
    };

    console.log("existingCustomer", existingCustomer);

    if (existingCustomer) {
      if (existingCustomer.isActive === true) {
        return res.status(400).json({
          success: false,
          message: "Customer is already taking service",
        });
      }
    }

    if (existingCustomer) {
      existingCustomer.isActive = true;
      existingCustomer.visits.push(newVisit);
      await existingCustomer.save();

      await sendWhatsappMessage(whatsappMessageOptions);

      return res.status(200).json({
        success: true,
        message: "Customer visit updated successfully",
        customer: existingCustomer,
        visit: newVisit,
      });
    }

    // Create new customer if not exists
    const newCustomer = new Customer({
      customerName,
      mobileNumber,
      visits: [newVisit],
    });

    const savedCustomer = await newCustomer.save();

    await sendWhatsappMessage(whatsappMessageOptions);

    return res.status(201).json({
      success: true,
      message: "Customer added successfully",
      customer: savedCustomer,
      visit: newVisit,
    });
  } catch (error) {
    console.error("Error processing customer:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status } = req.query;
    const skip = (page - 1) * limit;

    // Build search filter
    const searchFilter = {};
    if (search) {
      const searchRegex = new RegExp(search, "i");
      searchFilter.$or = [
        { customerName: searchRegex },
        { mobileNumber: searchRegex },
        { email: searchRegex },
        { "visits.serviceNumber": searchRegex },
      ];
    }

    // Build status filter
    const statusFilter = {};
    if (status === "active") {
      statusFilter.isActive = true;
    } else if (status === "inactive") {
      statusFilter.isActive = false;
    }

    // Get counts (without status filter)
    const [totalActive, totalAll] = await Promise.all([
      Customer.countDocuments({ ...searchFilter, isActive: true }),
      Customer.countDocuments(searchFilter),
    ]);

    // Get paginated results (with status filter)
    const [customers, totalFiltered] = await Promise.all([
      Customer.find({ ...searchFilter, ...statusFilter })
        .sort({ isActive: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments({ ...searchFilter, ...statusFilter }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        customers: customers.map((c) => ({
          ...c,
          visitCount: c.visits.length,
        })),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalFiltered / limit),
          totalDocuments: totalFiltered,
          limit: Number(limit),
        },
        counts: {
          totalActiveCustomer: totalActive,
          totalAllCustomers: totalAll,
          totalVisits: customers.reduce((sum, c) => sum + c.visits.length, 0),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getCustomerWithId = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });
    const totalVisits = customer.visits.length;
    console.log("Visits", customer.visits);
    const latestVisit = customer.visits
      .slice() // to avoid mutating the original array
      .sort((a, b) => new Date(b.inTime) - new Date(a.inTime))[0];
    // const lastVisit =
    //   moment(customer.visits[0]?.inTime).format("DD-MMM-YYYY, hh:mm A") || null;
    const lastVisit = latestVisit
      ? moment(latestVisit.inTime).format("DD-MMM-YYYY, hh:mm A")
      : null;
    const customerDetails = {
      customer,
      lastVisit,
      totalVisits,
    };
    return res.status(200).json({ success: true, customerDetails });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const previewCustomerImport = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const forceCreate = Boolean(req.body?.forceCreate);
    if (!rows.length) {
      return res.status(400).json({ success: false, message: "No rows found in the uploaded sheet" });
    }
    const preview = await analyzeCustomerRows(rows, { persist: false, forceCreate });
    return res.status(200).json({ success: true, message: "Salon customer import preview generated", ...preview });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to preview salon customers import", error: error.message });
  }
};

const importCustomers = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const forceCreate = Boolean(req.body?.forceCreate);
    if (!rows.length) {
      return res.status(400).json({ success: false, message: "No rows found in the uploaded sheet" });
    }
    const result = await analyzeCustomerRows(rows, { persist: true, forceCreate });
    return res.status(200).json({ success: true, message: "Salon customer import completed", ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to import salon customers", error: error.message });
  }
};

const createCheckout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      visitId,
      customerId,
      services,
      paymentMethods,
      totalPayment,
      discount,
    } = req.body;

    // Validate required fields
    if (
      !visitId ||
      !customerId ||
      !services?.length ||
      !paymentMethods?.length ||
      !totalPayment
    ) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate discount if present
    if (discount) {
      if (
        !["fixed", "percentage"].includes(discount.type) ||
        typeof discount.value === "undefined" ||
        typeof discount.amount === "undefined" ||
        discount.amount < 0
      ) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Invalid discount data" });
      }
    }

    // Validate payment methods
    const validMethods = new Set(["cash", "card", "upi"]);
    const paymentSum = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);

    if (paymentMethods.some((pm) => !validMethods.has(pm.method))) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid payment method type" });
    }

    // Find customer and visit
    const customer = await Customer.findOne({
      _id: customerId,
      "visits._id": visitId,
    }).session(session);

    if (!customer) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Customer or visit not found" });
    }

    const visit = customer.visits.id(visitId);
    if (!visit) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Visit not found" });
    }

    // Process services and calculate totals
    let servicesTotal = 0;
    let totalTips = 0;
    const serviceDetails = [];

    for (const service of services) {
      const categoryDoc = await SalonService.findOne({
        category: service.category,
      }).session(session);

      if (!categoryDoc) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: `Invalid category: ${service.category}` });
      }

      const serviceItem = categoryDoc.services.find(
        (s) => s.name === service.serviceName
      );

      if (!serviceItem) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: `Invalid service: ${service.serviceName}` });
      }

      const price = serviceItem.prices.get(service.variant);
      if (!price) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: `Invalid price variant: ${service.variant}` });
      }

      const staffMember = await Employee.findById(service.staff).session(
        session
      );
      if (!staffMember) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: `Invalid staff ID: ${service.staff}` });
      }

      servicesTotal += price;
      totalTips += service.tipAmount || 0;

      serviceDetails.push({
        service: serviceItem._id,
        category: service.category,
        serviceName: service.serviceName,
        variant: service.variant,
        price: price,
        staff: service.staff,
        tipAmount: service.tipAmount || 0,
      });
    }

    // Apply discount
    let netServicesTotal = servicesTotal;
    if (discount) {
      if (discount.amount > servicesTotal) {
        await session.abortTransaction();
        return res.status(400).json({
          message: "Discount amount exceeds service total",
        });
      }
      netServicesTotal = servicesTotal - discount.amount;
    }

    // Calculate grand total
    const grandTotal = netServicesTotal + totalTips;

    // Validate payment totals
    if (paymentSum !== grandTotal) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Payment sum doesn't match grand total",
        calculatedTotal: grandTotal,
        paymentSum: paymentSum,
        difference: grandTotal - paymentSum,
      });
    }

    if (grandTotal !== Number(totalPayment)) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Total payment mismatch",
        calculatedTotal: grandTotal,
        receivedTotal: totalPayment,
      });
    }

    // Create booking document
    const booking = new SalonBooking({
      customer: customerId,
      visit: visit._id,
      services: serviceDetails,
      paymentMethods: paymentMethods.map((pm) => ({
        method: pm.method,
        amount: pm.amount,
        transactionId: pm.transactionId,
        timestamp: pm.timestamp,
      })),
      originalTotal: servicesTotal,
      totalAmount: netServicesTotal,
      totalTips: totalTips,
      totalPayment: grandTotal,
      paymentStatus: paymentMethods.length > 1 ? "split" : "full",
      status: "completed",
      discount: discount
        ? {
            type: discount.type,
            value: Number(discount.value), // Ensure numeric value
            amount: Number(discount.amount), // Ensure numeric value
            code: discount.code || null,
          }
        : undefined,
      breakdown: {
        servicesTotal: servicesTotal,
        tipsTotal: totalTips,
        ...(discount && {
          discountAmount: discount.amount,
          discountType: discount.type,
        }),
        grandTotal: grandTotal,
      },
    });

    // Save booking
    await booking.save({ session });

    // Update customer visit
    await Customer.updateOne(
      { _id: customerId, "visits._id": visitId },
      {
        $push: { "visits.$.bookings": booking._id },
        $set: {
          "visits.$.isActive": false,
          "visits.$.totalAmount": servicesTotal,
          "visits.$.totalTips": totalTips,
          isActive: false,
        },
      },
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Checkout completed successfully",
      booking: {
        ...booking.toObject(),
        paymentBreakdown: {
          servicesTotal: servicesTotal,
          ...(discount && { discountAmount: discount.amount }),
          tipsTotal: totalTips,
          grandTotal: grandTotal,
        },
      },
      customerId,
      visitId,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Checkout error:", error);
    res.status(500).json({
      message: "Checkout processing failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

const getBookingDetails = async (req, res) => {
  try {
    const { ids } = req.body;
    console.log("booking IDs received:", ids);
    // Validate input
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid request format - expected array of IDs in request body",
      });
    }

    const bookings = await SalonBooking.find({ _id: { $in: ids } }).sort({
      createdAt: -1,
    });

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found with the provided IDs",
      });
    }

    // Log details for debugging
    console.log("bookings:", bookings);
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`);
      booking.services.forEach((service, serviceIndex) => {
        console.log(`  Service ${serviceIndex + 1}:`);
        console.log(`    Variant: ${service.variant}`);
        console.log(`    Price: ${service.price}`);
      });
    });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);

    // Handle specific error types
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const checkCustomerByMobile = async (req, res) => {
  try {
    const { mobileNumber } = req.query;
    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const customer = await Customer.findOne({ mobileNumber });

    return res.status(200).json({
      success: true,
      exists: !!customer,
      customer: customer || null,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// Controller to get tips by staff
const getTipsByStaff = async (req, res) => {
  try {
    const result = await SalonBooking.aggregate([
      { $unwind: "$services" },
      {
        $group: {
          _id: "$services.staff",
          totalTips: { $sum: "$services.tipAmount" },
          totalServices: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "staff",
          localField: "_id",
          foreignField: "_id",
          as: "staffDetails",
        },
      },
      { $unwind: "$staffDetails" },
      {
        $project: {
          staffName: "$staffDetails.employeeName",
          totalTips: 1,
          totalServices: 1,
        },
      },
    ]);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  addCustomer,
  getAllCustomers,
  getCustomerWithId,
  previewCustomerImport,
  importCustomers,
  createCheckout,
  getBookingDetails,
  checkCustomerByMobile,
  getTipsByStaff,
};
