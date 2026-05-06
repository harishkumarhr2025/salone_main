import Guest from "../models/GuestModel.js";
import { Room } from "../models/RoomModel.js";
import { generateGRCNo } from "../utils/generateGRCNo.js";
import { CheckOutEmail } from "../utils/CheckOutEmail.js";
import { SendEmail } from "../utils/SendEmail.js";
import mongoose from "mongoose";
import moment from "moment";
// import { generateHTMLInvoice } from "../utils/InvoiceServices.js";

const importableGuestFields = [
  "GRC_No",
  "financialYear",
  "Guest_name",
  "Guest_picture",
  "Guest_email",
  "Guest_type",
  "Guest_aadhar_No",
  "Contact_number",
  "Guest_address",
  "Emergency_number",
  "Arrival_date",
  "Arrival_time",
  "Checkout_date",
  "Checkout_time",
  "Room_no",
  "Room_type",
  "Room_tariff",
  "Adults",
  "Children",
  "Booking_details",
  "Purpose_of_visit",
  "Payment_type",
  "Agent_commission",
  "Profession_type",
  "status",
  "totalRoomRent",
  "GSTAmount",
  "grand_total",
  "remark",
  "Guest_nationality",
  "meal_plan",
  "registration_fee",
  "advance_deposit",
  "bedNumber",
];

const normalizedFieldLookup = importableGuestFields.reduce((lookup, field) => {
  lookup[normalizeFieldName(field)] = field;
  return lookup;
}, {});

const headerAliases = {
  grcno: "GRC_No",
  grc_no: "GRC_No",
  grcnoo: "GRC_No",
  guestname: "Guest_name",
  guest_name: "Guest_name",
  email: "Guest_email",
  guestemail: "Guest_email",
  guest_email: "Guest_email",
  contact: "Contact_number",
  contactnumber: "Contact_number",
  contact_number: "Contact_number",
  aadharno: "Guest_aadhar_No",
  guestaadharno: "Guest_aadhar_No",
  guest_aadhar_no: "Guest_aadhar_No",
  address: "Guest_address",
  guestaddress: "Guest_address",
  guest_address: "Guest_address",
  adults: "Adults",
  children: "Children",
  purpose: "Purpose_of_visit",
  purposeofvisit: "Purpose_of_visit",
  purpose_of_visit: "Purpose_of_visit",
  roomno: "Room_no",
  room_no: "Room_no",
  roomtype: "Room_type",
  room_type: "Room_type",
  guesttype: "Guest_type",
  guest_type: "Guest_type",
  checkindate: "Arrival_date",
  arrivaldate: "Arrival_date",
  arrival_date: "Arrival_date",
  checkindatetime: "Arrival_date",
  checkintime: "Arrival_time",
  arrivaltime: "Arrival_time",
  arrival_time: "Arrival_time",
  checkoutdate: "Checkout_date",
  checkout_date: "Checkout_date",
  checkouttime: "Checkout_time",
  checkout_time: "Checkout_time",
  totalamount: "grand_total",
  grandtotal: "grand_total",
  grand_total: "grand_total",
  paymenttype: "Payment_type",
  payment_type: "Payment_type",
  status: "status",
  financialyear: "financialYear",
  financial_year: "financialYear",
  roomtariff: "Room_tariff",
  room_tariff: "Room_tariff",
  bookingdetails: "Booking_details",
  booking_details: "Booking_details",
  mealplan: "meal_plan",
  meal_plan: "meal_plan",
  registrationfee: "registration_fee",
  registration_fee: "registration_fee",
  advancedeposit: "advance_deposit",
  advance_deposit: "advance_deposit",
  remark: "remark",
  nationality: "Guest_nationality",
  guestnationality: "Guest_nationality",
  guest_nationality: "Guest_nationality",
  emergencynumber: "Emergency_number",
  emergency_number: "Emergency_number",
  agentcommission: "Agent_commission",
  agent_commission: "Agent_commission",
  professiontype: "Profession_type",
  profession_type: "Profession_type",
  guestpicture: "Guest_picture",
  guest_picture: "Guest_picture",
  totaltroomrent: "totalRoomRent",
  totalroomrent: "totalRoomRent",
  total_room_rent: "totalRoomRent",
  gstamount: "GSTAmount",
  gst_amount: "GSTAmount",
  bednumber: "bedNumber",
  bed_number: "bedNumber",
};

