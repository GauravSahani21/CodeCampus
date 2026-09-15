import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  ip?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
