import mongoose, { Schema, Document } from 'mongoose';

export interface IRecentAttempt {
  problemId: mongoose.Types.ObjectId;
  status: string;
  language: string;
  errorType?: string;
  submittedAt: Date;
}

export interface IErrorBreakdown {
  wrongAnswer: number;
  runtimeError: number;
  compileError: number;
  timeLimitExceeded: number;
  memoryLimitExceeded: number;
}

export interface ISkillProfile extends Document {
  userId: mongoose.Types.ObjectId;
  topic: string;
  totalAttempts: number;
  failedAttempts: number;
  solvedAttempts: number;
  weaknessScore: number; // 0 (mastered) to 100 (high struggle)
  errorBreakdown: IErrorBreakdown;
  recentAttempts: IRecentAttempt[];
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastAttemptAt?: Date;
  lastUpdated: Date;
}

const SkillProfileSchema = new Schema<ISkillProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true, trim: true },
    totalAttempts: { type: Number, default: 0 },
    failedAttempts: { type: Number, default: 0 },
    solvedAttempts: { type: Number, default: 0 },
    weaknessScore: { type: Number, default: 0, min: 0, max: 100 },
    errorBreakdown: {
      wrongAnswer: { type: Number, default: 0 },
      runtimeError: { type: Number, default: 0 },
      compileError: { type: Number, default: 0 },
      timeLimitExceeded: { type: Number, default: 0 },
      memoryLimitExceeded: { type: Number, default: 0 },
    },
    recentAttempts: [
      {
        problemId: { type: Schema.Types.ObjectId, ref: 'Problem' },
        status: { type: String, required: true },
        language: { type: String, default: 'java' },
        errorType: { type: String },
        submittedAt: { type: Date, default: Date.now },
      },
    ],
    consecutiveFailures: { type: Number, default: 0 },
    consecutiveSuccesses: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index to guarantee one skill record per user per topic
SkillProfileSchema.index({ userId: 1, topic: 1 }, { unique: true });
SkillProfileSchema.index({ userId: 1, weaknessScore: -1 });

export default mongoose.model<ISkillProfile>('SkillProfile', SkillProfileSchema);
