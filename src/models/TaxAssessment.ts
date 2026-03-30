import mongoose, { Schema, Document } from "mongoose";

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

export interface ITaxAssessment extends Document {
  tenantId: mongoose.Types.ObjectId;
  assetId: mongoose.Types.ObjectId;
  payerId: mongoose.Types.ObjectId;
  year: number;
  amountDue: number;
  status: PaymentStatus;
  dueDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaxAssessmentSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    assetId: { type: Schema.Types.ObjectId, ref: "TaxAsset", required: true },
    payerId: { type: Schema.Types.ObjectId, ref: "TaxPayer", required: true },
    year: { type: Number, required: true },
    amountDue: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    dueDate: { type: Date, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

// Unique assessment per asset per year
TaxAssessmentSchema.index({ assetId: 1, year: 1 }, { unique: true });

export default mongoose.models.TaxAssessment || mongoose.model<ITaxAssessment>("TaxAssessment", TaxAssessmentSchema);
