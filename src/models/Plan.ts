import mongoose, { Schema, Document } from "mongoose";

export interface IPlan extends Document {
  tenantId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  version: number;
  pdfUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"], default: "DRAFT" },
    version: { type: Number, default: 1 },
    pdfUrl: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

PlanSchema.index({ tenantId: 1, status: 1 });

export default mongoose.models.Plan || mongoose.model<IPlan>("Plan", PlanSchema);
