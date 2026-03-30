import mongoose, { Schema, Document } from "mongoose";

export interface ISupply extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  unit: string; // e.g., ชิ้น, กล่อง, ม้วน
  categoryId: mongoose.Types.ObjectId;
  minQuantity: number;
  currentQuantity: number;
  costPerUnit?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SupplySchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "AssetCategory", required: true },
    minQuantity: { type: Number, default: 0 },
    currentQuantity: { type: Number, default: 0 },
    costPerUnit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Unique supply name per tenant
SupplySchema.index({ tenantId: 1, name: 1 }, { unique: true });

export default mongoose.models.Supply || mongoose.model<ISupply>("Supply", SupplySchema);
