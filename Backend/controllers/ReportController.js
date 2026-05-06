import mongoose from "mongoose";
import Guest from "../models/GuestModel.js";
import PDFDocument from "pdfkit";
import getStream from "get-stream";

// Initialize fonts
import moment from "moment-timezone";
import Customer from "../models/Salon/CustomerModel.js";
import MonthlyRevenueImport from "../models/Salon/MonthlyRevenueImportModel.js";
import { SendEmail } from "../utils/SendEmail.js";
import { salonDailyReportTemplate } from "../templates/salonDailyReportTemplate.js";
// import moment from "moment";

import {
  generateCumulativePdf,
  generateDailyServicePDF,
  generateEmployeeReportPDF,
  // generateMonthlySalonReportPDF,
  generateSalonReportPDF,
} from "../PDF/Salon/generateSalonReportPDF.js";

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const monthlyReportAliases = {
  date: "date",
  day: "day",
  cash: "cash",
  upi: "upi",
  tips: "tips",
  total: "total",
  note: "note",
};

const parseImportNumber = (value) => {
  if (value === null || typeof value === "undefined" || value === "") return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isNaN(numeric) ? 0 : numeric;
};

const parseMonthlyReportDate = (value, selectedMonth, selectedYear) => {
  if (!value) return null;
  const parsed = moment(value, ["DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD", moment.ISO_8601], true);
  if (parsed.isValid()) return parsed.toDate();
  const dayNumber = parseInt(String(value).replace(/[^0-9]/g, ""), 10);
  if (!Number.isNaN(dayNumber) && dayNumber >= 1 && dayNumber <= 31) {
    return moment(`${selectedYear}-${selectedMonth}-${String(dayNumber).padStart(2, "0")}`, "YYYY-MM-DD", true).toDate();
  }
  return null;
};

const mapMonthlyReportRow = (row, selectedMonth, selectedYear) => {
  const mappedRow = {};
  Object.entries(row || {}).forEach(([header, rawValue]) => {
    const targetField = monthlyReportAliases[normalizeHeader(header)];
    if (!targetField) return;
    if (["cash", "upi", "tips", "total"].includes(targetField)) {
      mappedRow[targetField] = parseImportNumber(rawValue);
      return;
    }
    if (rawValue !== null && typeof rawValue !== "undefined" && String(rawValue).trim() !== "") {
      mappedRow[targetField] = String(rawValue).trim();
    }
  });

  const reportDate = parseMonthlyReportDate(mappedRow.date, selectedMonth, selectedYear);
  if (!reportDate) return null;

  return {
    reportDate,
    month: selectedMonth,
    year: selectedYear,
    cash: mappedRow.cash || 0,
    upi: mappedRow.upi || 0,
    tips: mappedRow.tips || 0,
    total: typeof mappedRow.total === "number" ? mappedRow.total : (mappedRow.cash || 0) + (mappedRow.upi || 0) + (mappedRow.tips || 0),
    note: mappedRow.note || "",
  };
};

const analyzeMonthlyRevenueRows = async (rows, selectedMonth, selectedYear, { persist = false, forceCreate = false } = {}) => {
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const skippedRows = [];
  const rowResults = [];

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const mappedRow = mapMonthlyReportRow(rows[index], selectedMonth, selectedYear);

    if (!mappedRow) {
      const reason = "Missing or invalid date for monthly revenue row";
      skippedCount += 1;
      skippedRows.push({ rowNumber, reason });
      rowResults.push({ rowNumber, action: "skip", reason, label: "" });
      continue;
    }

    try {
      const existingImport = forceCreate
        ? null
        : await MonthlyRevenueImport.findOne({
            reportDate: mappedRow.reportDate,
            month: mappedRow.month,
            year: mappedRow.year,
          });

      if (existingImport && !forceCreate) {
        if (persist) {
          existingImport.cash = mappedRow.cash;
          existingImport.upi = mappedRow.upi;
          existingImport.tips = mappedRow.tips;
          existingImport.total = mappedRow.total;
          existingImport.note = mappedRow.note;
          await existingImport.save();
        }
        updatedCount += 1;
        rowResults.push({
          rowNumber,
          action: "update",
          reason: `Matched imported revenue row for ${moment(mappedRow.reportDate).format("DD/MM/YYYY")}`,
          label: moment(mappedRow.reportDate).format("DD/MM/YYYY"),
        });
        continue;
      }

      if (persist) {
        await MonthlyRevenueImport.create(mappedRow);
      }
      insertedCount += 1;
      rowResults.push({
        rowNumber,
        action: "insert",
        reason: forceCreate ? "Force create mode enabled" : `Imported revenue row for ${moment(mappedRow.reportDate).format("DD/MM/YYYY")}`,
        label: moment(mappedRow.reportDate).format("DD/MM/YYYY"),
      });
    } catch (error) {
      skippedCount += 1;
      skippedRows.push({ rowNumber, reason: error.message });
      rowResults.push({ rowNumber, action: "skip", reason: error.message, label: mappedRow ? moment(mappedRow.reportDate).format("DD/MM/YYYY") : "" });
    }
  }

  return {
    insertedCount,
    updatedCount,
    skippedCount,
    skippedRows,
    rowResults,
    note: forceCreate
      ? "Force create mode inserts every imported monthly revenue row and totals are aggregated by date in the report."
      : "Matching imported monthly revenue rows update existing imported adjustments; non-matching rows are inserted.",
  };
};

