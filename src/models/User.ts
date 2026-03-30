import mongoose, { Schema, Document } from "mongoose";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  POLICY_ANALYST = "POLICY_ANALYST",
  OFFICER = "OFFICER",
  EXECUTIVE = "EXECUTIVE",
}

export interface IUser extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  lineUserId?: string;
  lineDisplayName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: function() { return this.role !== Role.SUPER_ADMIN; } },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), default: Role.OFFICER },
    isActive: { type: Boolean, default: true },
    lineUserId: { type: String },
    lineDisplayName: { type: String },
  },
  { timestamps: true }
);

// Index for multi-tenancy performance
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ lineUserId: 1 }, { sparse: true });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
