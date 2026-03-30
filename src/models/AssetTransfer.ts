import mongoose, { Schema, Document } from "mongoose";

export interface IAssetTransfer extends Document {
  tenantId: mongoose.Types.ObjectId;
  assetId: mongoose.Types.ObjectId;
  fromDepartmentId: mongoose.Types.ObjectId;
  toDepartmentId: mongoose.Types.ObjectId;
  transferDate: Date;
  reason?: string;
  authorizedBy: mongoose.Types.ObjectId; // User ID
  createdAt: Date;
  updatedAt: Date;
}

const AssetTransferSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    assetId: { type: Schema.Types.ObjectId, ref: "Asset", required: true },
    fromDepartmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    toDepartmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    transferDate: { type: Date, required: true, default: Date.now },
    reason: { type: String },
    authorizedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.AssetTransfer || mongoose.model<IAssetTransfer>("AssetTransfer", AssetTransferSchema);
