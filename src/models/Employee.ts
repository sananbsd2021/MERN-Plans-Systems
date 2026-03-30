import mongoose, { Schema, Document } from "mongoose";

export enum EmployeeStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  LEAVE = "LEAVE",
  TERMINATED = "TERMINATED",
}

export interface IEmployee extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // Link to system user if applicable
  employeeId: string; // Unique ID like EMP001
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  departmentId?: mongoose.Types.ObjectId;
  position: string;
  joinDate: Date;
  status: EmployeeStatus;
  salary?: number;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    employeeId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    position: { type: String, required: true },
    joinDate: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: Object.values(EmployeeStatus), 
      default: EmployeeStatus.ACTIVE 
    },
    salary: { type: Number, min: 0 },
  },
  { timestamps: true }
);

// Unique employee ID and email per tenant
EmployeeSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true });
EmployeeSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export default mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema);
