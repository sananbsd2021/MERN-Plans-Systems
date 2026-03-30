import mongoose, { Schema, Document } from "mongoose";

export enum SupplyTransactionType {
  IN = "IN",
  OUT = "OUT",
  ADJUST = "ADJUST",
}

export interface ISupplyTransaction extends Document {
  tenantId: mongoose.Types.ObjectId;
  supplyId: mongoose.Types.ObjectId;
  type: SupplyTransactionType;
  quantity: number;
  date: Date;
  note?: string;
  departmentId?: mongoose.Types.ObjectId; // For withdrawals (OUT)
  performedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SupplyTransactionSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    supplyId: { type: Schema.Types.ObjectId, ref: "Supply", required: true },
    type: { type: String, enum: Object.values(SupplyTransactionType), required: true },
    quantity: { type: Number, required: true, min: 1 },
    date: { type: Date, default: Date.now },
    note: { type: String },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.SupplyTransaction || mongoose.model<ISupplyTransaction>("SupplyTransaction", SupplyTransactionSchema);
