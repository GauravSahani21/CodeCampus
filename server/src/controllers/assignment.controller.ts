import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Assignment from '../models/Assignment.model';
import AssignmentSubmission from '../models/AssignmentSubmission.model';
import Notification from '../models/Notification.model';
import User from '../models/User.model';

// ─── GET /api/assignments (Student view: published assignments) ───────────────
export const getStudentAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const assignments = await Assignment.find({ status: 'published' })
      .sort({ dueDate: 1 })
      .populate('instructorId', 'username avatar')
      .populate('problemIds', 'title slug difficulty');

    // Attach student submission status if exists
    const submissions = await AssignmentSubmission.find({ studentId: userId });
    const submissionMap = new Map(submissions.map((s) => [s.assignmentId.toString(), s]));

    const enriched = assignments.map((a) => {
      const sub = submissionMap.get(a._id.toString());
      return {
        ...a.toObject(),
        mySubmission: sub || null,
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch assignments' });
  }
};

// ─── GET /api/assignments/:id ─────────────────────────────────────────────────
export const getAssignmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id)
      .populate('instructorId', 'username avatar')
      .populate('problemIds', 'title slug difficulty testCases starterTemplates');

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    let mySubmission = null;
    if (req.user) {
      mySubmission = await AssignmentSubmission.findOne({
        assignmentId: assignment._id,
        studentId: req.user.id,
      });
    }

    res.json({
      assignment,
      mySubmission,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch assignment' });
  }
};

// ─── POST /api/assignments/:id/submit ─────────────────────────────────────────
export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const studentId = req.user!.id;
    const { problemSubmissions, textSubmission } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    const now = new Date();
    const isLate = now > new Date(assignment.dueDate);
    if (isLate && !assignment.allowLateSubmission) {
      res.status(400).json({ error: 'Deadline has passed and late submissions are disabled' });
      return;
    }

    // Calculate initial automatic score based on passed tests across problems
    let calculatedScore = 0;
    const totalProblems = assignment.problemIds.length;
    if (totalProblems > 0 && Array.isArray(problemSubmissions)) {
      let passedRatioSum = 0;
      for (const ps of problemSubmissions) {
        if (ps.totalCount > 0) {
          passedRatioSum += ps.passedCount / ps.totalCount;
        }
      }
      calculatedScore = Math.round((passedRatioSum / totalProblems) * assignment.maxScore);
    } else {
      calculatedScore = assignment.maxScore; // Text based default full until instructor grades
    }

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignmentId: id, studentId },
      {
        problemSubmissions: problemSubmissions || [],
        textSubmission: textSubmission || '',
        score: calculatedScore,
        maxScore: assignment.maxScore,
        status: isLate ? 'late' : 'submitted',
        submittedAt: now,
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Assignment submitted successfully',
      submission,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit assignment' });
  }
};

// ─── INSTRUCTOR: GET /api/assignments/instructor/my ──────────────────────────
export const getInstructorAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const instructorId = req.user!.id;
    const assignments = await Assignment.find({ instructorId })
      .sort({ createdAt: -1 })
      .populate('problemIds', 'title slug difficulty');

    // Aggregate submissions per assignment
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await AssignmentSubmission.find({ assignmentId: { $in: assignmentIds } })
      .populate('studentId', 'username email avatar');

    const subsByAssign = new Map<string, any[]>();
    for (const s of submissions) {
      const k = s.assignmentId.toString();
      if (!subsByAssign.has(k)) subsByAssign.set(k, []);
      subsByAssign.get(k)!.push(s);
    }

    const result = assignments.map((a) => {
      const subs = subsByAssign.get(a._id.toString()) || [];
      return {
        ...a.toObject(),
        submissionCount: subs.length,
        submissions: subs,
      };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load instructor assignments' });
  }
};

// ─── INSTRUCTOR: POST /api/assignments ────────────────────────────────────────
export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const instructorId = req.user!.id;
    const {
      title,
      description,
      problemIds,
      dueDate,
      maxScore,
      instructions,
      allowLateSubmission,
      courseId,
    } = req.body;

    if (!title || !dueDate) {
      res.status(400).json({ error: 'Title and due date are required' });
      return;
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      description: description || '',
      instructorId,
      courseId: courseId || undefined,
      problemIds: problemIds || [],
      dueDate: new Date(dueDate),
      maxScore: maxScore || 100,
      instructions: instructions || '',
      allowLateSubmission: allowLateSubmission !== false,
      status: 'published',
    });

    // Notify all students of new assignment
    const students = await User.find({ role: 'user' }).select('_id');
    const notifications = students.map((s) => ({
      userId: s._id,
      type: 'assignment' as const,
      title: `New Assignment: ${assignment.title}`,
      message: `Due on ${new Date(assignment.dueDate).toLocaleDateString()}. Check it out in your assignment portal.`,
      link: `/student/assignments`,
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications).catch(() => {});
    }

    res.status(201).json(assignment);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create assignment' });
  }
};

// ─── INSTRUCTOR: POST /api/assignments/:id/grade/:subId ───────────────────────
export const gradeAssignmentSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subId } = req.params;
    const { score, feedback } = req.body;

    const sub = await AssignmentSubmission.findById(subId).populate('assignmentId');
    if (!sub) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    sub.score = Number(score);
    sub.instructorFeedback = feedback || '';
    sub.status = 'graded';
    sub.gradedAt = new Date();
    await sub.save();

    // Notify student
    await Notification.create({
      userId: sub.studentId,
      type: 'assignment',
      title: `Assignment Graded: ${(sub.assignmentId as any)?.title || 'Assignment'}`,
      message: `Your score: ${sub.score}/${sub.maxScore}. Feedback: ${feedback || 'Grading completed.'}`,
      link: `/student/assignments`,
    });

    res.json({ message: 'Grading saved', submission: sub });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to grade submission' });
  }
};
