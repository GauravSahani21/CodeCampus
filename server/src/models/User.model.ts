import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

export interface IInstructorApplication {
  bio: string;
  expertiseAreas: string[];
  qualifications: string;
  status: 'none' | 'pending' | 'approved' | 'rejected';
  appliedAt?: Date;
  reviewedAt?: Date;
  adminNote?: string;
}

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'instructor' | 'admin';
  avatar?: string;
  bio?: string;
  joinedAt: Date;
  stats: {
    solved: number;
    attempted: number;
    streak: number;
    longestStreak: number;
    lastActive?: Date;
  };
  activityLog: Array<{ date: string; count: number; level: number }>;
  solvedProblems: mongoose.Types.ObjectId[];
  badges: string[];
  earnedBadges?: IUserBadge[];
  streakMilestones?: number[];
  instructorApplication?: IInstructorApplication;
  resetOtp?: string;
  resetOtpExpiry?: Date;
  resetOtpAttempts?: number;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'instructor', 'admin'], default: 'user' },
    avatar: { type: String },
    bio: { type: String, maxlength: 300 },
    joinedAt: { type: Date, default: Date.now },
    stats: {
      solved: { type: Number, default: 0 },
      attempted: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastActive: { type: Date },
    },
    activityLog: [
      {
        date: String,
        count: { type: Number, default: 0 },
        level: { type: Number, default: 0, min: 0, max: 4 },
      },
    ],
    solvedProblems: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
    badges: [String],
    earnedBadges: [
      {
        id: String,
        name: String,
        description: String,
        icon: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    streakMilestones: [{ type: Number }],
    instructorApplication: {
      bio: { type: String, default: '' },
      expertiseAreas: [{ type: String }],
      qualifications: { type: String, default: '' },
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
      },
      appliedAt: { type: Date },
      reviewedAt: { type: Date },
      adminNote: { type: String, default: '' },
    },
    resetOtp: { type: String, select: false },
    resetOtpExpiry: { type: Date, select: false },
    resetOtpAttempts: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

export default mongoose.model<IUser>('User', UserSchema);
