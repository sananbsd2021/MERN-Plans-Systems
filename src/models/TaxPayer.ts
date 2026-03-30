import mongoose, { Schema, Document } from "mongoose";

export interface ITaxPayer extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  taxId: string; // Citizen ID or Business ID
  address?: string;
  phoneNumber?: string;
  email?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaxPayerSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    taxId: { type: String, required: true },
    address: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

// Ensure taxId is unique per tenant
TaxPayerSchema.index({ tenantId: 1, taxId: 1 }, { unique: true });

export default mongoose.models.TaxPayer || mongoose.model<ITaxPayer>("TaxPayer", TaxPayerSchema);
