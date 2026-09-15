import mongoose, { Schema, Document } from 'mongoose';

export interface IDeletionRequest extends Document {
  targetType: 'problem' | 'course';
  targetId: mongoose.Types.ObjectId;
  targetTitle: string;
  targetSlug?: string;
  reason: string;
  requestedBy: mongoose.Types.ObjectId;
  requestedByUsername: string;
  requestedByEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeletionRequestSchema = new Schema<IDeletionRequest>(
  {
    targetType: {
      type: String,
      enum: ['problem', 'course'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
    },
    targetTitle: {
      type: String,
      required: true,
    },
    targetSlug: {
      type: String,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedByUsername: {
      type: String,
      required: true,
    },
    requestedByEmail: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

DeletionRequestSchema.index({ status: 1, createdAt: -1 });
DeletionRequestSchema.index({ targetId: 1, status: 1 });

export default mongoose.model<IDeletionRequest>('DeletionRequest', DeletionRequestSchema);
