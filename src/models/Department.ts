import mongoose, { Schema, Document } from "mongoose";

export interface IDepartment extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  managerId?: mongoose.Types.ObjectId; // Ref to User or Employee
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    description: { type: String },
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Unique department name per tenant
DepartmentSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export default mongoose.models.Department || mongoose.model<IDepartment>("Department", DepartmentSchema);
