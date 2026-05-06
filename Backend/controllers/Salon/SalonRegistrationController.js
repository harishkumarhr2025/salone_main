import SalonRegistration from "../../models/Salon/SalonRegistrationModel.js";

// Register a new salon
const registerSalon = async (req, res) => {
  try {
    const {
      salonName,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      licenseNumber,
      registrationNumber,
      totalStaff,
      specialization,
      description,
    } = req.body;

    // Validate required fields
    if (
      !salonName ||
      !ownerName ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !licenseNumber ||
      !registrationNumber ||
      !totalStaff ||
      !specialization
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Check if license number already exists
    const existingLicense = await SalonRegistration.findOne({ licenseNumber });
    if (existingLicense) {
      return res.status(400).json({
        success: false,
        message: "This license number is already registered",
      });
    }

    // Check if registration number already exists
    const existingRegistration = await SalonRegistration.findOne({
      registrationNumber,
    });
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "This registration number is already registered",
      });
    }

    // Create new salon registration
    const newSalon = new SalonRegistration({
      salonName,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      licenseNumber,
      registrationNumber,
      totalStaff,
      specialization,
      description,
    });

    const savedSalon = await newSalon.save();

    return res.status(201).json({
      success: true,
      message: "Salon registered successfully",
      data: savedSalon,
    });
  } catch (error) {
    console.error("Error registering salon:", error);
    return res.status(500).json({
      success: false,
      message: "Error registering salon",
      error: error.message,
    });
  }
};

// Get all salon registrations
const getAllSalonRegistrations = async (req, res) => {
  try {
    const salons = await SalonRegistration.find().sort({ registrationDate: -1 });

    return res.status(200).json({
      success: true,
      message: "Salons fetched successfully",
      data: salons,
    });
  } catch (error) {
    console.error("Error fetching salons:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching salons",
      error: error.message,
    });
  }
};

// Get salon by ID
const getSalonById = async (req, res) => {
  try {
    const { salonId } = req.params;

    const salon = await SalonRegistration.findById(salonId);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Salon fetched successfully",
      data: salon,
    });
  } catch (error) {
    console.error("Error fetching salon:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching salon",
      error: error.message,
    });
  }
};

// Update salon details
const updateSalon = async (req, res) => {
  try {
    const { salonId } = req.params;
    const updateData = req.body;

    // Check if license or registration number is being changed
    if (updateData.licenseNumber) {
      const existingLicense = await SalonRegistration.findOne({
        licenseNumber: updateData.licenseNumber,
        _id: { $ne: salonId },
      });
      if (existingLicense) {
        return res.status(400).json({
          success: false,
          message: "This license number is already registered",
        });
      }
    }

    if (updateData.registrationNumber) {
      const existingRegistration = await SalonRegistration.findOne({
        registrationNumber: updateData.registrationNumber,
        _id: { $ne: salonId },
      });
      if (existingRegistration) {
        return res.status(400).json({
          success: false,
          message: "This registration number is already registered",
        });
      }
    }

    const updatedSalon = await SalonRegistration.findByIdAndUpdate(
      salonId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSalon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Salon updated successfully",
      data: updatedSalon,
    });
  } catch (error) {
    console.error("Error updating salon:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating salon",
      error: error.message,
    });
  }
};

// Approve salon registration
const approveSalon = async (req, res) => {
  try {
    const { salonId } = req.params;

    const updatedSalon = await SalonRegistration.findByIdAndUpdate(
      salonId,
      {
        status: "Approved",
        approvalDate: new Date(),
      },
      { new: true }
    );

    if (!updatedSalon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Salon approved successfully",
      data: updatedSalon,
    });
  } catch (error) {
    console.error("Error approving salon:", error);
    return res.status(500).json({
      success: false,
      message: "Error approving salon",
      error: error.message,
    });
  }
};

// Reject salon registration
const rejectSalon = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const updatedSalon = await SalonRegistration.findByIdAndUpdate(
      salonId,
      {
        status: "Rejected",
        rejectionReason: reason,
      },
      { new: true }
    );

    if (!updatedSalon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Salon rejected",
      data: updatedSalon,
    });
  } catch (error) {
    console.error("Error rejecting salon:", error);
    return res.status(500).json({
      success: false,
      message: "Error rejecting salon",
      error: error.message,
    });
  }
};

// Delete salon registration
const deleteSalon = async (req, res) => {
  try {
    const { salonId } = req.params;

    const deletedSalon = await SalonRegistration.findByIdAndDelete(salonId);

    if (!deletedSalon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Salon deleted successfully",
      data: deletedSalon,
    });
  } catch (error) {
    console.error("Error deleting salon:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting salon",
      error: error.message,
    });
  }
};

export {
  registerSalon,
  getAllSalonRegistrations,
  getSalonById,
  updateSalon,
  approveSalon,
  rejectSalon,
  deleteSalon,
};
