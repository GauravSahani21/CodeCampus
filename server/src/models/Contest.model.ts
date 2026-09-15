import mongoose, { Schema, Document } from 'mongoose';

export interface IContestProblem {
  problemId: mongoose.Types.ObjectId;
  points: number;
  order: number;
}

export interface IContestMCQ {
  question: string;
  options: string[];
  correctOption: number; // 0-indexed
  points: number;
  explanation?: string;
  order: number;
}

export interface IContest extends Document {
  title: string;
  slug: string;
  description: string;
  instructions: string;
  contestType: 'standard' | 'superset';
  allowCodeExecution: boolean;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  problems: IContestProblem[];
  mcqQuestions: IContestMCQ[];
  allowedLanguages: string[];
  aiEvaluationEnabled: boolean;
  isPublished: boolean;
  totalPoints: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContestProblemSchema = new Schema<IContestProblem>(
  {
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    points: { type: Number, default: 100 },
    order: { type: Number, default: 1 },
  },
  { _id: false }
);

const ContestMCQSchema = new Schema<IContestMCQ>(
  {
    question: { type: String, required: true, trim: true },
    options: { type: [String], required: true },
    correctOption: { type: Number, required: true, default: 0 },
    points: { type: Number, default: 10 },
    explanation: { type: String, default: '' },
    order: { type: Number, default: 1 },
  },
  { _id: false }
);

const ContestSchema = new Schema<IContest>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    instructions: {
      type: String,
      default:
        'Write your solution in the editor. Focus on clean logic and edge cases. When ready, submit your code for automated test evaluation and AI-powered performance analysis.',
    },
    contestType: {
      type: String,
      enum: ['standard', 'superset'],
      default: 'standard',
    },
    allowCodeExecution: { type: Boolean, default: false },
    startTime: { type: Date, default: Date.now },
    endTime: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // default 7 days from now
    },
    durationMinutes: { type: Number, default: 60 },
    problems: [ContestProblemSchema],
    mcqQuestions: [ContestMCQSchema],
    allowedLanguages: {
      type: [String],
      default: ['python', 'javascript', 'cpp', 'java'],
    },
    aiEvaluationEnabled: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
    totalPoints: { type: Number, default: 100 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IContest>('Contest', ContestSchema);
