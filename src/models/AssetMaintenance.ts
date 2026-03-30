import mongoose, { Schema, Document } from "mongoose";

export interface IAssetMaintenance extends Document {
  tenantId: mongoose.Types.ObjectId;
  assetId: mongoose.Types.ObjectId;
  maintenanceDate: Date;
  cost: number;
  description: string;
  provider?: string;
  performedBy: mongoose.Types.ObjectId; // User ID
  createdAt: Date;
  updatedAt: Date;
}

const AssetMaintenanceSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    assetId: { type: Schema.Types.ObjectId, ref: "Asset", required: true },
    maintenanceDate: { type: Date, required: true, default: Date.now },
    cost: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    provider: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.AssetMaintenance || mongoose.model<IAssetMaintenance>("AssetMaintenance", AssetMaintenanceSchema);
