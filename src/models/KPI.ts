import mongoose, { Schema, Document } from "mongoose";

export interface IKPI extends Document {
  tenantId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  name: string;
  metric: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  isAlertTriggered: boolean;
  aiRecommendation?: string;
  aiRiskLevel?: "SAFE" | "WARNING" | "CRITICAL";
  lastAnalyzedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KPISchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    name: { type: String, required: true },
    metric: { type: String, required: true },
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    unit: { type: String, required: true },
    isAlertTriggered: { type: Boolean, default: false },
    aiRecommendation: { type: String },
    aiRiskLevel: { type: String, enum: ["SAFE", "WARNING", "CRITICAL"] },
    lastAnalyzedAt: { type: Date },
  },
  { timestamps: true }
);

// Pre-save middleware to calculate alerts
KPISchema.pre('save', function (this: IKPI) {
  if (this.targetValue > 0) {
    const percentage = (this.currentValue / this.targetValue) * 100;
    this.isAlertTriggered = percentage < 70;
  }
});

KPISchema.index({ tenantId: 1, projectId: 1 });
KPISchema.index({ tenantId: 1, isAlertTriggered: 1 });

export default mongoose.models.KPI || mongoose.model<IKPI>("KPI", KPISchema);
