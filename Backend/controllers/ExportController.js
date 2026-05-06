import * as XLSX from "xlsx";
import Agent from "../models/AgentsModel.js";
import User from "../models/AuthModel.js";
import Guest from "../models/GuestModel.js";
import { Room } from "../models/RoomModel.js";
import Employee from "../models/EMS/EmployeeModel.js";
import Attendance from "../models/EMS/AttendanceModel.js";
import Counter from "../models/Salon/CounterModel.js";
import Customer from "../models/Salon/CustomerModel.js";
import SalonBooking from "../models/Salon/SalonBookingModel.js";
import SalonRegistration from "../models/Salon/SalonRegistrationModel.js";
import SalonService from "../models/Salon/SalonServicesModel.js";

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);

const toCellValue = (value) => {
  if (value === null || typeof value === "undefined") {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toCellValue(item)).join(", ");
  }

  if (isPlainObject(value)) {
    if (typeof value.toString === "function" && value.toString() !== "[object Object]") {
      return value.toString();
    }

    return "";
  }

  return value;
};

const flattenObjectFields = (source, prefix = "") => {
  return Object.entries(source || {}).reduce((accumulator, [key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      accumulator[nextKey] = value.every((item) => !isPlainObject(item))
        ? value.map((item) => toCellValue(item)).join(", ")
        : "";
      return accumulator;
    }

    if (isPlainObject(value)) {
      if (typeof value.toString === "function" && value.toString() !== "[object Object]") {
        accumulator[nextKey] = value.toString();
        return accumulator;
      }

      Object.assign(accumulator, flattenObjectFields(value, nextKey));
      return accumulator;
    }

    accumulator[nextKey] = toCellValue(value);
    return accumulator;
  }, {});
};

const withFallback = (rows) => (rows.length ? rows : [{ message: "No records found" }]);

const addSheet = (workbook, sheetName, rows) => {
  const worksheet = XLSX.utils.json_to_sheet(withFallback(rows));
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
};

const formatDateKey = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

