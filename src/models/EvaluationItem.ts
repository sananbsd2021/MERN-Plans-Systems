import mongoose, { Schema, Document } from "mongoose";

export interface IEvaluationItem extends Document {
  evaluationId: mongoose.Types.ObjectId;
  kpiId: mongoose.Types.ObjectId; // References PerformanceKPI
  selfScore?: number;
  supervisorScore?: number;
  selfComment?: string;
  supervisorComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationItemSchema: Schema = new Schema(
  {
    evaluationId: { type: Schema.Types.ObjectId, ref: "Evaluation", required: true },
    kpiId: { type: Schema.Types.ObjectId, ref: "PerformanceKPI", required: true },
    selfScore: { type: Number, min: 0 },
    supervisorScore: { type: Number, min: 0 },
    selfComment: { type: String },
    supervisorComment: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.EvaluationItem || mongoose.model<IEvaluationItem>("EvaluationItem", EvaluationItemSchema);
