import mongoose, { Schema, Document } from "mongoose";

export enum EvaluationPeriodStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

export interface IEvaluationPeriod extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string; // e.g., "ครึ่งปีแรก 2567"
  startDate: Date;
  endDate: Date;
  status: EvaluationPeriodStatus;
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationPeriodSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(EvaluationPeriodStatus),
      default: EvaluationPeriodStatus.OPEN,
    },
  },
  { timestamps: true }
);

export default mongoose.models.EvaluationPeriod || mongoose.model<IEvaluationPeriod>("EvaluationPeriod", EvaluationPeriodSchema);
