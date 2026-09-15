import { Request, Response } from 'express';
import Course from '../models/Course.model';

export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { difficulty, tag } = req.query;
    const filter: Record<string, unknown> = { isPublished: true };
    if (difficulty) filter.difficulty = difficulty;
    if (tag) filter.tags = { $in: [tag] };
    const courses = await Course.find(filter).select('-lessons.content -lessons.codeExample -lessons.quiz');
    res.json(courses);
  } catch {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

export const getCourseBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, isPublished: true });
    if (!course) { res.status(404).json({ error: 'Course not found' }); return; }
    res.json(course);
  } catch {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};

export const getLessonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, isPublished: true });
    if (!course) { res.status(404).json({ error: 'Course not found' }); return; }
    const lesson = course.lessons.find((l) => l._id.toString() === req.params.lessonId);
    if (!lesson) { res.status(404).json({ error: 'Lesson not found' }); return; }
    res.json(lesson);
  } catch {
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
};

export const createCourse = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
  try {
    const course = await Course.create({ ...req.body, createdBy: req.user!.id });
    res.status(201).json(course);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create course' });
  }
};
