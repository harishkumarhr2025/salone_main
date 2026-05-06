import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: String,
    phone: String,
    fatherName: String,
    dob: Date,
    joiningDate: Date,
    gender: String,
    maritalStatus: String,
    anniversaryDate: Date,
    fromTime: Date,
    toTime: Date,
    lunchTime: Date,
    teaTime: Date,
    bloodGroup: String,
    height: String,
    weight: String,
    smsAlert: String,
    empResides: String,
    empCommissionType: String,
    empCommission: String,
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },

    bankDetails: {
      holderName: String,
      accountNumber: String,
      ifsc: String,
      bankName: String,
      branch: String,
      salary: String,
      TA: String,
      HRA: String,
    },

    otherInfo: {
      emergencyContact: String,
      workplace: String,
      workTime: String,
      qualification: String,
      remark: String,
    },

    documents: {
      aadharFront: String,
      aadharBack: String,
      profilePicture: String,
    },

    experiences: [
      {
        jobTitle: String,
        company: String,
        startYear: String,
        endYear: String,
        duration: String,
        description: String,
        current: Boolean,
      },
    ],

    insurances: {
      health: {
        covered: String,
        amount: String,
        expiryDate: Date,
        pfNumber: String,
      },
      life: {
        covered: String,
        amount: String,
        expiryDate: Date,
        pfNumber: String,
      },
      esi: {
        covered: String,
        amount: String,
        expiryDate: Date,
        pfNumber: String,
      },
    },

    currentStatus: {
      type: String,
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
