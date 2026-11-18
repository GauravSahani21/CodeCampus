import { Request, Response } from 'express';
import SkillProfile from '../models/SkillProfile.model';
import { generateRecommendationsForUser } from '../services/recommendation.service';
import { syncUserSkillProfile } from '../services/skillAnalysis.service';

export const getRecommendations = async (
  req: Request & { user?: { id: string } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const recommendationDoc = await generateRecommendationsForUser(userId);
    const skillProfiles = await SkillProfile.find({ userId }).sort({ weaknessScore: -1 });

    res.json({
      summary: recommendationDoc.summary,
      recommendations: recommendationDoc.recommendations,
      skillProfiles,
      generatedAt: recommendationDoc.generatedAt,
    });
  } catch (err) {
    console.error('[RecommendationController] Failed to fetch recommendations:', err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};

export const getSkillProfile = async (
  req: Request & { user?: { id: string } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    let profiles = await SkillProfile.find({ userId }).sort({ weaknessScore: -1 });

    if (profiles.length === 0) {
      profiles = await syncUserSkillProfile(userId);
    }

    res.json(profiles);
  } catch (err) {
    console.error('[RecommendationController] Failed to fetch skill profile:', err);
    res.status(500).json({ error: 'Failed to retrieve skill profile' });
  }
};

export const recalculateProfile = async (
  req: Request & { user?: { id: string } },
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const syncedProfiles = await syncUserSkillProfile(userId);
    const recommendationDoc = await generateRecommendationsForUser(userId);

    res.json({
      message: 'Skill profile and recommendations recalculated successfully',
      summary: recommendationDoc.summary,
      recommendations: recommendationDoc.recommendations,
      skillProfiles: syncedProfiles,
      generatedAt: recommendationDoc.generatedAt,
    });
  } catch (err) {
    console.error('[RecommendationController] Failed to recalculate:', err);
    res.status(500).json({ error: 'Failed to recalculate skill profile' });
  }
};