const exportDatabaseToExcel = async (req, res) => {
  try {
    const [
      users,
      guests,
      rooms,
      agents,
      employees,
      attendance,
      salonCustomers,
      salonBookings,
      salonServices,
      salonRegistrations,
      salonCounters,
    ] = await Promise.all([
      User.find({}, { password: 0 }).lean(),
      Guest.find().lean(),
      Room.find().lean(),
      Agent.find().lean(),
      Employee.find().lean(),
      Attendance.find().lean(),
      Customer.find().lean(),
      SalonBooking.find().lean(),
      SalonService.find().lean(),
      SalonRegistration.find().lean(),
      Counter.find().lean(),
    ]);

    const workbook = XLSX.utils.book_new();

    const userRows = users.map(({ password, ...user }) => ({
      ...flattenObjectFields(user),
    }));

    const guestRows = guests.map(({ Guest_ID_Proof, ...guest }) => ({
      ...flattenObjectFields(guest),
    }));
    const guestIdProofRows = guests.flatMap((guest) =>
      (guest.Guest_ID_Proof || []).map((proof, index) => ({
        guestId: toCellValue(guest._id),
        proofIndex: index + 1,
        imageUrl: toCellValue(proof.imageUrl),
      }))
    );

    const roomRows = rooms.map(({ amenities, beds, checkInCheckOutHistory, ...room }) => ({
      ...flattenObjectFields(room),
    }));
    const roomAmenityRows = rooms.flatMap((room) =>
      (room.amenities || []).map((amenity, index) => ({
        roomId: toCellValue(room._id),
        roomNumber: toCellValue(room.roomNumber),
        amenityIndex: index + 1,
        name: toCellValue(amenity.name),
        description: toCellValue(amenity.description),
        isAvailable: toCellValue(amenity.isAvailable),
      }))
    );
    const roomBedRows = rooms.flatMap((room) =>
      (room.beds || []).map((bed, index) => ({
        roomId: toCellValue(room._id),
        roomNumber: toCellValue(room.roomNumber),
        bedIndex: index + 1,
        bedId: toCellValue(bed._id),
        bedNumber: toCellValue(bed.bedNumber),
        status: toCellValue(bed.status),
        tenant: toCellValue(bed.tenant),
        movedInAt: toCellValue(bed.movedInAt),
        movedOutAt: toCellValue(bed.movedOutAt),
      }))
    );
    const roomBedHistoryRows = rooms.flatMap((room) =>
      (room.beds || []).flatMap((bed) =>
        (bed.history || []).map((history, index) => ({
          roomId: toCellValue(room._id),
          roomNumber: toCellValue(room.roomNumber),
          bedId: toCellValue(bed._id),
          bedNumber: toCellValue(bed.bedNumber),
          historyIndex: index + 1,
          tenant: toCellValue(history.tenant),
          checkInDate: toCellValue(history.checkInDate),
          checkOutDate: toCellValue(history.checkOutDate),
          movedOutReason: toCellValue(history.movedOutReason),
          createdAt: toCellValue(history.createdAt),
          updatedAt: toCellValue(history.updatedAt),
        }))
      )
    );
    const roomOccupancyHistoryRows = rooms.flatMap((room) =>
      (room.checkInCheckOutHistory || []).map((history, index) => ({
        roomId: toCellValue(room._id),
        roomNumber: toCellValue(room.roomNumber),
        historyIndex: index + 1,
        tenant: toCellValue(history.tenant),
        bedId: toCellValue(history.bedId),
        checkInDate: toCellValue(history.checkInDate),
        checkOutDate: toCellValue(history.checkOutDate),
        movedOutReason: toCellValue(history.movedOutReason),
        createdAt: toCellValue(history.createdAt),
        updatedAt: toCellValue(history.updatedAt),
      }))
    );

    const agentRows = agents.map(({ Agent_commission_history, ...agent }) => ({
      ...flattenObjectFields(agent),
    }));
    const agentCommissionHistoryRows = agents.flatMap((agent) =>
      (agent.Agent_commission_history || []).map((history, index) => ({
        agentId: toCellValue(agent._id),
        agentCode: toCellValue(agent.agent_ID),
        historyIndex: index + 1,
        date: toCellValue(history.date),
        amount: toCellValue(history.amount),
        details: toCellValue(history.details),
      }))
    );

    const employeeRows = employees.map(({ experiences, ...employee }) => ({
      ...flattenObjectFields(employee),
    }));
    const employeeExperienceRows = employees.flatMap((employee) =>
      (employee.experiences || []).map((experience, index) => ({
        employeeId: toCellValue(employee._id),
        employeeCode: toCellValue(employee.employeeId),
        experienceIndex: index + 1,
        ...flattenObjectFields(experience),
      }))
    );

    const attendanceRows = attendance.map((record) => ({
      ...flattenObjectFields(record),
    }));

    const salonCustomerRows = salonCustomers.map(({ visits, ...customer }) => ({
      ...flattenObjectFields(customer),
    }));
    const salonVisitRows = salonCustomers.flatMap((customer) =>
      (customer.visits || []).map((visit, index) => ({
        customerId: toCellValue(customer._id),
        customerName: toCellValue(customer.customerName),
        visitId: toCellValue(visit._id),
        visitIndex: index + 1,
        inTime: toCellValue(visit.inTime),
        outTime: toCellValue(visit.outTime),
        serviceNumber: toCellValue(visit.serviceNumber),
        isActive: toCellValue(visit.isActive),
        totalAmount: toCellValue(visit.totalAmount),
      }))
    );
    const salonVisitBookingRows = salonCustomers.flatMap((customer) =>
      (customer.visits || []).flatMap((visit) =>
        (visit.bookings || []).map((bookingId, index) => ({
          customerId: toCellValue(customer._id),
          visitId: toCellValue(visit._id),
          bookingIndex: index + 1,
          bookingId: toCellValue(bookingId),
        }))
      )
    );

    const salonBookingRows = salonBookings.map(({ services, paymentMethods, ...booking }) => ({
      ...flattenObjectFields(booking),
    }));
    const salonBookingServiceRows = salonBookings.flatMap((booking) =>
      (booking.services || []).map((service, index) => ({
        bookingId: toCellValue(booking._id),
        bookingIndex: index + 1,
        serviceId: toCellValue(service.service),
        category: toCellValue(service.category),
        serviceName: toCellValue(service.serviceName),
        variant: toCellValue(service.variant),
        price: toCellValue(service.price),
        staff: toCellValue(service.staff),
        tipAmount: toCellValue(service.tipAmount),
      }))
    );
    const salonBookingPaymentRows = salonBookings.flatMap((booking) =>
      (booking.paymentMethods || []).map((payment, index) => ({
        bookingId: toCellValue(booking._id),
        paymentIndex: index + 1,
        method: toCellValue(payment.method),
        amount: toCellValue(payment.amount),
        transactionId: toCellValue(payment.transactionId),
        timestamp: toCellValue(payment.timestamp),
      }))
    );

    const salonServiceCategoryRows = salonServices.map(({ services, types, ...serviceCategory }) => ({
      ...flattenObjectFields(serviceCategory),
    }));
    const salonServiceTypeRows = salonServices.flatMap((serviceCategory) =>
      (serviceCategory.types || []).map((type, index) => ({
        serviceCategoryId: toCellValue(serviceCategory._id),
        category: toCellValue(serviceCategory.category),
        typeIndex: index + 1,
        type,
      }))
    );
    const salonServiceItemRows = salonServices.flatMap((serviceCategory) =>
      (serviceCategory.services || []).flatMap((service, serviceIndex) =>
        Object.entries(service.prices || {}).map(([type, price]) => ({
          serviceCategoryId: toCellValue(serviceCategory._id),
          category: toCellValue(serviceCategory.category),
          serviceIndex: serviceIndex + 1,
          serviceName: toCellValue(service.name),
          type,
          price: toCellValue(price),
        }))
      )
    );

    const salonRegistrationRows = salonRegistrations.map((registration) => ({
      ...flattenObjectFields(registration),
    }));

    const salonCounterRows = salonCounters.map((counter) => ({
      ...flattenObjectFields(counter),
    }));

    const salonCompletedBookings = salonBookings.filter((booking) => booking.status === "completed");
    const salonReportSummaryRows = [
      {
        totalCustomers: new Set(salonCustomers.map((customer) => toCellValue(customer._id))).size,
        totalBookings: salonBookings.length,
        completedBookings: salonCompletedBookings.length,
        totalRevenue: salonCompletedBookings.reduce(
          (total, booking) => total + Number(booking.totalAmount || 0),
          0
        ),
        totalTips: salonCompletedBookings.reduce(
          (total, booking) => total + Number(booking.totalTips || 0),
          0
        ),
        totalPayment: salonCompletedBookings.reduce(
          (total, booking) => total + Number(booking.totalPayment || 0),
          0
        ),
      },
    ];

    const salonReportDailyMap = new Map();
    salonCompletedBookings.forEach((booking) => {
      const dateKey = formatDateKey(booking.createdAt);
      if (!dateKey) {
        return;
      }

      const current = salonReportDailyMap.get(dateKey) || {
        date: dateKey,
        totalBookings: 0,
        totalRevenue: 0,
        totalTips: 0,
        totalPayment: 0,
      };

      current.totalBookings += 1;
      current.totalRevenue += Number(booking.totalAmount || 0);
      current.totalTips += Number(booking.totalTips || 0);
      current.totalPayment += Number(booking.totalPayment || 0);

      salonReportDailyMap.set(dateKey, current);
    });
    const salonReportDailyRows = Array.from(salonReportDailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const salonReportServiceMap = new Map();
    salonCompletedBookings.forEach((booking) => {
      (booking.services || []).forEach((service) => {
        const key = [service.category, service.serviceName, service.variant].join("|");
        const current = salonReportServiceMap.get(key) || {
          category: toCellValue(service.category),
          serviceName: toCellValue(service.serviceName),
          variant: toCellValue(service.variant),
          totalServices: 0,
          totalRevenue: 0,
          totalTips: 0,
        };

        current.totalServices += 1;
        current.totalRevenue += Number(service.price || 0);
        current.totalTips += Number(service.tipAmount || 0);

        salonReportServiceMap.set(key, current);
      });
    });
    const salonReportServiceRows = Array.from(salonReportServiceMap.values()).sort((a, b) =>
      a.serviceName.localeCompare(b.serviceName)
    );

    addSheet(workbook, "Users", userRows);
    addSheet(workbook, "Guest Entry", guestRows);
    addSheet(workbook, "Guest Entry ID Proofs", guestIdProofRows);
    addSheet(workbook, "Salon Registration", salonRegistrationRows);
    addSheet(workbook, "Room Management", roomRows);
    addSheet(workbook, "Room Beds", roomBedRows);
    addSheet(workbook, "Room Amenities", roomAmenityRows);
    addSheet(workbook, "Room Bed History", roomBedHistoryRows);
    addSheet(workbook, "Room Occupancy", roomOccupancyHistoryRows);
    addSheet(workbook, "Salon Customers", salonCustomerRows);
    addSheet(workbook, "Salon Visits", salonVisitRows);
    addSheet(workbook, "Salon Visit Bookings", salonVisitBookingRows);
    addSheet(workbook, "Salon Bookings", salonBookingRows);
    addSheet(workbook, "Salon Booking Services", salonBookingServiceRows);
    addSheet(workbook, "Salon Booking Payments", salonBookingPaymentRows);
    addSheet(workbook, "Salon Report Summary", salonReportSummaryRows);
    addSheet(workbook, "Salon Report Daily", salonReportDailyRows);
    addSheet(workbook, "Salon Report Services", salonReportServiceRows);
    addSheet(workbook, "Salon Services", salonServiceCategoryRows);
    addSheet(workbook, "Salon Service Types", salonServiceTypeRows);
    addSheet(workbook, "Salon Service Prices", salonServiceItemRows);
    addSheet(workbook, "Employees", employeeRows);
    addSheet(workbook, "Employee Experiences", employeeExperienceRows);
    addSheet(workbook, "Attendance", attendanceRows);
    addSheet(workbook, "Agents", agentRows);
    addSheet(workbook, "Agent Commission History", agentCommissionHistoryRows);
    addSheet(workbook, "System Counters", salonCounterRows);

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="mantri-inn-export-${timestamp}.xlsx"`
    );

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Database export failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export database to Excel",
    });
  }
};

export { exportDatabaseToExcel };