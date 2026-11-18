import mongoose from 'mongoose';
import Problem from '../models/Problem.model';

export const syncProblemQuestionIds = async () => {
  try {
    const unnumbered = await Problem.find({
      $or: [{ questionId: { $exists: false } }, { questionId: null }]
    }).sort({ createdAt: 1 });

    if (unnumbered.length > 0) {
      const maxProblem = await Problem.findOne({ questionId: { $exists: true, $ne: null } })
        .sort({ questionId: -1 })
        .select('questionId');
      let nextId = (maxProblem?.questionId && maxProblem.questionId > 0) ? maxProblem.questionId + 1 : 1;

      for (const p of unnumbered) {
        p.questionId = nextId++;
        await p.save();
      }
      console.log(`✅ Assigned sequential questionIds to ${unnumbered.length} problems.`);
    }
  } catch (err) {
    console.error('Error syncing problem questionIds:', err);
  }
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    await syncProblemQuestionIds();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};
