import mongoose, { Schema, Document } from 'mongoose';

export interface IProblemSubmissionResult {
  problemId: mongoose.Types.ObjectId;
  language: string;
  code: string;
  passedTestCases: number;
  totalTestCases: number;
  score: number;
  status: 'Passed' | 'Failed' | 'Partial';
  testResults: Array<{
    input: string;
    expectedOutput: string;
    actualOutput?: string;
    passed: boolean;
    error?: string;
    executionTimeMs?: number;
  }>;
}

export interface IAIEvaluationMistake {
  problemTitle: string;
  mistakeTitle: string;
  explanation: string;
  fixSuggestion: string;
}

export interface IRecommendedCourse {
  title: string;
  slug: string;
  description: string;
  reason: string;
  matchingConcepts: string[];
}

export interface IAIEvaluationReport {
  summary: string;
  mistakes: IAIEvaluationMistake[];
  conceptsToFocus: string[];
  recommendedCourses: IRecommendedCourse[];
  evaluatedAt: Date;
}

export interface IMCQSubmissionResult {
  questionIndex: number;
  questionText: string;
  options: string[];
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  pointsAwarded: number;
  maxPoints: number;
  explanation?: string;
}

export interface IProctoringData {
  tabSwitches: number;
  fullscreenExits: number;
  copyPasteAttempts: number;
  violationsCount: number;
  violationLogs: Array<{
    type: string;
    timestamp: Date;
    detail?: string;
  }>;
}

export interface IContestSubmission extends Document {
  contestId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  contestType: 'standard' | 'superset';
  problemSubmissions: IProblemSubmissionResult[];
  mcqSubmissions: IMCQSubmissionResult[];
  codingScore: number;
  mcqScore: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  status: 'Completed' | 'In-Progress' | 'Disqualified' | 'Cheating';
  isDisqualified?: boolean;
  isCheating?: boolean;
  disqualificationReason?: string;
  cheatingReason?: string;
  aiReport: IAIEvaluationReport;
  proctoringData?: IProctoringData;
  submittedAt: Date;
  timeSpentSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProblemSubmissionSchema = new Schema<IProblemSubmissionResult>(
  {
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    language: { type: String, required: true },
    code: { type: String, default: '' },
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['Passed', 'Failed', 'Partial'], default: 'Failed' },
    testResults: [
      {
        input: String,
        expectedOutput: String,
        actualOutput: String,
        passed: Boolean,
        error: String,
        executionTimeMs: Number,
      },
    ],
  },
  { _id: false }
);

const MCQSubmissionSchema = new Schema<IMCQSubmissionResult>(
  {
    questionIndex: { type: Number, required: true },
    questionText: { type: String, required: true },
    options: [String],
    selectedOption: { type: Number, default: -1 },
    correctOption: { type: Number, required: true },
    isCorrect: { type: Boolean, default: false },
    pointsAwarded: { type: Number, default: 0 },
    maxPoints: { type: Number, default: 10 },
    explanation: String,
  },
  { _id: false }
);

const ContestSubmissionSchema = new Schema<IContestSubmission>(
  {
    contestId: { type: Schema.Types.ObjectId, ref: 'Contest', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contestType: { type: String, enum: ['standard', 'superset'], default: 'standard' },
    problemSubmissions: [ProblemSubmissionSchema],
    mcqSubmissions: [MCQSubmissionSchema],
    codingScore: { type: Number, default: 0 },
    mcqScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 100 },
    percentage: { type: Number, default: 0 },
    status: { type: String, enum: ['Completed', 'In-Progress', 'Disqualified', 'Cheating'], default: 'Completed' },
    isDisqualified: { type: Boolean, default: false },
    isCheating: { type: Boolean, default: false },
    disqualificationReason: { type: String, default: '' },
    cheatingReason: { type: String, default: '' },
    aiReport: {
      summary: { type: String, default: '' },
      mistakes: [
        {
          problemTitle: String,
          mistakeTitle: String,
          explanation: String,
          fixSuggestion: String,
        },
      ],
      conceptsToFocus: [String],
      recommendedCourses: [
        {
          title: String,
          slug: String,
          description: String,
          reason: String,
          matchingConcepts: [String],
        },
      ],
      evaluatedAt: { type: Date, default: Date.now },
    },
    submittedAt: { type: Date, default: Date.now },
    timeSpentSeconds: { type: Number, default: 0 },
    proctoringData: {
      tabSwitches: { type: Number, default: 0 },
      fullscreenExits: { type: Number, default: 0 },
      copyPasteAttempts: { type: Number, default: 0 },
      violationsCount: { type: Number, default: 0 },
      violationLogs: [
        {
          type: { type: String },
          timestamp: { type: Date, default: Date.now },
          detail: { type: String },
        },
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IContestSubmission>('ContestSubmission', ContestSubmissionSchema);
