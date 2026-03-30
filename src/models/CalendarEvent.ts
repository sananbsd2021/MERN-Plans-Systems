import mongoose, { Schema, Document } from "mongoose"

export interface ICalendarEvent extends Document {
  summary: string
  description?: string
  location?: string
  start: Date
  end: Date
  googleEventId?: string
  tenantId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CalendarEventSchema: Schema = new Schema(
  {
    summary: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    googleEventId: { type: String },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
  },
  { timestamps: true }
)

export default mongoose.models.CalendarEvent || mongoose.model<ICalendarEvent>("CalendarEvent", CalendarEventSchema)