const GenerateReport = async (req, res) => {
  console.log("Report body:", req.body);
  try {
    const { fromDate, toDate, roomType, guestType } = req.body;

    // Validate dates
    if (!fromDate || !toDate) {
      return res.status(400).json({ success: false, message: "Both dates are required" });
    }

    const dateFormat = "DD/MM/YYYY";
    const timezone = "Asia/Kolkata"; // Set your actual timezone

    const startMoment = moment(fromDate).tz(timezone).startOf("day");
    const endMoment = moment(toDate).tz(timezone).endOf("day");

    if (!startMoment.isValid() || !endMoment.isValid()) {
      return res.status(400).json({ success: false, message: "Invalid date values" });
    }

    const startDate = startMoment.toDate();
    const endDate = endMoment.toDate();

    const matchFilters = {
      Arrival_date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // Add room type filter if provided and not 'All'
    if (roomType && roomType.toLowerCase() !== "all") {
      const roomFilter = roomType.toLowerCase() === "non-ac" ? "Non-AC" : "AC";
      matchFilters.Room_type = roomFilter;
    }

    // Add guest type filter if provided and not 'All'
    if (guestType && guestType.toLowerCase() !== "all") {
      matchFilters.Guest_type =
        guestType.charAt(0).toUpperCase() + guestType.slice(1).toLowerCase();
    }

    console.log("Final match filters:", JSON.stringify(matchFilters, null, 2));

    // Aggregation pipeline
    const report = await Guest.aggregate([
      {
        $match: matchFilters,
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$Arrival_date",
              timezone: timezone,
            },
          },
          count: { $sum: 1 },
          guests: { $push: "$$ROOT" },
          dailyRoomRent: { $sum: "$totalRoomRent" },
          dailyGST: { $sum: "$GSTAmount" },
          dailyTotal: { $sum: "$grand_total" },
        },
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          guests: 1,
          dailyRoomRent: 1,
          dailyGST: 1,
          dailyTotal: 1,
          _id: 0,
        },
      },
      {
        $sort: { date: 1 },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$count" },
          dailyData: { $push: "$$ROOT" },
          totalRoomRent: { $sum: "$dailyRoomRent" },
          totalGST: { $sum: "$dailyGST" },
          totalRevenue: { $sum: "$dailyTotal" },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          dailyData: 1,
          totalRoomRent: 1,
          totalGST: 1,
          totalRevenue: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      report: report[0] || { total: 0, dailyData: [] },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const generateSalonReport = async (req, res) => {
  try {
    const { fromDate, toDate, staffId, serviceType } = req.body;

    if (!fromDate || !toDate) {
      return res.status(400).json({ success: false, message: "Both dates are required" });
    }

    const timezone = "Asia/Kolkata";
    const startMoment = moment(fromDate).tz(timezone).startOf("day");
    const endMoment = moment(toDate).tz(timezone).endOf("day");

    if (!startMoment.isValid() || !endMoment.isValid()) {
      return res.status(400).json({ success: false, message: "Invalid date values" });
    }

    const aggregationPipeline = [
      { $unwind: "$visits" },
      {
        $lookup: {
          from: "salonbookings",
          localField: "visits.bookings",
          foreignField: "_id",
          as: "bookings",
        },
      },
      { $unwind: "$bookings" },
      {
        $match: {
          "bookings.status": "completed",
          "bookings.createdAt": {
            $gte: startMoment.toDate(),
            $lte: endMoment.toDate(),
          },
        },
      },
      { $unwind: "$bookings.services" },
      // Apply optional filters
      ...(staffId && staffId !== "all"
        ? [{ $match: { "bookings.services.staff": staffId } }]
        : []),
      ...(serviceType && serviceType !== "all"
        ? [{ $match: { "bookings.services.category": serviceType } }]
        : []),
      // Project necessary fields with tips
      {
        $project: {
          customerId: "$_id",
          customerName: "$customerName",
          mobileNumber: "$mobileNumber",
          visitDate: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$bookings.createdAt",
              timezone: timezone,
            },
          },
          serviceName: "$bookings.services.serviceName",
          serviceCategory: "$bookings.services.category",
          serviceVariant: "$bookings.services.variant",
          servicePrice: "$bookings.services.price",
          tipAmount: "$bookings.services.tipAmount", // Added tip amount
          staff: "$bookings.services.staff",
        },
      },
      // Facet for different report sections
      {
        $facet: {
          dailyData: [
            {
              $group: {
                _id: "$visitDate",
                date: { $first: "$visitDate" },
                totalRevenue: { $sum: "$servicePrice" },
                totalTips: { $sum: "$tipAmount" }, // Added tips
                totalServices: { $sum: 1 },
                customers: { $addToSet: "$customerId" },
              },
            },
            {
              $project: {
                _id: 0,
                date: 1,
                totalRevenue: 1,
                totalTips: 1,
                totalServices: 1,
                totalCustomers: { $size: "$customers" },
              },
            },
            { $sort: { date: 1 } },
          ],
          serviceDistribution: [
            {
              $group: {
                _id: "$serviceName",
                serviceName: { $first: "$serviceName" },
                category: { $first: "$serviceCategory" },
                varient: { $first: "$serviceVariant" },
                totalRevenue: { $sum: "$servicePrice" },
                totalTips: { $sum: "$tipAmount" }, // Added tips
                count: { $sum: 1 },
                customers: {
                  $addToSet: {
                    customerId: "$_id",
                    name: "$customerName",
                    phone: "$mobileNumber",
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                serviceName: 1,
                category: 1,
                varient: 1,
                count: 1,
                totalRevenue: 1,
                totalTips: 1,
                customers: 1,
              },
            },
          ],
          staffDistribution: [
            {
              $group: {
                _id: {
                  staff: "$staff",
                  customerId: "$customerId",
                  customerName: "$customerName",
                },
                totalServices: { $sum: 1 },
                totalRevenue: { $sum: "$servicePrice" },
                totalTips: { $sum: "$tipAmount" }, // Added tips
              },
            },
            {
              $group: {
                _id: "$_id.staff",
                customers: {
                  $push: {
                    customerId: "$_id.customerId",
                    customerName: "$_id.customerName",
                    totalServices: "$totalServices",
                    totalRevenue: "$totalRevenue",
                    totalTips: "$totalTips",
                  },
                },
                totalServices: { $sum: "$totalServices" },
                totalRevenue: { $sum: "$totalRevenue" },
                totalTips: { $sum: "$totalTips" }, // Staff-level tips
              },
            },
            {
              $project: {
                _id: 0,
                staff: "$_id",
                customers: 1,
                totalServices: 1,
                totalRevenue: 1,
                totalTips: 1,
              },
            },
          ],
          tipTransactions: [
            {
              $match: {
                tipAmount: { $gt: 0 }, // Only include tipped services
              },
            },
            {
              $group: {
                _id: "$staff",
                staffName: { $first: "$staff" },
                tips: {
                  $push: {
                    customerId: "$customerId",
                    customerName: "$customerName",
                    serviceName: "$serviceName",
                    serviceCategory: "$serviceCategory",
                    serviceVariant: "$serviceVariant",
                    tipAmount: "$tipAmount",
                    date: "$visitDate",
                  },
                },
                totalTips: { $sum: "$tipAmount" },
              },
            },
            {
              $project: {
                _id: 0,
                staff: "$_id",
                tips: 1,
                totalTips: 1,
              },
            },
          ],
          customerDistribution: [
            {
              $group: {
                _id: "$customerId",
                customerName: { $first: "$customerName" },
                mobileNumber: { $first: "$mobileNumber" },
                totalServices: { $sum: 1 },
                totalRevenue: { $sum: "$servicePrice" },
                totalTips: { $sum: "$tipAmount" }, // Added tips
              },
            },
            {
              $project: {
                _id: 0,
                customerId: "$_id",
                customerName: 1,
                mobileNumber: 1,
                totalServices: 1,
                totalRevenue: 1,
                totalTips: 1,
              },
            },
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalCustomers: { $addToSet: "$customerId" },
                totalServices: { $sum: 1 },
                totalRevenue: { $sum: "$servicePrice" },
                totalTips: { $sum: "$tipAmount" }, // Total tips
              },
            },
            {
              $project: {
                _id: 0,
                totalCustomers: { $size: "$totalCustomers" },
                totalServices: 1,
                totalRevenue: 1,
                totalTips: 1,
              },
            },
          ],
        },
      },
      // Format final output
      {
        $unwind: "$totals",
      },
      {
        $project: {
          summary: {
            totalCustomers: "$totals.totalCustomers",
            totalServices: "$totals.totalServices",
            totalRevenue: "$totals.totalRevenue",
            totalTips: "$totals.totalTips", // Include in summary
          },
          dailyData: 1,
          serviceDistribution: 1,
          staffDistribution: 1,
          customerDistribution: 1,
          tipTransactions: 1,
        },
      },
    ];

    const report = await Customer.aggregate(aggregationPipeline);

    res.status(200).json({
      success: true,
      report: report[0] || {
        summary: {
          totalCustomers: 0,
          totalServices: 0,
          totalRevenue: 0,
        },
        dailyData: [],
        serviceDistribution: [],
        staffDistribution: [],
        customerDistribution: [],
      },
    });
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateSalonDailyReport = async ({
  fromDate,
  toDate,
  staffId = "all",
  serviceType = "all",
}) => {
  try {
    const timezone = "Asia/Kolkata";
    const startMoment = moment(fromDate).tz(timezone).startOf("day");
    const endMoment = moment(toDate).tz(timezone).endOf("day");

    if (!startMoment.isValid() || !endMoment.isValid()) {
      return { success: false, error: "Invalid date values" };
    }

    const aggregationPipeline = [
      { $unwind: "$visits" },
      {
        $lookup: {
          from: "salonbookings",
          localField: "visits.bookings",
          foreignField: "_id",
          as: "bookings",
        },
      },
      { $unwind: "$bookings" },
      {
        $match: {
          "bookings.status": "completed",
          "bookings.createdAt": {
            $gte: startMoment.toDate(),
            $lte: endMoment.toDate(),
          },
        },
      },
      { $unwind: "$bookings.services" },
      // Staff details lookup
      {
        $lookup: {
          from: "employees", // Verify your collection name
          localField: "bookings.services.staff",
          foreignField: "_id",
          as: "staffDetails",
        },
      },
      { $unwind: { path: "$staffDetails", preserveNullAndEmptyArrays: true } },
      // Project with staff name
      {
        $project: {
          customerId: "$_id",
          customerName: "$customerName",
          mobileNumber: "$mobileNumber",
          visitDate: {
            $dateToString: {
              format: "dd-MM-yyyy",
              date: "$bookings.createdAt",
              timezone: timezone,
            },
          },
          serviceName: "$bookings.services.serviceName",
          serviceCategory: "$bookings.services.category",
          serviceVariant: "$bookings.services.variant",
          servicePrice: "$bookings.services.price",
          tipAmount: "$bookings.services.tipAmount",
          staffId: "$bookings.services.staff",
          staffName: {
            $ifNull: [
              "$staffDetails.employeeName", // Use your actual field name (employeeName/name/fullName)
              "Unknown Staff", // Fallback name
            ],
          },
        },
      },
      {
        $facet: {
          dailyData: [
            {
              $group: {
                _id: "$visitDate",
                date: { $first: "$visitDate" },
                totalRevenue: { $sum: "$servicePrice" },
                totalTips: { $sum: "$tipAmount" },
                totalServices: { $sum: 1 },
                customers: { $addToSet: "$customerId" },
              },
            },
            {
              $project: {
                _id: 0,
                date: 1,
                totalRevenue: 1,
                totalTips: 1,
                totalServices: 1,
                totalCustomers: { $size: "$customers" },
              },
            },
            { $sort: { date: 1 } },
          ],
          tipTransactions: [
            {
              $match: { tipAmount: { $gt: 0 } },
            },
            {
              $group: {
                _id: "$staffId",
                staffName: { $first: "$staffName" }, // Correct name from projection
                tips: {
                  $push: {
                    customerId: "$customerId",
                    customerName: "$customerName",
                    serviceName: "$serviceName",
                    serviceCategory: "$serviceCategory",
                    serviceVariant: "$serviceVariant",
                    tipAmount: "$tipAmount",
                    date: "$visitDate",
                  },
                },
                totalTips: { $sum: "$tipAmount" },
              },
            },
            {
              $project: {
                _id: 0,
                staffId: "$_id",
                staffName: 1,
                tips: 1,
                totalTips: 1,
              },
            },
          ],
          serviceDistribution: [
            {
              $group: {
                _id: "$serviceName",
                serviceName: { $first: "$serviceName" },
                category: { $first: "$serviceCategory" },
                varient: { $first: "$serviceVariant" },
                totalRevenue: { $sum: "$servicePrice" },
                totalTips: { $sum: "$tipAmount" },
                count: { $sum: 1 },
                customers: {
                  $addToSet: {
                    customerId: "$customerId",
                    name: "$customerName",
                    phone: "$mobileNumber",
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                serviceName: 1,
                category: 1,
                varient: 1,
                count: 1,
                totalRevenue: 1,
                totalTips: 1,
                customers: 1,
              },
            },
          ],
          staffDistribution: [
            {
              $group: {
                _id: "$staffId",
                staffName: { $first: "$staffName" }, // Correct name here
                customers: {
                  $push: {
                    customerId: "$customerId",
                    customerName: "$customerName",
                    totalServices: { $sum: 1 },
                    totalRevenue: { $sum: "$servicePrice" },
                    totalTips: { $sum: "$tipAmount" },
                  },
                },
                totalServices: { $sum: 1 },
                totalRevenue: { $sum: "$servicePrice" },
                totalTips: { $sum: "$tipAmount" },
              },
            },
            {
              $project: {
                _id: 0,
                staffId: "$_id",
                staffName: 1,
                customers: 1,
                totalServices: 1,
                totalRevenue: 1,
                totalTips: 1,
              },
            },
          ],
          customerDistribution: [
            {
              $group: {
                _id: "$customerId",
                customerName: { $first: "$customerName" },
                mobileNumber: { $first: "$mobileNumber" },
                totalServices: { $sum: 1 },
                totalRevenue: { $sum: "$servicePrice" },
                totalTips: { $sum: "$tipAmount" },
              },
            },
            {
              $project: {
                _id: 0,
                customerId: "$_id",
                customerName: 1,
                mobileNumber: 1,
                totalServices: 1,
                totalRevenue: 1,
                totalTips: 1,
              },
            },
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalCustomers: { $addToSet: "$customerId" },
                totalServices: { $sum: 1 },
                totalRevenue: { $sum: "$servicePrice" },
                totalTips: { $sum: "$tipAmount" },
              },
            },
            {
              $project: {
                _id: 0,
                totalCustomers: { $size: "$totalCustomers" },
                totalServices: 1,
                totalRevenue: 1,
                totalTips: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$totals" },
      {
        $project: {
          summary: {
            totalCustomers: "$totals.totalCustomers",
            totalServices: "$totals.totalServices",
            totalRevenue: "$totals.totalRevenue",
            totalTips: "$totals.totalTips",
          },
          dailyData: 1,
          serviceDistribution: 1,
          staffDistribution: 1,
          customerDistribution: 1,
          tipTransactions: 1,
        },
      },
    ];

    const report = await Customer.aggregate(aggregationPipeline);

    return {
      success: true,
      data: report[0] || {
        summary: {
          totalCustomers: 0,
          totalServices: 0,
          totalRevenue: 0,
          totalTips: 0,
        },
        dailyData: [],
        serviceDistribution: [],
        staffDistribution: [],
        customerDistribution: [],
        tipTransactions: [],
      },
    };
  } catch (error) {
    console.error("Report generation error:", error);
    return { success: false, error: error.message };
  }
};

const generateDailyCumulativeReport = async (req, res) => {
  try {
    const { month = new Date().getMonth(), year = new Date().getFullYear() } =
      req.query;
    const timezone = "Asia/Kolkata";

    // Validate and parse dates
    const startDate = moment
      .tz(`${year}-${month + 1}-01`, timezone)
      .startOf("month");
    const endDate = moment(startDate).endOf("month");

    if (!startDate.isValid() || !endDate.isValid()) {
      return res.status(400).json({ error: "Invalid month/year parameters" });
    }

    // Aggregation pipeline
    const aggregationPipeline = [
      { $unwind: "$visits" },
      { $unwind: "$visits.bookings" },
      {
        $lookup: {
          from: "salonbookings",
          localField: "visits.bookings",
          foreignField: "_id",
          as: "booking",
        },
      },
      { $unwind: "$booking" },
      {
        $match: {
          "booking.status": "completed",
          "booking.createdAt": {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$booking.createdAt",
                timezone: timezone,
              },
            },
          },
          dailyRevenue: { $sum: "$booking.totalAmount" },
          dailyTips: { $sum: "$booking.totalTips" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          dailyRevenue: 1,
          dailyTips: 1,
        },
      },
      { $sort: { date: 1 } },
    ];

    // Execute aggregation
    const dailySales = await Customer.aggregate(aggregationPipeline);

    // Generate complete date range
    const daysInMonth = endDate.diff(startDate, "days") + 1;
    const allDates = Array.from({ length: daysInMonth }, (_, i) =>
      moment(startDate).add(i, "days").format("YYYY-MM-DD")
    );

    // Create cumulative report data
    let cumulativeTotal = 0;
    const reportData = allDates.map((currentDate) => {
      const dailySale = dailySales.find((d) => d.date === currentDate) || {
        dailyRevenue: 0,
        dailyTips: 0,
      };

      cumulativeTotal += dailySale.dailyRevenue;

      return {
        date: moment(currentDate).format("DD-MM-YYYY"),
        dayNumber: moment(currentDate).date(),
        dailyRevenue: dailySale.dailyRevenue,
        dailyTips: dailySale.dailyTips,
        cumulativeTotal,
      };
    });

    // Generate PDF using your existing formatter
    const pdfBuffer = await generateCumulativePdf({
      reportData,
      month: startDate.month(),
      year: startDate.year(),
      grandTotal: cumulativeTotal,
    });

    // Send response
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cumulative-report-${
        month + 1
      }-${year}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Cumulative Report Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// const getMonthlyRevenueReport = async (req, res) => {
//   try {
//     const { month, year } = req.query;

//     if (!month || !year) {
//       return res.status(400).json({ error: "Month and year are required" });
//     }

//     const timezone = "Asia/Kolkata";
//     const startDate = moment(`${year}-${month}`, "YYYY-MM")
//       .tz(timezone)
//       .startOf("month");
//     const endDate = moment(startDate).endOf("month");

//     console.log("Start Date:", startDate.format());
//     console.log("End Date:", endDate.format());

//     const aggregationPipeline = [
//       { $unwind: "$visits" },
//       {
//         $match: {
//           "visits.outTime": {
//             $gte: startDate.toDate(),
//             $lte: endDate.toDate(),
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "salonbookings",
//           localField: "visits.bookings",
//           foreignField: "_id",
//           as: "bookings",
//         },
//       },
//       { $unwind: "$bookings" },
//       { $match: { "bookings.status": "completed" } },
//       { $unwind: "$bookings.services" },
//       {
//         $project: {
//           visitDate: {
//             $dateToString: {
//               format: "%d-%m-%Y",
//               date: "$visits.outTime",
//               timezone: timezone,
//             },
//           },
//           paymentMethod: "$bookings.paymentMethod",
//           servicePrice: "$bookings.services.price",
//           tipAmount: "$bookings.services.tipAmount",
//         },
//       },
//       {
//         $group: {
//           _id: "$visitDate",
//           date: { $first: "$visitDate" },
//           cash: {
//             $sum: {
//               $cond: [{ $eq: ["$paymentMethod", "Cash"] }, "$servicePrice", 0],
//             },
//           },
//           upi: {
//             $sum: {
//               $cond: [{ $eq: ["$paymentMethod", "UPI"] }, "$servicePrice", 0],
//             },
//           },
//           tips: { $sum: "$tipAmount" },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           date: 1,
//           cash: 1,
//           upi: 1,
//           tips: 1,
//           total: { $add: ["$cash", "$upi", "$tips"] },
//         },
//       },
//       { $sort: { date: 1 } },
//     ];

//     const dailyRevenue = await Customer.aggregate(aggregationPipeline);

//     // Format data for table
//     const formattedData = dailyRevenue.map((day, index) => ({
//       slNo: index + 1,
//       date: day.date,
//       day: moment(day.date, "DD-MM-YYYY").format("dddd"),
//       cash: day.cash,
//       upi: day.upi,
//       tips: day.tips,
//       total: day.total,
//     }));

//     res.status(200).json({
//       success: true,
//       data: formattedData,
//       totals: {
//         totalCash: formattedData.reduce((acc, day) => acc + day.cash, 0),
//         totalUPI: formattedData.reduce((acc, day) => acc + day.upi, 0),
//         totalTips: formattedData.reduce((acc, day) => acc + day.tips, 0),
//         totalTurnover: formattedData.reduce((acc, day) => acc + day.total, 0),
//       },
//     });
//   } catch (error) {
//     console.error("Daily Revenue Report Error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// const getMonthlyRevenueReport = async (req, res) => {
//   try {
//     const { month, year } = req.query;

//     // Validate input
//     if (!month || !year) {
//       return res.status(400).json({ error: "Month and year are required" });
//     }

//     // Pad month to 2 digits and validate
//     const paddedMonth = String(month).padStart(2, "0");
//     if (!/^(0[1-9]|1[0-2])$/.test(paddedMonth)) {
//       return res.status(400).json({ error: "Invalid month format" });
//     }

//     const timezone = "Asia/Kolkata";
//     const startDate = moment
//       .tz(`${year}-${paddedMonth}-01`, "YYYY-MM-DD", timezone)
//       .startOf("day");
//     const endDate = moment(startDate).endOf("month");

//     // Main aggregation pipeline
//     const aggregationPipeline = [
//       { $unwind: "$visits" },
//       {
//         $match: {
//           "visits.outTime": {
//             $gte: startDate.toDate(),
//             $lte: endDate.toDate(),
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "salonbookings",
//           localField: "visits.bookings",
//           foreignField: "_id",
//           as: "bookings",
//           pipeline: [
//             {
//               $match: { status: "completed" },
//             },
//           ],
//         },
//       },
//       { $unwind: "$bookings" },
//       { $unwind: "$bookings.services" },
//       {
//         $addFields: {
//           paymentMethod: { $ifNull: ["$bookings.paymentMethod", "Cash"] },
//           servicePrice: { $ifNull: ["$bookings.services.price", 0] },
//           tipAmount: { $ifNull: ["$bookings.services.tipAmount", 0] },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             $dateToString: {
//               format: "%Y-%m-%d",
//               date: "$visits.outTime",
//               timezone: timezone,
//             },
//           },
//           cash: {
//             $sum: {
//               $cond: [{ $eq: ["$paymentMethod", "Cash"] }, "$servicePrice", 0],
//             },
//           },
//           upi: {
//             $sum: {
//               $cond: [{ $eq: ["$paymentMethod", "UPI"] }, "$servicePrice", 0],
//             },
//           },
//           tips: { $sum: "$tipAmount" },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           date: "$_id",
//           cash: 1,
//           upi: 1,
//           tips: 1,
//           total: { $add: ["$cash", "$upi", "$tips"] },
//         },
//       },
//       { $sort: { date: 1 } },
//     ];

//     const dailyRevenue = await Customer.aggregate(aggregationPipeline);

//     // Generate complete calendar with zeros for missing dates
//     const daysInMonth = endDate.date();
//     const dateMap = new Map(dailyRevenue.map((item) => [item.date, item]));

//     const completeData = Array.from({ length: daysInMonth }, (_, i) => {
//       const currentDate = moment(startDate).add(i, "days").format("YYYY-MM-DD");
//       return (
//         dateMap.get(currentDate) || {
//           date: currentDate,
//           cash: 0,
//           upi: 0,
//           tips: 0,
//           total: 0,
//         }
//       );
//     });

//     // Format final response
//     const formattedData = completeData.map((day, index) => ({
//       slNo: index + 1,
//       date: moment(day.date).format("DD-MM-YYYY"),
//       day: moment(day.date).format("dddd"),
//       cash: day.cash,
//       upi: day.upi,
//       tips: day.tips,
//       total: day.total,
//     }));

//     // Calculate totals
//     const totals = {
//       totalCash: completeData.reduce((acc, day) => acc + day.cash, 0),
//       totalUPI: completeData.reduce((acc, day) => acc + day.upi, 0),
//       totalTips: completeData.reduce((acc, day) => acc + day.tips, 0),
//       totalTurnover: completeData.reduce((acc, day) => acc + day.total, 0),
//     };

//     res.status(200).json({
//       success: true,
//       data: formattedData,
//       totals,
//     });
//   } catch (error) {
//     console.error("Monthly Revenue Report Error:", error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
//     });
//   }
// };

const getMonthlyRevenueReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const timezone = "Asia/Kolkata";

    // Validate input
    if (!month || !year) {
      return res.status(400).json({ success: false, message: "Month and year are required" });
    }

    // Date handling with proper timezone
    const startDate = moment
      .tz(`${year}-${month.padStart(2, "0")}-01`, "YYYY-MM-DD", timezone)
      .startOf("day");
    const endDate = moment(startDate).endOf("month");

    if (!startDate.isValid() || !endDate.isValid()) {
      return res.status(400).json({ success: false, message: "Invalid date parameters" });
    }

    const aggregationPipeline = [
      { $unwind: "$visits" },
      {
        $lookup: {
          from: "salonbookings",
          localField: "visits.bookings",
          foreignField: "_id",
          as: "bookings",
          pipeline: [
            {
              $match: {
                status: "completed",
                createdAt: {
                  $gte: startDate.toDate(),
                  $lte: endDate.toDate(),
                },
              },
            },
          ],
        },
      },
      { $unwind: "$bookings" },
      { $unwind: "$bookings.services" },
      {
        $lookup: {
          from: "staff",
          localField: "bookings.services.staff",
          foreignField: "_id",
          as: "staffDetails",
        },
      },
      { $unwind: { path: "$staffDetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          paymentMethod: {
            $ifNull: [{ $toUpper: "$bookings.paymentMethod" }, "CASH"],
          },
          servicePrice: { $ifNull: ["$bookings.services.price", 0] },
          tipAmount: { $ifNull: ["$bookings.services.tipAmount", 0] },
          serviceDate: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$bookings.createdAt",
              timezone: timezone,
            },
          },
        },
      },
      {
        $facet: {
          dailyData: [
            {
              $group: {
                _id: "$serviceDate",
                totalRevenue: { $sum: "$servicePrice" },
                totalTips: { $sum: "$tipAmount" },
                totalServices: { $sum: 1 },
                customers: { $addToSet: "$_id" },
              },
            },
            {
              $project: {
                _id: 0,
                date: "$_id",
                totalRevenue: 1,
                totalTips: 1,
                totalServices: 1,
                totalCustomers: { $size: "$customers" },
              },
            },
            { $sort: { date: 1 } },
          ],
          serviceDistribution: [
            {
              $group: {
                _id: {
                  serviceName: "$bookings.services.serviceName",
                  category: "$bookings.services.category",
                  variant: "$bookings.services.variant",
                },
                totalRevenue: { $sum: "$servicePrice" },
                totalTips: { $sum: "$tipAmount" },
                count: { $sum: 1 },
                customers: {
                  $addToSet: {
                    customerId: "$_id",
                    name: "$customerName",
                    phone: "$mobileNumber",
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                serviceName: "$_id.serviceName",
                category: "$_id.category",
                variant: "$_id.variant",
                totalRevenue: 1,
                totalTips: 1,
                count: 1,
                customers: 1,
              },
            },
          ],
          staffDistribution: [
            {
              $group: {
                _id: {
                  staff: "$staffDetails._id",
                  customerId: "$_id",
                  customerName: "$customerName",
                },
                totalServices: { $sum: 1 },
                totalRevenue: { $sum: "$servicePrice" },
                totalTips: { $sum: "$tipAmount" },
              },
            },
            {
              $group: {
                _id: "$_id.staff",
                customers: {
                  $push: {
                    customerId: "$_id.customerId",
                    customerName: "$_id.customerName",
                    totalServices: "$totalServices",
                    totalRevenue: "$totalRevenue",
                    totalTips: "$totalTips",
                  },
                },
                totalServices: { $sum: "$totalServices" },
                totalRevenue: { $sum: "$totalRevenue" },
                totalTips: { $sum: "$totalTips" },
              },
            },
            {
              $project: {
                _id: 0,
                staff: "$_id",
                customers: 1,
                totalServices: 1,
                totalRevenue: 1,
                totalTips: 1,
              },
            },
          ],
          tipTransactions: [
            {
              $match: {
                "bookings.services.tipAmount": { $gt: 0 },
              },
            },
            {
              $project: {
                staff: {
                  _id: "$staffDetails._id",
                  name: "$staffDetails.name",
                },
                customer: {
                  customerId: "$_id",
                  name: "$customerName",
                  phone: "$mobileNumber",
                },
                service: {
                  name: "$bookings.services.serviceName",
                  category: "$bookings.services.category",
                  variant: "$bookings.services.variant",
                },
                tipAmount: 1,
                date: "$serviceDate",
              },
            },
            {
              $group: {
                _id: "$staff._id",
                staff: { $first: "$staff" },
                tips: {
                  $push: {
                    customer: "$customer",
                    service: "$service",
                    tipAmount: "$tipAmount",
                    date: "$date",
                  },
                },
                totalTips: { $sum: "$tipAmount" },
              },
            },
            {
              $project: {
                _id: 0,
                staff: 1,
                tips: 1,
                totalTips: 1,
              },
            },
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalCustomers: { $addToSet: "$_id" },
                totalServices: { $sum: 1 },
                totalRevenue: { $sum: "$servicePrice" },
                totalTips: { $sum: "$tipAmount" },
              },
            },
            {
              $project: {
                _id: 0,
                totalCustomers: { $size: "$totalCustomers" },
                totalServices: 1,
                totalRevenue: 1,
                totalTips: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          dailyData: 1,
          serviceDistribution: 1,
          staffDistribution: 1,
          tipTransactions: 1,
          totals: { $arrayElemAt: ["$totals", 0] },
        },
      },
    ];

    const [report, importedRows] = await Promise.all([
      Customer.aggregate(aggregationPipeline),
      MonthlyRevenueImport.find({
        month: String(month).padStart(2, "0"),
        year: String(year),
      }).lean(),
    ]);

    const result = {
      dailyData: report[0]?.dailyData || [],
      serviceDistribution: report[0]?.serviceDistribution || [],
      staffDistribution: report[0]?.staffDistribution || [],
      tipTransactions: report[0]?.tipTransactions || [],
      summary: report[0]?.totals || {
        totalCustomers: 0,
        totalServices: 0,
        totalRevenue: 0,
        totalTips: 0,
      },
    };

    const mergedDailyData = new Map();

    result.dailyData.forEach((entry) => {
      mergedDailyData.set(entry.date, {
        date: entry.date,
        totalRevenue: entry.totalRevenue || 0,
        totalTips: entry.totalTips || 0,
        totalServices: entry.totalServices || 0,
        totalCustomers: entry.totalCustomers || 0,
        totalUPI: entry.totalUPI || 0,
      });
    });

    importedRows.forEach((entry) => {
      const key = moment(entry.reportDate).format("DD-MM-YYYY");
      const existing = mergedDailyData.get(key) || {
        date: key,
        totalRevenue: 0,
        totalTips: 0,
        totalServices: 0,
        totalCustomers: 0,
        totalUPI: 0,
      };

      existing.totalRevenue += entry.cash || 0;
      existing.totalUPI += entry.upi || 0;
      existing.totalTips += entry.tips || 0;
      mergedDailyData.set(key, existing);
    });

    result.dailyData = Array.from(mergedDailyData.values())
      .sort(
        (left, right) =>
          moment(left.date, "DD-MM-YYYY").valueOf() -
          moment(right.date, "DD-MM-YYYY").valueOf()
      )
      .map((entry) => ({
        ...entry,
        date: moment(entry.date, "DD-MM-YYYY").isValid() ? entry.date : "Invalid Date",
      }));

    result.summary.totalRevenue = result.dailyData.reduce(
      (sum, entry) => sum + (entry.totalRevenue || 0) + (entry.totalUPI || 0),
      0
    );
    result.summary.totalTips = result.dailyData.reduce(
      (sum, entry) => sum + (entry.totalTips || 0),
      0
    );

    res.status(200).json({
      success: true,
      report: result,
    });
  } catch (error) {
    console.error("Monthly Revenue Report Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

const previewMonthlyRevenueImport = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const forceCreate = Boolean(req.body?.forceCreate);
    const month = String(req.body?.month || "").padStart(2, "0");
    const year = String(req.body?.year || "");

    if (!rows.length) {
      return res.status(400).json({ success: false, message: "No rows found in the uploaded sheet" });
    }

    const preview = await analyzeMonthlyRevenueRows(rows, month, year, { persist: false, forceCreate });
    return res.status(200).json({ success: true, message: "Monthly revenue import preview generated", ...preview });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to preview monthly revenue import", error: error.message });
  }
};

const importMonthlyRevenueReport = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const forceCreate = Boolean(req.body?.forceCreate);
    const month = String(req.body?.month || "").padStart(2, "0");
    const year = String(req.body?.year || "");

    if (!rows.length) {
      return res.status(400).json({ success: false, message: "No rows found in the uploaded sheet" });
    }

    const result = await analyzeMonthlyRevenueRows(rows, month, year, { persist: true, forceCreate });
    return res.status(200).json({ success: true, message: "Monthly revenue import completed", ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to import monthly revenue rows", error: error.message });
  }
};

const sendDailyReportEmail = async (reportData) => {
  try {
    if (!reportData?.summary) {
      throw new Error("Invalid report data structure");
    }

    // console.log("objects:", reportData);
    console.log("reportData:", reportData);

    const htmlContent = await salonDailyReportTemplate(reportData);
    const pdfBuffer = await generateSalonReportPDF(reportData);
    // const SalonMonthlyReport = await generateMonthlySalonReportPDF(reportData);
    // const EmployeeReport = await generateEmployeeReportPDF(reportData);
    // const DailyServiceBook = await generateDailyServicePDF(reportData);

    // console.log("SalonMonthlyReport:", SalonMonthlyReport);

    return SendEmail({
      email: process.env.SALON_DAILY_REPORT_SENT_MAIL,
      subject: `Daily Salon Report - ${moment().format("DD MMM YYYY")}`,
      html: htmlContent,
      attachments: [
        {
          filename: `Salon-Report-${moment().format("DD-MM-YYYY")}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
        // {
        //   filename: `Monthly-Report-${moment().format("DD-MM-YYYY")}.pdf`,
        //   content: SalonMonthlyReport,
        //   contentType: "application/pdf",
        // },
        // {
        //   filename: `Employee-Report-${moment().format("DD-MM-YYYY")}.pdf`,
        //   content: EmployeeReport,
        //   contentType: "application/pdf",
        // },
        // {
        //   filename: `Daily-Service-Book-${moment().format("DD-MM-YYYY")}.pdf`,
        //   content: DailyServiceBook,
        //   contentType: "application/pdf",
        // },
      ],
    });
  } catch (error) {
    console.error("Email Sending Failed:", {
      error: error.message,
      reportData: reportData ? "Exists" : "Undefined",
    });
    throw new Error("Failed to send daily report email");
  }
};

export {
  GenerateReport,
  generateSalonReport,
  generateSalonDailyReport,
  generateDailyCumulativeReport,
  sendDailyReportEmail,
  getMonthlyRevenueReport,
  previewMonthlyRevenueImport,
  importMonthlyRevenueReport,
};
