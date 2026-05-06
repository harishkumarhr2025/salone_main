import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  date: { type: Date, required: true },
  checkIn: Date,
  checkOut: Date,
  status: {
    type: String,
    enum: ["present", "absent", "half-day", "leave"],
    default: "present",
  },
  remarks: String,
});

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
