import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivityLog extends Document {
  admin: Types.ObjectId;
  adminName: string;
  action: string;
  details: string;
  ipAddress?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Log must belong to an admin'],
    },
    adminName: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Add index for fast retrieval of latest activities
ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
