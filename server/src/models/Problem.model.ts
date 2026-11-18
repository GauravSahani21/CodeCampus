import mongoose, { Schema, Document } from 'mongoose';

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  isExample: boolean;
  explanation?: string;
}

export interface IProblem extends Document {
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  description: string;
  constraints: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  testCases: ITestCase[];
  starterTemplates: Record<string, string>;
  hints: string[];
  acceptanceRate: number;
  totalSubmissions: number;
  totalAccepted: number;
  createdBy: mongoose.Types.ObjectId;
  isPublished: boolean;
  questionId?: number;
  argumentTypes?: string[];
  returnType?: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  aiEnabled: boolean;
  aiConcepts: string[];
  deletionStatus?: 'none' | 'pending' | 'rejected';
  deletionReason?: string;
}

const ProblemSchema = new Schema<IProblem>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    tags: [{ type: String }],
    description: { type: String, required: true },
    constraints: { type: String, default: '' },
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    testCases: [
      {
        input: { type: String, default: '' },
        expectedOutput: { type: String, default: '' },
        isHidden: { type: Boolean, default: false },
        isExample: { type: Boolean, default: false },
        explanation: String,
      },
    ],
    starterTemplates: {
      java: { type: String, default: '' },
      python: { type: String, default: '' },
      javascript: { type: String, default: '' },
      cpp: { type: String, default: '' },
    },
    hints: [String],
    acceptanceRate: { type: Number, default: 0 },
    totalSubmissions: { type: Number, default: 0 },
    totalAccepted: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isPublished: { type: Boolean, default: false },
    questionId: { type: Number, unique: true, sparse: true },
    argumentTypes: [{ type: String }],
    returnType: { type: String },
    timeLimitMs: { type: Number, default: 2000 },
    memoryLimitMb: { type: Number, default: 256 },
    aiEnabled: { type: Boolean, default: true },
    aiConcepts: [{ type: String }],
    deletionStatus: { type: String, enum: ['none', 'pending', 'rejected'], default: 'none' },
    deletionReason: { type: String, default: '' },
  },
  { timestamps: true }
);
ProblemSchema.index({ difficulty: 1, tags: 1 });

ProblemSchema.pre('save', async function () {
  if (this.isNew && (this.questionId === undefined || this.questionId === null)) {
    const ProblemModel = this.constructor as mongoose.Model<IProblem>;
    const lastProblem = await ProblemModel.findOne({ questionId: { $exists: true, $ne: null } })
      .sort({ questionId: -1 })
      .select('questionId')
      .lean();
    this.questionId = (lastProblem?.questionId && lastProblem.questionId > 0)
      ? lastProblem.questionId + 1
      : 1;
  }
});

export default mongoose.model<IProblem>('Problem', ProblemSchema);
