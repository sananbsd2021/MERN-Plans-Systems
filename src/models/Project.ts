import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  tenantId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  budgetAllocated: number;
  location?: {
    type: "Point",
    coordinates: [number, number]; // [longitude, latitude]
  };
  pdfUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    name: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ["PLANNED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "CANCELLED"], 
      default: "PLANNED" 
    },
    budgetAllocated: { type: Number, required: true, min: 0 },
    location: {
      type: { type: String, enum: ['Point'], required: false },
      coordinates: { type: [Number], required: false }
    },
    pdfUrl: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ProjectSchema.index({ tenantId: 1, planId: 1 });
ProjectSchema.index({ "location": "2dsphere" });

export default mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
