import mongoose, { Schema, Document } from "mongoose";

export interface IOrganizationBudget extends Document {
  tenantId: mongoose.Types.ObjectId;
  year: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationBudgetSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    year: { type: Number, required: true },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Unique year per tenant
OrganizationBudgetSchema.index({ tenantId: 1, year: 1 }, { unique: true });

export default mongoose.models.OrganizationBudget || mongoose.model<IOrganizationBudget>("OrganizationBudget", OrganizationBudgetSchema);