function normalizeFieldName(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const normalizeHeader = (header) =>
  String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const deriveFinancialYear = (dateValue) => {
  const date = dateValue ? moment(dateValue) : moment();
  const currentYear = date.format("YYYY");
  const previousYear = date.clone().subtract(1, "year").format("YYYY");

  return date.month() < 3
    ? `${previousYear}-${currentYear}`
    : `${currentYear}-${Number(currentYear) + 1}`;
};

const parseDateField = (value) => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    const excelEpoch = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(excelEpoch.getTime()) ? undefined : excelEpoch;
  }

  const parsed = moment(value, [moment.ISO_8601, "DD/MM/YYYY", "D/M/YYYY", "DD-MM-YYYY", "D-M-YYYY", "MM/DD/YYYY", "YYYY-MM-DD"], true);
  return parsed.isValid() ? parsed.toDate() : undefined;
};

const parseNumericField = (value) => {
  if (value === null || typeof value === "undefined" || value === "") {
    return undefined;
  }

  const numericValue = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isNaN(numericValue) ? undefined : numericValue;
};

const sanitizeValue = (field, value) => {
  if (value === null || typeof value === "undefined") {
    return undefined;
  }

  if (typeof value === "string") {
    value = value.trim();
  }

  if (value === "") {
    return undefined;
  }

  if (["Arrival_date", "Checkout_date"].includes(field)) {
    return parseDateField(value);
  }

  if (["grand_total", "registration_fee", "advance_deposit", "GSTAmount", "totalRoomRent"].includes(field)) {
    return parseNumericField(value);
  }

  if (["Room_tariff", "Agent_commission"].includes(field)) {
    const numericValue = parseNumericField(value);
    return typeof numericValue === "undefined" ? undefined : String(numericValue);
  }

  if (["Adults", "Children"].includes(field)) {
    const numericValue = parseNumericField(value);
    return typeof numericValue === "undefined" ? undefined : String(numericValue);
  }

  if (["Contact_number", "Emergency_number", "Guest_aadhar_No", "GRC_No", "Room_no", "bedNumber"].includes(field)) {
    return String(value).trim();
  }

  if (field === "meal_plan") {
    return String(value)
      .split(/[|,]/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  if (field === "status") {
    const normalized = String(value).trim().toLowerCase();
    if (["checked out", "checked-out", "checkout"].includes(normalized)) {
      return "checked-out";
    }
    if (["active", "checked in", "checked-in"].includes(normalized)) {
      return "active";
    }
    return normalized;
  }

  return value;
};

const mapImportedGuestRow = (row) => {
  const mappedRow = {};

  Object.entries(row || {}).forEach(([header, rawValue]) => {
    const normalizedHeader = normalizeHeader(header);
    const targetField = headerAliases[normalizedHeader] || normalizedFieldLookup[normalizedHeader];

    if (!targetField) {
      return;
    }

    const sanitizedValue = sanitizeValue(targetField, rawValue);
    if (typeof sanitizedValue !== "undefined") {
      mappedRow[targetField] = sanitizedValue;
    }
  });

  if (!mappedRow.status) {
    mappedRow.status = mappedRow.Checkout_date ? "checked-out" : "active";
  }

  if (!mappedRow.financialYear) {
    mappedRow.financialYear = deriveFinancialYear(mappedRow.Arrival_date);
  }

  return mappedRow;
};

const getNextGRCNumber = async (financialYear, cache) => {
  if (!cache.has(financialYear)) {
    const [lastGuest] = await Guest.aggregate([
      { $match: { financialYear } },
      {
        $project: {
          numericGRC: {
            $convert: { input: "$GRC_No", to: "int", onError: 0 },
          },
        },
      },
      { $sort: { numericGRC: -1 } },
      { $limit: 1 },
    ]);

    cache.set(financialYear, lastGuest?.numericGRC || 0);
  }

  const nextValue = cache.get(financialYear) + 1;
  cache.set(financialYear, nextValue);

  return String(nextValue).padStart(3, "0");
};

const findExistingGuest = async (mappedRow) => {
  if (mappedRow.GRC_No && mappedRow.financialYear) {
    const existingGuest = await Guest.findOne({
      GRC_No: mappedRow.GRC_No,
      financialYear: mappedRow.financialYear,
    });

    if (existingGuest) {
      return existingGuest;
    }
  }

  if (mappedRow.Guest_aadhar_No) {
    const existingGuest = await Guest.findOne({
      Guest_aadhar_No: mappedRow.Guest_aadhar_No,
    });

    if (existingGuest) {
      return existingGuest;
    }
  }

  if (mappedRow.Contact_number && mappedRow.Guest_name) {
    return Guest.findOne({
      Contact_number: mappedRow.Contact_number,
      Guest_name: mappedRow.Guest_name,
    });
  }

  return null;
};

const getExistingGuestMatch = async (mappedRow) => {
  if (mappedRow.GRC_No && mappedRow.financialYear) {
    const existingGuest = await Guest.findOne({
      GRC_No: mappedRow.GRC_No,
      financialYear: mappedRow.financialYear,
    });

    if (existingGuest) {
      return {
        existingGuest,
        matchReason: `Matched by GRC_No ${mappedRow.GRC_No} and financialYear ${mappedRow.financialYear}`,
      };
    }
  }

  if (mappedRow.Guest_aadhar_No) {
    const existingGuest = await Guest.findOne({
      Guest_aadhar_No: mappedRow.Guest_aadhar_No,
    });

    if (existingGuest) {
      return {
        existingGuest,
        matchReason: `Matched by Guest_aadhar_No ${mappedRow.Guest_aadhar_No}`,
      };
    }
  }

  if (mappedRow.Contact_number && mappedRow.Guest_name) {
    const existingGuest = await Guest.findOne({
      Contact_number: mappedRow.Contact_number,
      Guest_name: mappedRow.Guest_name,
    });

    if (existingGuest) {
      return {
        existingGuest,
        matchReason: `Matched by Contact_number ${mappedRow.Contact_number} and Guest_name ${mappedRow.Guest_name}`,
      };
    }
  }

  return {
    existingGuest: null,
    matchReason: null,
  };
};

const analyzeImportRows = async (rows, options = {}) => {
  const { persist = false, forceCreate = false } = options;
  const grcCache = new Map();
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const skippedRows = [];
  const rowResults = [];

  for (let index = 0; index < rows.length; index += 1) {
    const mappedRow = mapImportedGuestRow(rows[index]);
    const rowNumber = index + 2;

    if (!mappedRow.Guest_name && !mappedRow.Contact_number && !mappedRow.GRC_No) {
      skippedCount += 1;
      const reason = "Missing identifying guest data";
      skippedRows.push({ rowNumber, reason });
      rowResults.push({
        rowNumber,
        action: "skip",
        reason,
        guestName: mappedRow.Guest_name || "",
      });
      continue;
    }

    try {
      const { existingGuest, matchReason } = forceCreate
        ? { existingGuest: null, matchReason: "Force create mode enabled" }
        : await getExistingGuestMatch(mappedRow);

      if (existingGuest && !forceCreate) {
        if (persist) {
          Object.entries(mappedRow).forEach(([field, value]) => {
            if (typeof value !== "undefined") {
              existingGuest[field] = value;
            }
          });

          await existingGuest.save();
        }

        updatedCount += 1;
        rowResults.push({
          rowNumber,
          action: "update",
          reason: matchReason,
          guestName: mappedRow.Guest_name || existingGuest.Guest_name || "",
          existingGuestId: existingGuest._id,
          existingGuestName: existingGuest.Guest_name,
          existingGRCNo: existingGuest.GRC_No,
        });
        continue;
      }

      const rowToInsert = { ...mappedRow };
      const needsGeneratedGrc = forceCreate || !rowToInsert.GRC_No;

      if (needsGeneratedGrc) {
        rowToInsert.GRC_No = await getNextGRCNumber(rowToInsert.financialYear, grcCache);
      }

      if (persist) {
        const importedGuest = new Guest({
          ...rowToInsert,
          status: rowToInsert.status || "active",
          Guest_ID_Proof: rowToInsert.Guest_ID_Proof || [],
        });

        await importedGuest.save();
      }

      insertedCount += 1;
      rowResults.push({
        rowNumber,
        action: "insert",
        reason: forceCreate
          ? `Force create mode enabled. New GRC_No ${rowToInsert.GRC_No} will be assigned`
          : `New guest row will be inserted${needsGeneratedGrc ? ` with generated GRC_No ${rowToInsert.GRC_No}` : ""}`,
        guestName: rowToInsert.Guest_name || "",
        GRC_No: rowToInsert.GRC_No,
      });
    } catch (rowError) {
      skippedCount += 1;
      skippedRows.push({
        rowNumber,
        reason: rowError.message,
      });
      rowResults.push({
        rowNumber,
        action: "skip",
        reason: rowError.message,
        guestName: mappedRow.Guest_name || "",
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
      ? "Force create mode inserts every imported row as a new Guest Entry record and generates new GRC numbers when needed."
      : "Matching guest rows update existing Guest records. Non-matching rows are inserted as new Guest Entry records.",
  };
};

const createGuest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { GRC_No, financialYear } = await generateGRCNo(session);
    const { aadharFront, aadharBack, bedId, ...otherFields } = req.body;
    console.log("create Guest body:", req.body);
    // Validate Aadhar images
    if (!aadharFront || !aadharBack) {
      return res.status(400).json({
        success: false,
        message: "Both Aadhar front and back images are required",
      });
    }

    const guest = new Guest({
      ...otherFields,
      GRC_No,
      financialYear,
      status: otherFields.status || "active",
      Guest_ID_Proof: [{ imageUrl: aadharFront }, { imageUrl: aadharBack }],
    });

    const historyEntry = {
      tenant: guest._id,
      checkInDate: new Date(),
      bedId: bedId,
    };

    // Assign Bed
    const updatedRoom = await Room.findOneAndUpdate(
      { "beds._id": bedId, "beds.status": "available" }, // Find the room that contains the bed

      {
        $set: {
          "beds.$[bed].status": "occupied",
          "beds.$[bed].tenant": guest._id,
          "beds.$[bed].movedInAt": Date.now(),
          "beds.$[bed].movedOutAt": null,
        },

        $inc: { currentOccupancy: 1 },
        $push: {
          checkInCheckOutHistory: historyEntry,
          "beds.$[bed].history": historyEntry,
        },
      },
      { new: true, session, arrayFilters: [{ "bed._id": bedId }] }
    );

    if (!updatedRoom) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Bed/Room not found or already occupied",
      });
    }

    await guest.save({ session });
    await session.commitTransaction();

    return res
      .status(201)
      .json({ success: true, message: "Guest Created Successfully", guest });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating guest:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create guest",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

const getAllGuest = async (req, res) => {
  try {
    // Pagination parameter
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Search parameter
    const search = req.query.search?.trim() || "";

    let filter = {};

    if (search) {
      filter.$or = [
        { Guest_name: { $regex: search, $options: "i" } },
        { Guest_email: { $regex: search, $options: "i" } },
        { Guest_aadhar_No: { $regex: search, $options: "i" } },
        { Contact_number: { $regex: search, $options: "i" } },
        { Room_no: { $regex: search, $options: "i" } },
      ];
    }

    if (req.query.guestType) {
      filter.Guest_type = req.query.guestType;
    }
    if (req.query.roomType) {
      filter.Room_type = req.query.roomType;
    }

    // Get total count for pagination
    const total = await Guest.countDocuments(filter);

    const guests = await Guest.find(filter)
      .sort({ Arrival_date: -1 })
      .skip(skip)
      .limit(limit);

    if (!guests) {
      return res.status(200).json({ success: true, message: "No Guest found" });
    }

    //Pagination metadata

    const totalPages = Math.ceil(total / limit);
    const currentPage = page;
    const hasNextPage = page < totalPages;
    const hasPreviousPage = currentPage > 1;

    return res.status(200).json({
      success: true,
      guests,
      pagination: {
        total,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        limit,
      },
      filter: {
        search,
        ...req.query,
      },
    });
  } catch (error) {
    console.error("Error creating guest:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch guest list",
      error: error.message,
    });
  }
};

const fetchGuestById = async (req, res) => {
  try {
    const { guestId } = req.params;

    if (!guestId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide guest ID" });
    }
    const guest = await Guest.findById(guestId).lean();

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
      });
    }
    return res.status(200).json({ success: true, guest });
  } catch (error) {
    console.error("Error fetching guest:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch guest ",
      error: error.message,
    });
  }
};

