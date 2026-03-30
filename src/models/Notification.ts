import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
  isRead: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["INFO", "WARNING", "CRITICAL", "SUCCESS"], default: "INFO" },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

NotificationSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
NotificationSchema.index({ tenantId: 1, isRead: 1 });

export default mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
