import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendedCourseSummary {
  courseId?: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  difficulty: string;
  description: string;
  concepts?: string[];
  url?: string;
}

export interface IRecommendedProblemSummary {
  problemId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
}

export interface ITopicRecommendation {
  topic: string;
  weaknessScore: number;
  totalAttempts: number;
  failedAttempts: number;
  solvedAttempts: number;
  dominantError?: string;
  reason: string;
  recommendedCourse?: IRecommendedCourseSummary;
  practiceProblems: IRecommendedProblemSummary[];
}

export interface IRecommendationDoc extends Document {
  userId: mongoose.Types.ObjectId;
  summary: {
    totalTopicsTracked: number;
    strugglingTopicsCount: number;
    masteredTopicsCount: number;
    topWeakness?: string;
  };
  recommendations: ITopicRecommendation[];
  generatedAt: Date;
}

const RecommendationSchema = new Schema<IRecommendationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    summary: {
      totalTopicsTracked: { type: Number, default: 0 },
      strugglingTopicsCount: { type: Number, default: 0 },
      masteredTopicsCount: { type: Number, default: 0 },
      topWeakness: { type: String },
    },
    recommendations: [
      {
        topic: { type: String, required: true },
        weaknessScore: { type: Number, required: true },
        totalAttempts: { type: Number, default: 0 },
        failedAttempts: { type: Number, default: 0 },
        solvedAttempts: { type: Number, default: 0 },
        dominantError: { type: String },
        reason: { type: String, required: true },
        recommendedCourse: {
          courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
          title: String,
          slug: String,
          difficulty: String,
          description: String,
          concepts: [String],
          url: String,
        },
        practiceProblems: [
          {
            problemId: { type: Schema.Types.ObjectId, ref: 'Problem' },
            title: String,
            slug: String,
            difficulty: String,
            tags: [String],
          },
        ],
      },
    ],
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

RecommendationSchema.index({ userId: 1, generatedAt: -1 });

export default mongoose.model<IRecommendationDoc>('Recommendation', RecommendationSchema);
