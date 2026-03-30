import mongoose, { Schema, Document } from "mongoose";

export interface IBudget extends Document {
  tenantId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  year: number;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  department: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH"; // Can be updated by AI prediction
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    year: { type: Number, required: true },
    allocatedAmount: { type: Number, required: true },
    spentAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number }, // Calculated dynamically or via pre-save
    department: { type: String, required: true },
    riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "LOW" },
  },
  { timestamps: true }
);

BudgetSchema.pre('save', function (this: IBudget) {
  this.remainingAmount = this.allocatedAmount - this.spentAmount;
  // Simple risk calculation (can be overridden by AI module later)
  if (this.spentAmount > this.allocatedAmount) {
    this.riskLevel = "HIGH";
  } else if (this.spentAmount > this.allocatedAmount * 0.8) {
    this.riskLevel = "MEDIUM";
  }
});

BudgetSchema.index({ tenantId: 1, projectId: 1, year: 1 }, { unique: true });

export default mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);
