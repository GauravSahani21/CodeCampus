import mongoose, { Schema, Document } from 'mongoose';

export interface ILessonMaterial {
  title: string;
  url: string;
  fileType: string;
}

export interface ILessonQuizQuestion {
  question: string;
  type?: 'mcq' | 'true_false';
  options: string[];
  answer: number; // 0-indexed or 0/1 for true/false
  explanation?: string;
}

export interface ILesson {
  _id: mongoose.Types.ObjectId;
  title: string;
  order: number;
  content: string;
  codeLanguage: string;
  codeExample: string;
  videoUrl?: string;
  materials?: ILessonMaterial[];
  quiz?: ILessonQuizQuestion[];
  duration: number;
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  thumbnail?: string;
  promotionalVideoUrl?: string;
  lessons: ILesson[];
  enrolledCount: number;
  isPublished: boolean;
  approvalStatus: 'draft' | 'pending_approval' | 'published' | 'rejected';
  approvalFeedback?: string;
  quizSettings?: {
    timeLimitMinutes: number;
    passingPercent: number;
    maxRetries: number;
  };
  createdBy: mongoose.Types.ObjectId;
  deletionStatus?: 'none' | 'pending' | 'rejected';
  deletionReason?: string;
}

const LessonSchema = new Schema<ILesson>({
  title: { type: String, required: true },
  order: { type: Number, required: true },
  content: { type: String, required: true },
  codeLanguage: { type: String, default: 'python' },
  codeExample: { type: String, default: '' },
  videoUrl: { type: String },
  materials: [
    {
      title: String,
      url: String,
      fileType: String,
    },
  ],
  quiz: [
    {
      question: String,
      type: { type: String, enum: ['mcq', 'true_false'], default: 'mcq' },
      options: [String],
      answer: Number,
      explanation: String,
    },
  ],
  duration: { type: Number, default: 5 },
});

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: { type: String, default: 'Software Engineering' },
    price: { type: Number, default: 0 },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    tags: [String],
    thumbnail: String,
    promotionalVideoUrl: String,
    lessons: [LessonSchema],
    enrolledCount: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ['draft', 'pending_approval', 'published', 'rejected'],
      default: 'published',
    },
    approvalFeedback: { type: String, default: '' },
    quizSettings: {
      timeLimitMinutes: { type: Number, default: 15 },
      passingPercent: { type: Number, default: 70 },
      maxRetries: { type: Number, default: 3 },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletionStatus: { type: String, enum: ['none', 'pending', 'rejected'], default: 'none' },
    deletionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<ICourse>('Course', CourseSchema);
