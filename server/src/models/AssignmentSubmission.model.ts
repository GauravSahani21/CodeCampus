import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignmentSubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  problemSubmissions: Array<{
    problemId: mongoose.Types.ObjectId;
    code: string;
    language: string;
    passedCount: number;
    totalCount: number;
    status: string;
  }>;
  textSubmission?: string;
  score: number;
  maxScore: number;
  status: 'submitted' | 'graded' | 'late';
  instructorFeedback?: string;
  submittedAt: Date;
  gradedAt?: Date;
}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    problemSubmissions: [
      {
        problemId: { type: Schema.Types.ObjectId, ref: 'Problem' },
        code: String,
        language: String,
        passedCount: { type: Number, default: 0 },
        totalCount: { type: Number, default: 0 },
        status: { type: String, default: 'Pending' },
      },
    ],
    textSubmission: { type: String },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 100 },
    status: { type: String, enum: ['submitted', 'graded', 'late'], default: 'submitted' },
    instructorFeedback: { type: String },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date },
  },
  { timestamps: true }
);

AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export default mongoose.model<IAssignmentSubmission>('AssignmentSubmission', AssignmentSubmissionSchema);
