import mongoose, { Schema, Document } from "mongoose";

export enum AssetStatus {
  ACTIVE = "ACTIVE",
  BROKEN = "BROKEN",
  LOST = "LOST",
  DISPOSED = "DISPOSED",
}

export interface IAsset extends Document {
  tenantId: mongoose.Types.ObjectId;
  assetCode: string; // e.g., 7440-001-0001
  name: string;
  categoryId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  purchaseDate: Date;
  purchasePrice: number;
  status: AssetStatus;
  serialNumber?: string;
  specification?: string;
  sourceOfFunds?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    assetCode: { type: String, required: true },
    name: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "AssetCategory", required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    purchaseDate: { type: Date, required: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(AssetStatus), default: AssetStatus.ACTIVE },
    serialNumber: { type: String },
    specification: { type: String },
    sourceOfFunds: { type: String },
  },
  { timestamps: true }
);

// Unique asset code per tenant
AssetSchema.index({ tenantId: 1, assetCode: 1 }, { unique: true });

export default mongoose.models.Asset || mongoose.model<IAsset>("Asset", AssetSchema);
