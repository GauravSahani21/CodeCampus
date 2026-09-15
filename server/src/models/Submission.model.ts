import mongoose, { Schema, Document } from 'mongoose';

export type SubmissionStatus = 'Pending' | 'Running' | 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compile Error' | 'Memory Limit Exceeded';

export interface ITestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  isHidden: boolean;
  runtime?: number;
}

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  problemId: mongoose.Types.ObjectId;
  language: string;
  sourceCode: string;
  status: SubmissionStatus;
  runtime?: number;
  memory?: number;
  submittedAt: Date;
  testResults: ITestResult[];
  stderr?: string;
  passedCount?: number;
  totalCount?: number;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    language: { type: String, required: true },
    sourceCode: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Running', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compile Error', 'Memory Limit Exceeded'],
      default: 'Pending',
    },
    runtime: Number,
    memory: Number,
    submittedAt: { type: Date, default: Date.now },
    testResults: [
      {
        passed: Boolean,
        input: String,
        expected: String,
        actual: String,
        isHidden: { type: Boolean, default: false },
        runtime: Number,
      },
    ],
    stderr: String,
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SubmissionSchema.index({ userId: 1, problemId: 1 });
SubmissionSchema.index({ userId: 1, submittedAt: -1 });

export default mongoose.model<ISubmission>('Submission', SubmissionSchema);
