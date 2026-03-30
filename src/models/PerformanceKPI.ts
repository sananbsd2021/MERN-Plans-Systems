import mongoose, { Schema, Document } from "mongoose";

export interface IPerformanceKPI extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  weight: number; // percentage
  targetScore: number;
  departmentId?: mongoose.Types.ObjectId;
  position?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceKPISchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    description: { type: String },
    weight: { type: Number, required: true, default: 0 },
    targetScore: { type: Number, required: true, default: 100 },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    position: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.PerformanceKPI || mongoose.model<IPerformanceKPI>("PerformanceKPI", PerformanceKPISchema);
