import mongoose, { Schema, Document } from "mongoose";

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  HALF_DAY = "HALF_DAY",
  ON_LEAVE = "ON_LEAVE",
}

export interface IAttendance extends Document {
  tenantId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  checkInLocation?: { lat: number; lng: number; address?: string };
  checkOutLocation?: { lat: number; lng: number; address?: string };
  status: AttendanceStatus;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    checkInLocation: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
    },
    checkOutLocation: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
    },
    status: { 
      type: String, 
      enum: Object.values(AttendanceStatus), 
      default: AttendanceStatus.PRESENT 
    },
    note: { type: String },
  },
  { timestamps: true }
);

// One record per employee per day
AttendanceSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema);
