import Employee from "../../models/EMS/EmployeeModel.js";

const AddEmployee = async (req, res) => {
  try {
    const employeeId = `EMP${Date.now()}${Math.floor(Math.random() * 10000)}`;

    const empDetails = {
      employeeId,
      employeeName: req.body.employeeName,
      phone: req.body.phone,
      fatherName: req.body.fatherName,
      dob: req.body.dob,
      joiningDate: req.body.joiningDate,
      anniversaryDate: req.body.anniversaryDate,
      gender: req.body.gender,
      maritalStatus: req.body.maritalStatus,
      fromTime: req.body.fromTime,
      toTime: req.body.toTime,
      lunchTime: req.body.lunchTime,
      teaTime: req.body.teaTime,
      bloodGroup: req.body.bloodGroup,
      height: req.body.height,
      weight: req.body.weight,
      smsAlert: req.body.smsAlert,
      empResides: req.body.empResides,
      empCommissionType: req.body.empCommissionType,
      empCommission: req.body.empCommission,
      address: {
        street: req.body.address.street,
        city: req.body.address.city,
        state: req.body.address.state,
        zip: req.body.address.zip,
        country: req.body.address.country,
      },

      bankDetails: {
        holderName: req.body.bankDetails.holderName,
        accountNumber: req.body.bankDetails.accountNumber,
        ifsc: req.body.bankDetails.ifsc,
        bankName: req.body.bankDetails.bankName,
        branch: req.body.bankDetails.branch,
        salary: req.body.bankDetails.salary,
        TA: req.body.bankDetails.TA,
        HRA: req.body.bankDetails.HRA,
      },

      otherInfo: {
        emergencyContact: req.body.otherInfo.emergencyContact,
        workplace: req.body.otherInfo.workplace,
        workTime: req.body.otherInfo.workTime,
        qualification: req.body.otherInfo.qualification,
        remark: req.body.otherInfo.remark,
      },

      documents: {
        aadharFront: req.body.documents.aadharFront,
        aadharBack: req.body.documents.aadharBack,
        profilePicture: req.body.documents.profilePicture,
      },

      experiences: req.body.experiences.map((exp) => ({
        jobTitle: exp.jobTitle,
        company: exp.company,
        startYear: exp.startYear,
        endYear: exp.endYear,
        duration: exp.duration,
        description: exp.description,
        current: exp.current,
      })),

      insurances: {
        health: {
          covered: req.body.insurances.health.covered,
          amount: req.body.insurances.health.amount,
          expiryDate: req.body.insurances.health.expiryDate,
          pfNumber: req.body.insurances.health.pfNumber,
        },
        life: {
          covered: req.body.insurances.life.covered,
          amount: req.body.insurances.life.amount,
          expiryDate: req.body.insurances.life.expiryDate,
          pfNumber: req.body.insurances.life.pfNumber,
        },
        esi: {
          covered: req.body.insurances.esi.covered,
          amount: req.body.insurances.esi.amount,
          expiryDate: req.body.insurances.esi.expiryDate,
          pfNumber: req.body.insurances.esi.pfNumber,
        },
      },

      currentStatus: "Active",
    };

    const employee = new Employee(empDetails);

    await employee.save();

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const employee = await Employee.find({});

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee is not available" });
    }

    return res.status(200).json({
      success: true,
      message: "Successfully fetched the employee",
      employee,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    return res.status(200).json({ success: true, employee });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const existingEmployee = await Employee.findById(employeeId);
    if (!existingEmployee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    const empDetails = {
      employeeId,
      employeeName: req.body.employeeName,
      phone: req.body.phone,
      fatherName: req.body.fatherName,
      dob: req.body.dob,
      joiningDate: req.body.joiningDate,
      anniversaryDate: req.body.anniversaryDate,
      gender: req.body.gender,
      maritalStatus: req.body.maritalStatus,
      fromTime: req.body.fromTime,
      toTime: req.body.toTime,
      lunchTime: req.body.lunchTime,
      teaTime: req.body.teaTime,
      bloodGroup: req.body.bloodGroup,
      height: req.body.height,
      weight: req.body.weight,
      smsAlert: req.body.smsAlert,
      empResides: req.body.empResides,
      empCommissionType: req.body.empCommissionType,
      empCommission: req.body.empCommission,
      address: {
        street: req.body.address.street,
        city: req.body.address.city,
        state: req.body.address.state,
        zip: req.body.address.zip,
        country: req.body.address.country,
      },

      bankDetails: {
        holderName: req.body.bankDetails?.holderName,
        accountNumber: req.body.bankDetails?.accountNumber,
        ifsc: req.body.bankDetails?.ifsc,
        bankName: req.body.bankDetails?.bankName,
        branch: req.body.bankDetails?.branch,
        salary: req.body.bankDetails?.salary,
        TA: req.body.bankDetails?.TA,
        HRA: req.body.bankDetails?.HRA,
      },

      otherInfo: {
        emergencyContact: req.body.otherInfo?.emergencyContact,
        workplace: req.body.otherInfo?.workplace,
        workTime: req.body.otherInfo?.workTime,
        qualification: req.body.otherInfo?.qualification,
        remark: req.body.otherInfo?.remark,
      },

      documents: {
        aadharFront: req.body.documents.aadharFront,
        aadharBack: req.body.documents.aadharBack,
        profilePicture: req.body.documents.profilePicture,
      },

      experiences: Array.isArray(req.body.experiences)
        ? req.body.experiences.map((exp) => ({
            jobTitle: exp.jobTitle,
            company: exp.company,
            startYear: exp.startYear,
            endYear: exp.endYear,
            duration: exp.duration,
            description: exp.description,
            current: exp.current,
          }))
        : [],

      insurances: {
        health: {
          covered: req.body.insurances.health.covered,
          amount: req.body.insurances.health.amount,
          expiryDate: req.body.insurances.health.expiryDate,
          pfNumber: req.body.insurances.health.pfNumber,
        },
        life: {
          covered: req.body.insurances.life.covered,
          amount: req.body.insurances.life.amount,
          expiryDate: req.body.insurances.life.expiryDate,
          pfNumber: req.body.insurances.life.pfNumber,
        },
        esi: {
          covered: req.body.insurances.esi.covered,
          amount: req.body.insurances.esi.amount,
          expiryDate: req.body.insurances.esi.expiryDate,
          pfNumber: req.body.insurances.esi.pfNumber,
        },
      },
      currentStatus: "Active",
    };

    await Employee.findByIdAndUpdate(employeeId, empDetails, {
      new: true,
      runValidators: true,
    });

    return res
      .status(200)
      .json({ success: true, message: "Employee updated Successfully." });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log("employeeId:", employeeId);
    const existingEmployee = await Employee.findById(employeeId);
    if (!existingEmployee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    await Employee.findByIdAndDelete(employeeId);

    return res
      .status(200)
      .json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
export {
  AddEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};
