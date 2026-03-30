import mongoose, { Schema, Document } from "mongoose";

export interface IAssetCategory extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  code: string; // e.g., "7440" for Electronic
  type: "ASSET" | "SUPPLY";
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssetCategorySchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    type: { type: String, enum: ["ASSET", "SUPPLY"], default: "ASSET" },
    description: { type: String },
  },
  { timestamps: true }
);

// Unique category code per tenant
AssetCategorySchema.index({ tenantId: 1, code: 1 }, { unique: true });

export default mongoose.models.AssetCategory || mongoose.model<IAssetCategory>("AssetCategory", AssetCategorySchema);
