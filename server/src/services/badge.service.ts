import User, { IUserBadge } from '../models/User.model';
import Problem from '../models/Problem.model';
import Notification from '../models/Notification.model';

export const BADGE_DEFINITIONS: Record<string, { name: string; description: string; icon: string }> = {
  first_problem: {
    name: 'First Problem Solved',
    description: 'Solved your very first coding challenge on SPLE CodeCampus.',
    icon: 'check-circle',
  },
  solved_10: {
    name: '10 Problems Solved',
    description: 'Reached double digits! Solved 10 coding challenges.',
    icon: 'code',
  },
  solved_100: {
    name: '100 Problems Solved',
    description: 'Century club! Mastered 100 coding challenges.',
    icon: 'trophy',
  },
  streak_7: {
    name: '7-Day Streak',
    description: 'Maintained consistent coding activity for 7 consecutive days.',
    icon: 'flame',
  },
  perfect_submission: {
    name: 'Perfect Submission',
    description: 'Passed 100% of test cases on the very first try.',
    icon: 'target',
  },
  contest_winner: {
    name: 'Contest Winner',
    description: 'Finished ranked #1 in an official platform contest.',
    icon: 'crown',
  },
  topic_master: {
    name: 'Topic Master',
    description: 'Solved at least 5 problems across a specific algorithmic topic.',
    icon: 'brain',
  },
};

export async function evaluateUserBadges(
  userId: string,
  context: {
    isFirstTrySuccess?: boolean;
    problemTag?: string;
    isContestWin?: boolean;
  } = {}
): Promise<IUserBadge[]> {
  const user = await User.findById(userId);
  if (!user) return [];

  const existingBadgeIds = new Set(
    (user.earnedBadges || []).map((b) => b.id).concat(user.badges || [])
  );
  const newlyAwarded: IUserBadge[] = [];

  const award = (id: string) => {
    if (!existingBadgeIds.has(id) && BADGE_DEFINITIONS[id]) {
      const def = BADGE_DEFINITIONS[id];
      const badgeObj: IUserBadge = {
        id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        earnedAt: new Date(),
      };
      newlyAwarded.push(badgeObj);
      existingBadgeIds.add(id);
    }
  };

  const solvedCount = user.solvedProblems ? user.solvedProblems.length : user.stats.solved;

  // 1. Problem count badges
  if (solvedCount >= 1) award('first_problem');
  if (solvedCount >= 10) award('solved_10');
  if (solvedCount >= 100) award('solved_100');

  // 2. Streak badges
  const streak = user.stats.streak || 0;
  if (streak >= 7) award('streak_7');

  // 3. Perfect submission
  if (context.isFirstTrySuccess) {
    award('perfect_submission');
  }

  // 4. Contest winner
  if (context.isContestWin) {
    award('contest_winner');
  }

  // 5. Topic master badge check
  if (user.solvedProblems && user.solvedProblems.length >= 5) {
    const solved = await Problem.find({ _id: { $in: user.solvedProblems } }).select('tags');
    const tagCounts: Record<string, number> = {};
    for (const p of solved) {
      for (const t of p.tags || []) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
        if (tagCounts[t] >= 5) {
          award('topic_master');
          break;
        }
      }
    }
  }

  if (newlyAwarded.length > 0) {
    if (!user.earnedBadges) user.earnedBadges = [];
    user.earnedBadges.push(...newlyAwarded);
    for (const b of newlyAwarded) {
      if (!user.badges.includes(b.id)) user.badges.push(b.id);
    }
    await user.save();

    // Create notifications for earned badges
    for (const badge of newlyAwarded) {
      await Notification.create({
        userId: user._id,
        type: 'achievement',
        title: `Badge Unlocked: ${badge.name}`,
        message: badge.description,
        link: `/profile/${user.username}`,
      });
    }
  }

  return newlyAwarded;
}
