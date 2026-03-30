import mongoose, { Schema, Document } from "mongoose";

export interface ITenant extends Document {
  name: string;
  domain: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    domain: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Tenant || mongoose.model<ITenant>("Tenant", TenantSchema);
