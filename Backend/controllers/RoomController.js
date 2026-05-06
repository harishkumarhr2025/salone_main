import mongoose from "mongoose";
import { Room } from "../models/RoomModel.js";

const addRoom = async (req, res) => {
  try {
    const { roomNumber, roomType, capacity, floor, amenities } = req.body;

    if (!roomNumber || !roomType || !capacity || !floor || !amenities) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Check if room already exists
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res
        .status(400)
        .json({ success: false, message: "Room number already exists" });
    }

    const generateBeds = (capacity) => {
      return Array.from({ length: capacity }, (_, i) => ({
        bedNumber: String.fromCharCode(65 + i), // A, B, C...
        status: "available",
        tenant: null,
        movedInAt: null,
        movedOutAt: null,
      }));
    };
    //   create new room documents
    const newRoom = new Room({
      roomNumber,
      roomType,
      capacity,
      floor,
      beds: generateBeds(capacity),
      amenities: amenities.filter((a) => a.name.trim() !== ""),
      status: "vacant",
    });

    const savedRoom = await newRoom.save();

    const responseRoom = await Room.findById(savedRoom._id).select(
      "-__v -createdAt -updatedAt -keys -digitalAccessCode"
    );

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: responseRoom,
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, message: messages });
    }

    // Handle other errors
    console.error("Error creating room:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getAllRoom = async (req, res) => {
  try {
    const result = await Room.aggregate([
      {
        $facet: {
          // Calculate bed statistics
          bedStats: [
            { $unwind: "$beds" },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                occupied: {
                  $sum: {
                    $cond: [{ $eq: ["$beds.status", "occupied"] }, 1, 0],
                  },
                },
              },
            },
          ],
          // Get all rooms data
          rooms: [{ $match: {} }],
        },
      },
      {
        $project: {
          totalBed: { $arrayElemAt: ["$bedStats.total", 0] },
          occupiedBed: { $arrayElemAt: ["$bedStats.occupied", 0] },
          vacantBed: {
            $subtract: [
              { $arrayElemAt: ["$bedStats.total", 0] },
              { $arrayElemAt: ["$bedStats.occupied", 0] },
            ],
          },
          rooms: 1,
        },
      },
    ]);

    const { totalBed, occupiedBed, vacantBed, rooms } = result[0];

    return res.status(200).json({
      success: true,
      totalRoom: rooms.length,
      totalBed: totalBed || 0,
      occupiedBed: occupiedBed || 0,
      vacantBed: vacantBed || 0,
      rooms,

      message: "All rooms fetched with bed statistics",
    });
  } catch (error) {
    console.error("Error getting rooms:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const availableRoom = async (req, res) => {
  try {
    const rooms = await Room.find({
      "beds.status": "available",
    }).populate({
      path: "beds",
      match: { status: "available" },
    });

    const totalBeds = rooms.flatMap((room) =>
      room.beds.map((bed) => ({
        ...bed.toObject(),
        roomNumber: room.roomNumber,
        roomId: room._id,
      }))
    );

    return res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, message: messages });
    }

    // Handle other errors
    console.error("Error Getting available room with:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const availableBeds = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId).populate({
      path: "beds",
      match: { status: "available" },
    });

    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    const availableBed = await room.beds.filter(
      (bed) => bed.status === "available"
    );

    return res.status(200).json({ success: true, bed: availableBed });
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, message: messages });
    }

    // Handle other errors
    console.error("Error Getting available room with:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const guestInRoom = async (req, res) => {
  try {
    // Find the room with populated bed tenants
    const room = await Room.findById(req.params.roomId).populate({
      path: "beds.tenant",
      select: "Guest_name Contact_number Guest_email Guest_aadhar_No",
      model: "Guest",
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Extract occupied beds with tenant details
    const guests = await room.beds
      .filter((bed) => bed.tenant) // Only occupied beds
      .map((bed) => ({
        ...bed.tenant.toObject(), // Guest details
        bedNumber: bed.bedNumber,
        checkInDate: bed.movedInAt,
      }));

    res.status(200).json({ success: true, guests });
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, message: messages });
    }

    // Handle other errors
    console.error("Error Getting available room with:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const roomHistory = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate({
        path: "checkInCheckOutHistory.tenant",
        select: "Guest_name Contact_number Guest_email Guest_aadhar_No status",
        model: "Guest",
      })
      .populate({
        path: "beds",
        select: "bedNumber",
      });

    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    // Create bed number map for quick lookup
    const bedMap = new Map();
    room.beds.forEach((bed) => {
      bedMap.set(bed._id?.toString(), bed.bedNumber);
    });

    // Process history entries
    const history = room.checkInCheckOutHistory
      .filter((entry) => entry.tenant)
      .map((entry) => {
        return {
          guest: {
            name: entry.tenant.Guest_name,
            contact: entry.tenant.Contact_number,
            email: entry.tenant.Guest_email,
            aadhar: entry.tenant.Guest_aadhar_No,
            status: entry.tenant.status,
          },
          bedNumber: bedMap.get(entry.bedNumber?.toString()) || "Unknown",
          checkIn: entry.checkInDate,
          checkOut: entry.checkOutDate,
          durationDays: entry.durationDays,
          movedOutReason: entry.movedOutReason,
        };
      });

    return res.status(200).json({
      success: true,
      history,
      roomStatus: room.status,
      currentOccupancy: room.currentOccupancy,
    });
  } catch (error) {
    console.error("Error fetching room history:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const editRoom = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { roomId } = req.params;
    const updatedData = req.body;
    console.log("updatedData", updatedData);
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid room ID" });
    }

    if (updatedData.roomNumber) {
      const existingRoom = await Room.findOne({
        roomNumber: updatedData.roomNumber,
        _id: { $ne: roomId },
      }).session(session);
      if (existingRoom) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ success: false, message: "Room number already exists" });
      }
    }

    // Update room with transaction
    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { $set: updatedData },
      { new: true, runValidators: true, session }
    );

    if (!updatedRoom) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Room updated successfully",
      room: updatedRoom,
    });
  } catch (error) {
    await session.abortTransaction();
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    console.error("Error updating room:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

const deleteRoom = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { roomId } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID format",
      });
    }

    const room = await Room.findById(roomId).session(session);
    if (!room) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }
    // Check if the room is occupied
    if (room.currentOccupancy > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Room is occupied and cannot be deleted",
      });
    }

    const deletedRoom = await Room.findByIdAndDelete(roomId).session(session);
    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Room deleted successfully",
      room: deletedRoom,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error deleting room:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

export {
  addRoom,
  getAllRoom,
  availableRoom,
  availableBeds,
  guestInRoom,
  roomHistory,
  editRoom,
  deleteRoom,
};
