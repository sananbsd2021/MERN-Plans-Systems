import mongoose, { Schema, Document } from "mongoose";

export enum LeaveType {
  ANNUAL = "ANNUAL",
  SICK = "SICK",
  CASUAL = "CASUAL",
  MATERNITY = "MATERNITY",
  PATERNITY = "PATERNITY",
  UNPAID = "UNPAID",
  OTHER = "OTHER",
}

export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export interface ILeaveRequest extends Document {
  tenantId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  approvedBy?: mongoose.Types.ObjectId; // Ref to User
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    leaveType: { 
      type: String, 
      enum: Object.values(LeaveType), 
      required: true 
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { 
      type: String, 
      enum: Object.values(LeaveStatus), 
      default: LeaveStatus.PENDING 
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    comment: { type: String },
  },
  { timestamps: true }
);

LeaveRequestSchema.index({ tenantId: 1, employeeId: 1, status: 1 });

export default mongoose.models.LeaveRequest || mongoose.model<ILeaveRequest>("LeaveRequest", LeaveRequestSchema);