const updateGuestById = async (req, res) => {
  const { guestId } = req.params;
  console.log("update body:", req.body);

  try {
    if (!guestId) {
      return res
        .status(404)
        .json({ success: false, message: "Please provide guest Id" });
    }
    const { aadharFront, aadharBack, ...restBody } = req.body;
    const updatePayload = { ...restBody };

    if (aadharFront || aadharBack) {
      const existingGuest = await Guest.findById(guestId).select("Guest_ID_Proof");

      if (!existingGuest) {
        return res
          .status(404)
          .json({ success: false, message: "Guest not found" });
      }

      const existingProofs = Array.isArray(existingGuest.Guest_ID_Proof)
        ? existingGuest.Guest_ID_Proof
        : [];

      updatePayload.Guest_ID_Proof = [
        { imageUrl: aadharFront || existingProofs[0]?.imageUrl || "" },
        { imageUrl: aadharBack || existingProofs[1]?.imageUrl || "" },
      ];
    }

    const guest = await Guest.findByIdAndUpdate(guestId, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!guest) {
      return res
        .status(404)
        .json({ success: false, message: "Guest not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Guest details updated successfully",
      data: guest,
    });
  } catch (error) {
    console.error("Error updating guest:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update guest ",
      error: error.message,
    });
  }
};

