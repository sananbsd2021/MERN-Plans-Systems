import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: mongoose.Types.ObjectId;
  details?: string;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g., "CREATE", "UPDATE", "DELETE", "LOGIN"
    resourceType: { type: String, required: true }, // e.g., "Plan", "User", "Budget"
    resourceId: { type: Schema.Types.ObjectId },
    details: { type: String }, // JSON stringified payload or changes
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, userId: 1 });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
