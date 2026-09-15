import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  enrolledAt: Date;
  completedLessons: string[]; // array of lesson _ids
  progressPercent: number;
  status: 'active' | 'completed';
  completedAt?: Date;
  lastAccessedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    enrolledAt: { type: Date, default: Date.now },
    completedLessons: [{ type: String }],
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    completedAt: { type: Date },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
