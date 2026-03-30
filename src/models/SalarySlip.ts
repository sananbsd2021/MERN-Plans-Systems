import mongoose, { Schema, Document } from "mongoose";

export interface ISalaryItem {
  name: string;
  amount: number;
  type: "EARNING" | "DEDUCTION";
}

export interface ISalarySlip extends Document {
  tenantId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  items: ISalaryItem[];
  netSalary: number;
  status: "DRAFT" | "PUBLISHED";
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SalarySlipSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    items: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String, enum: ["EARNING", "DEDUCTION"], required: true },
      },
    ],
    netSalary: { type: Number, required: true },
    status: { type: String, enum: ["DRAFT", "PUBLISHED"], default: "DRAFT" },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for performance and uniqueness: one slip per employee per month/year
SalarySlipSchema.index({ tenantId: 1, employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.models.SalarySlip || mongoose.model<ISalarySlip>("SalarySlip", SalarySlipSchema);
