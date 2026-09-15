import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscussionReply {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  upvotes: mongoose.Types.ObjectId[];
  isAccepted: boolean;
  createdAt: Date;
}

export interface IDiscussion extends Document {
  problemId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  category: 'question' | 'approach' | 'edge-case' | 'bug';
  upvotes: mongoose.Types.ObjectId[];
  replies: IDiscussionReply[];
  isSolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DiscussionReplySchema = new Schema<IDiscussionReply>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isAccepted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const DiscussionSchema = new Schema<IDiscussion>(
  {
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['question', 'approach', 'edge-case', 'bug'],
      default: 'question',
    },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replies: [DiscussionReplySchema],
    isSolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IDiscussion>('Discussion', DiscussionSchema);