const guestCheckout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { guestId } = req.params;

    const {
      Checkout_date,
      Checkout_time,
      rent,
      gstAmount,
      grandTotal,
      remark,
    } = req.body;

    if (!Checkout_date || !Checkout_time || !guestId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Checkout date and time are required",
      });
    }
    if (!guestId) {
      return res
        .status(404)
        .json({ success: false, message: "Please provide guest Id" });
    }

    const guestExist = await Guest.findById(guestId).session(session);

    if (!guestExist) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Guest not found or already checked out",
      });
    }

    if (guestExist.status === "checked-out") {
      return res.status(400).json({
        success: false,
        message: "Guest already checked out",
      });
    }

    // Find the room where this guest is currently assigned
    const occupiedRoom = await Room.findOne({
      "beds.tenant": guestId,
      "beds.status": "occupied",
    }).session(session);

    if (!occupiedRoom) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "No room assignment found for this guest",
      });
    }

    // Find the specific bed this guest is occupying

    const occupiedBed = occupiedRoom.beds.find(
      (bed) => bed.tenant?.toString() === guestId && bed.status === "occupied"
    );

    console.log("occupiedBed:", occupiedBed);

    if (!occupiedBed) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "No bed assignment found for this guest",
      });
    }
    const checkoutHistory = {
      tenant: guestId,
      checkOutDate: new Date(Checkout_date),
      bedId: occupiedBed._id,
    };

    // Update the room - free up the bed
    // const updatedRoom = await Room.findOneAndUpdate(
    //   {
    //     "beds.tenant": guestId,
    //   },
    //   {
    //     $set: {
    //       "beds.$[bed].status": "available",
    //       "beds.$[bed].tenant": null,
    //       "beds.$[bed].movedOutAt": Date.now(),
    //     },
    //     $inc: { currentOccupancy: -1 },
    //     $push: {
    //       "beds.$[bed].history": checkoutHistory,
    //       checkInCheckOutHistory: checkoutHistory,
    //     },
    //   },
    //   { new: true, session, arrayFilters: [{ "bed.tenant": guestId }] }
    // );

    // Update room and bed history
    const updatedRoom = await Room.findOneAndUpdate(
      {
        _id: occupiedRoom._id,
        "beds._id": occupiedBed._id,
      },
      {
        $set: {
          "beds.$.status": "available",
          "beds.$.tenant": null,
          "beds.$.movedOutAt": new Date(),
          "beds.$.history.$[bedHist].checkOutDate": new Date(Checkout_date),
          "checkInCheckOutHistory.$[roomHist].checkOutDate": new Date(
            Checkout_date
          ),
        },
        $inc: { currentOccupancy: -1 },
      },
      {
        arrayFilters: [
          { "bedHist.tenant": guestId, "bedHist.checkOutDate": null },
          { "roomHist.tenant": guestId, "roomHist.checkOutDate": null },
        ],
        new: true,
        session,
      }
    );

    if (!updatedRoom) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Failed to update room/bed status",
      });
    }

    console.log("Checkout guest history:", updatedRoom);

    guestExist.Checkout_date = Checkout_date;
    guestExist.Checkout_time = Checkout_time;
    guestExist.status = "checked-out";
    guestExist.totalRoomRent = rent;
    guestExist.GSTAmount = gstAmount;
    guestExist.grand_total = grandTotal;
    guestExist.remark = remark;
    await guestExist.save({ session });

    // Commit transaction before sending email
    await session.commitTransaction();
    session.endSession();

    const formatDate = (date) =>
      new Date(date).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    try {
      const invoiceData = {
        guest_name: guestExist.Guest_name,
        booking_reference: guestExist.GRC_No,
        contact_no: guestExist.Contact_number,
        CheckIn: formatDate(guestExist.Arrival_date),
        CheckOut: formatDate(Checkout_date),
        RoomRent: rent,
        gstAmount: gstAmount,
        TotalCharged: grandTotal,
      };

      // const pdfBuffer = await generateHTMLInvoice(invoiceData);
      const emailOptions = {
        email: guestExist.Guest_email,
        subject: "Mantri In Checkout",
        html: CheckOutEmail(invoiceData),
        // attachments: [
        //   {
        //     content: pdfBuffer.toString("base64"),
        //     filename: `Invoice-${guestExist.GRC_No}.pdf`,
        //     type: "application/pdf",
        //     disposition: "attachment",
        //   },
        // ],
      };
      await SendEmail(emailOptions);
      console.log(`Checkout email sent to ${guestExist.Guest_email}`);
    } catch (error) {
      console.log("Failed to sent the Email");
    }

    return res.status(200).json({
      success: true,
      message: "Guest checkout successfully",
      data: {
        Checkout_date: guestExist.Checkout_date,
        Checkout_time: guestExist.Checkout_time,
        status: guestExist.status,
        guest: guestExist,
        room: updatedRoom,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error checking out guest:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to checkout the guest ",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

const checkGuestExists = async (req, res) => {
  try {
    const { phone } = req.params;

    const existingGuest = await Guest.findOne({
      Contact_number: phone,
    });

    console.log("existingGuest:", existingGuest);

    if (!existingGuest) {
      return res.json({
        exists: false,
        guestDetails: null,
      });
    }
    return res.json({
      exists: true,
      guestDetails: existingGuest,
    });
  } catch (error) {
    console.error("Error checking guest:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

const previewGuestImport = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const forceCreate = Boolean(req.body?.forceCreate);

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "No rows found in the uploaded sheet",
      });
    }

    const preview = await analyzeImportRows(rows, { forceCreate, persist: false });

    return res.status(200).json({
      success: true,
      message: "Guest import preview generated",
      ...preview,
    });
  } catch (error) {
    console.error("Error previewing guest import:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to preview guest import",
      error: error.message,
    });
  }
};

const importGuests = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const forceCreate = Boolean(req.body?.forceCreate);

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "No rows found in the uploaded sheet",
      });
    }

    const result = await analyzeImportRows(rows, { forceCreate, persist: true });

    return res.status(200).json({
      success: true,
      message: "Guest import completed",
      ...result,
      note: `${result.note} Room and bed occupancy are not changed by import.`,
    });
  } catch (error) {
    console.error("Error importing guests:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to import guests",
      error: error.message,
    });
  }
};

export {
  createGuest,
  getAllGuest,
  fetchGuestById,
  updateGuestById,
  guestCheckout,
  checkGuestExists,
  previewGuestImport,
  importGuests,
};
