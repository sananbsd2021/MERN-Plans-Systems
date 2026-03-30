import mongoose, { Schema, Document } from "mongoose";

export enum EvaluationStatus {
  PENDING = "PENDING",
  SELF_ASSESSED = "SELF_ASSESSED",
  SUPERVISOR_EVALUATED = "SUPERVISOR_EVALUATED",
  COMPLETED = "COMPLETED",
}

export interface IEvaluation extends Document {
  tenantId: mongoose.Types.ObjectId;
  periodId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  evaluatorId?: mongoose.Types.ObjectId;
  status: EvaluationStatus;
  totalScore?: number;
  aiFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    periodId: { type: Schema.Types.ObjectId, ref: "EvaluationPeriod", required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    evaluatorId: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: Object.values(EvaluationStatus),
      default: EvaluationStatus.PENDING,
    },
    totalScore: { type: Number },
    aiFeedback: { type: String },
  },
  { timestamps: true }
);

// Ensure one evaluation per employee per period
EvaluationSchema.index({ periodId: 1, employeeId: 1 }, { unique: true });

export default mongoose.models.Evaluation || mongoose.model<IEvaluation>("Evaluation", EvaluationSchema);
