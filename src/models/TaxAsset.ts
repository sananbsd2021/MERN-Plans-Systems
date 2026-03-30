import mongoose, { Schema, Document } from "mongoose";

export enum AssetType {
  LAND = "LAND",
  BUILDING = "BUILDING",
  SIGNBOARD = "SIGNBOARD",
  OTHER = "OTHER",
}

export interface ITaxAsset extends Document {
  tenantId: mongoose.Types.ObjectId;
  payerId: mongoose.Types.ObjectId; // Ref to TaxPayer
  type: AssetType;
  details: Schema.Types.Mixed; // Specific details like size, location, etc.
  appraisedValue: number;
  location?: {
    type: string;
    coordinates: number[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const TaxAssetSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    payerId: { type: Schema.Types.ObjectId, ref: "TaxPayer", required: true },
    type: { type: String, enum: Object.values(AssetType), required: true },
    details: { type: Schema.Types.Mixed },
    appraisedValue: { type: Number, required: true, default: 0 },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" },
    },
  },
  { timestamps: true }
);

export default mongoose.models.TaxAsset || mongoose.model<ITaxAsset>("TaxAsset", TaxAssetSchema);
