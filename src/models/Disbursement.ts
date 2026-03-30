import mongoose, { Schema, Document } from "mongoose";

export interface IDisbursement extends Document {
  tenantId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  budgetId?: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  disbursementDate: Date;
  status: "PENDING" | "APPROVED" | "REJECTED";
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DisbursementSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    budgetId: { type: Schema.Types.ObjectId, ref: "Budget", required: false },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    disbursementDate: { type: Date, required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    remarks: { type: String },
  },
  { timestamps: true }
);

DisbursementSchema.index({ tenantId: 1, projectId: 1 });

export default mongoose.models.Disbursement || mongoose.model<IDisbursement>("Disbursement", DisbursementSchema);
