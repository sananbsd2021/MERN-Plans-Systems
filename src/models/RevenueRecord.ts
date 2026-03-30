import mongoose, { Schema, Document } from "mongoose";

export interface IRevenueRecord extends Document {
  tenantId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  payerId: mongoose.Types.ObjectId;
  amountPaid: number;
  paymentDate: Date;
  paymentMethod: string;
  receiptNumber: string;
  recordedBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RevenueRecordSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    assessmentId: { type: Schema.Types.ObjectId, ref: "TaxAssessment", required: true },
    payerId: { type: Schema.Types.ObjectId, ref: "TaxPayer", required: true },
    amountPaid: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: { type: String, required: true },
    receiptNumber: { type: String, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

// Receipt number should be unique per tenant
RevenueRecordSchema.index({ tenantId: 1, receiptNumber: 1 }, { unique: true });

export default mongoose.models.RevenueRecord || mongoose.model<IRevenueRecord>("RevenueRecord", RevenueRecordSchema);
