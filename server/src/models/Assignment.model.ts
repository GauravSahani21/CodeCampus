import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  description: string;
  instructorId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  problemIds: mongoose.Types.ObjectId[];
  dueDate: Date;
  maxScore: number;
  instructions: string;
  allowLateSubmission: boolean;
  status: 'draft' | 'published' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    problemIds: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
    dueDate: { type: Date, required: true },
    maxScore: { type: Number, default: 100 },
    instructions: { type: String, default: '' },
    allowLateSubmission: { type: Boolean, default: true },
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'published' },
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);
