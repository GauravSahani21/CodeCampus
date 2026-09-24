'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  ArrowLeft, Trophy, Sparkles, Plus, Search, Check, Trash2,
  Clock, Calendar, BookOpen, AlertCircle, ShieldCheck, Terminal,
  Zap, ListChecks, HelpCircle, CheckCircle2
} from 'lucide-react';
import styles from './create.module.css';

interface ProblemOption {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}

interface SelectedProblem {
  problemId: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
}

interface MCQFormItem {
  id: string;
  question: string;
  options: string[];
  correctOption: number;
  points: number;
  explanation: string;
}

const DEFAULT_STANDARD_INSTRUCTIONS =
  'Write your solution in the plain editor. Focus on clean algorithmic logic and edge cases. You will not have full IDE execution before submitting. Once submitted, your code is tested against judge cases and analyzed by AI for learning feedback.';

const DEFAULT_SUPERSET_INSTRUCTIONS =
  'Welcome to the Interactive Assessment. You can run and test your code against sample test cases in real-time before submitting. Ensure you also review and complete all Multiple Choice Questions (MCQs) in the assessment before final submission.';

export default function CreateContestPage() {
  const router = useRouter();

  // Contest Mode: 'standard' (Blank Editor) | 'superset' (Interactive Code Runner + MCQs)
  const [contestType, setContestType] = useState<'standard' | 'superset'>('standard');

  // Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState(DEFAULT_STANDARD_INSTRUCTIONS);

  // Timing
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [endTime, setEndTime] = useState(() => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return new Date(nextWeek.getTime() - nextWeek.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  // Coding Problems
  const [availableProblems, setAvailableProblems] = useState<ProblemOption[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [problemSearch, setProblemSearch] = useState('');
  const [selectedProblems, setSelectedProblems] = useState<SelectedProblem[]>([]);

  // MCQs (for SuperSet mode)
  const [mcqs, setMcqs] = useState<MCQFormItem[]>([
    {
      id: 'mcq-1',
      question: '',
      options: ['', '', '', ''],
      correctOption: 0,
      points: 10,
      explanation: '',
    },
  ]);

  // AI & Config
  const [aiEvaluationEnabled, setAiEvaluationEnabled] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-switch instructions when changing mode if user hasn't heavily customized them
  const handleModeChange = (mode: 'standard' | 'superset') => {
    setContestType(mode);
    if (instructions === DEFAULT_STANDARD_INSTRUCTIONS || instructions === DEFAULT_SUPERSET_INSTRUCTIONS) {
      setInstructions(mode === 'superset' ? DEFAULT_SUPERSET_INSTRUCTIONS : DEFAULT_STANDARD_INSTRUCTIONS);
    }
  };

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoadingProblems(true);
        // Try instructor problems first
        const res = await api.get('/instructor/problems');
        if (res.data?.problems && res.data.problems.length > 0) {
          setAvailableProblems(res.data.problems);
        } else {
          // Fallback to public problems list
          const pubRes = await api.get('/problems');
          if (pubRes.data?.problems) {
            setAvailableProblems(pubRes.data.problems);
          }
        }
      } catch (err) {
        console.error('Failed to load library problems:', err);
      } finally {
        setLoadingProblems(false);
      }
    };
    fetchProblems();
  }, []);

  const handleToggleProblem = (p: ProblemOption) => {
    if (selectedProblems.some((s) => s.problemId === p._id)) {
      setSelectedProblems((prev) => prev.filter((s) => s.problemId !== p._id));
    } else {
      setSelectedProblems((prev) => [
        ...prev,
        {
          problemId: p._id,
          title: p.title,
          difficulty: p.difficulty,
          points: 100,
        },
      ]);
    }
  };

  const handlePointsChange = (probId: string, points: number) => {
    setSelectedProblems((prev) =>
      prev.map((s) => (s.problemId === probId ? { ...s, points: Math.max(10, points) } : s))
    );
  };

  const handleRemoveSelected = (probId: string) => {
    setSelectedProblems((prev) => prev.filter((s) => s.problemId !== probId));
  };

  // MCQ handlers
  const handleAddMcq = () => {
    setMcqs((prev) => [
      ...prev,
      {
        id: `mcq-${Date.now()}`,
        question: '',
        options: ['', '', '', ''],
        correctOption: 0,
        points: 10,
        explanation: '',
      },
    ]);
  };

  const handleRemoveMcq = (id: string) => {
    setMcqs((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMcqQuestionChange = (id: string, text: string) => {
    setMcqs((prev) => prev.map((m) => (m.id === id ? { ...m, question: text } : m)));
  };

  const handleMcqOptionChange = (id: string, optIdx: number, text: string) => {
    setMcqs((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newOpts = [...m.options];
        newOpts[optIdx] = text;
        return { ...m, options: newOpts };
      })
    );
  };

  const handleMcqCorrectOptionChange = (id: string, optIdx: number) => {
    setMcqs((prev) => prev.map((m) => (m.id === id ? { ...m, correctOption: optIdx } : m)));
  };

  const handleMcqPointsChange = (id: string, pts: number) => {
    setMcqs((prev) => prev.map((m) => (m.id === id ? { ...m, points: Math.max(1, pts) } : m)));
  };

  const handleMcqExplanationChange = (id: string, exp: string) => {
    setMcqs((prev) => prev.map((m) => (m.id === id ? { ...m, explanation: exp } : m)));
  };

  const codingPoints = selectedProblems.reduce((sum, p) => sum + p.points, 0);
  const mcqPoints = contestType === 'superset'
    ? mcqs.reduce((sum, m) => sum + (Number(m.points) || 0), 0)
    : 0;
  const totalPoints = codingPoints + mcqPoints;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a contest title');
      return;
    }
    if (selectedProblems.length === 0) {
      setErrorMsg('Please select at least one coding problem for the contest');
      return;
    }

    if (contestType === 'superset') {
      const validMcqs = mcqs.filter((m) => m.question.trim().length > 0);
      for (const m of validMcqs) {
        const filledOpts = m.options.map((o) => o.trim()).filter(Boolean);
        if (filledOpts.length < 2) {
          setErrorMsg(`MCQ question "${m.question.slice(0, 30)}..." must have at least 2 options.`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const formattedMcqs =
        contestType === 'superset'
          ? mcqs
              .filter((m) => m.question.trim().length > 0)
              .map((m, idx) => ({
                question: m.question.trim(),
                options: m.options.map((o) => o.trim()).filter(Boolean),
                correctOption: m.correctOption,
                points: Number(m.points) || 10,
                explanation: m.explanation.trim(),
                order: idx + 1,
              }))
          : [];

      const payload = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        contestType,
        allowCodeExecution: contestType === 'superset',
        durationMinutes: Number(durationMinutes),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        problems: selectedProblems.map((p, idx) => ({
          problemId: p.problemId,
          points: p.points,
          order: idx + 1,
        })),
        mcqQuestions: formattedMcqs,
        aiEvaluationEnabled,
        isPublished,
        allowedLanguages: ['python', 'javascript', 'cpp', 'java'],
      };

      await api.post('/instructor/contests', payload);
      router.push('/instructor/contests');
    } catch (err: any) {
      console.error('Failed to create contest:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to create contest');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAvailable = availableProblems.filter(
    (p) =>
      p.title.toLowerCase().includes(problemSearch.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(problemSearch.toLowerCase()))
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/instructor/contests" className={styles.backLink}>
          <ArrowLeft size={14} /> Back to Contests
        </Link>
        <h1 className={styles.title}>Create New Coding Contest</h1>
        <p className={styles.subtitle}>
          Build a coding test by selecting questions from your library. Students write code in a plain editor and submit for automated AI evaluation and course recommendations.
        </p>
      </div>

      {errorMsg && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(248,81,73,0.1)',
          border: '1px solid rgba(248,81,73,0.3)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--accent-red)',
          marginBottom: '20px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Contest Mode Selector */}
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>
                <Zap size={18} style={{ color: 'var(--accent-green)' }} /> Contest Format &amp; Examination Mode *
              </div>
              <div className={styles.sectionDesc}>
                Choose how candidates will experience and submit this assessment
              </div>
            </div>
          </div>

          <div className={styles.modeGrid}>
            {/* Option 1: Standard Blank Editor */}
            <div
              className={`${styles.modeCard} ${contestType === 'standard' ? styles.modeCardActive : ''}`}
              onClick={() => handleModeChange('standard')}
            >
              <div className={styles.modeHeader}>
                <div className={styles.modeIconWrap}>
                  <Terminal size={22} />
                </div>
                <span className={`${styles.modeBadge} ${contestType === 'standard' ? styles.modeBadgeActive : ''}`}>
                  Option 1 · Strict
                </span>
              </div>
              <h3 className={styles.modeTitle}>Standard Blank Editor Exam</h3>
              <p className={styles.modeDesc}>
                Proctored plain-text editor with zero execution before submission. Candidates focus on raw algorithmic logic, syntax accuracy, and edge-case handling without running code.
              </p>
              <ul className={styles.modeFeatures}>
                <li className={`${styles.modeFeatureItem} ${contestType === 'standard' ? styles.modeFeatureItemActive : ''}`}>
                  <Check size={14} style={{ color: 'var(--accent-green)' }} /> Proctored Plain Editor with Copy/Paste lockdown
                </li>
                <li className={`${styles.modeFeatureItem} ${contestType === 'standard' ? styles.modeFeatureItemActive : ''}`}>
                  <Check size={14} style={{ color: 'var(--accent-green)' }} /> No test case execution prior to submission
                </li>
                <li className={`${styles.modeFeatureItem} ${contestType === 'standard' ? styles.modeFeatureItemActive : ''}`}>
                  <Check size={14} style={{ color: 'var(--accent-green)' }} /> Coding problems only (graded on final submit)
                </li>
              </ul>
            </div>

            {/* Option 2: Interactive Assessment */}
            <div
              className={`${styles.modeCard} ${contestType === 'superset' ? styles.modeCardActive : ''}`}
              onClick={() => handleModeChange('superset')}
            >
              <div className={styles.modeHeader}>
                <div className={styles.modeIconWrap} style={{ background: 'rgba(88, 166, 255, 0.15)', color: '#58a6ff' }}>
                  <ListChecks size={22} />
                </div>
                <span className={`${styles.modeBadge} ${contestType === 'superset' ? styles.modeBadgeActive : ''}`} style={contestType === 'superset' ? { background: 'rgba(88, 166, 255, 0.15)', color: '#58a6ff', borderColor: 'rgba(88, 166, 255, 0.4)' } : {}}>
                  Option 2 · Interactive + MCQs
                </span>
              </div>
              <h3 className={styles.modeTitle}>Interactive Assessment</h3>
              <p className={styles.modeDesc}>
                Full assessment experience: candidates can run their code and execute against test cases in real-time, plus you can include Multiple Choice Questions (MCQs) for concept evaluation.
              </p>
              <ul className={styles.modeFeatures}>
                <li className={`${styles.modeFeatureItem} ${contestType === 'superset' ? styles.modeFeatureItemActive : ''}`}>
                  <Check size={14} style={{ color: '#58a6ff' }} /> Live code runner (test against public/example cases)
                </li>
                <li className={`${styles.modeFeatureItem} ${contestType === 'superset' ? styles.modeFeatureItemActive : ''}`}>
                  <Check size={14} style={{ color: '#58a6ff' }} /> Add Multiple Choice Questions (MCQs) with instant grading
                </li>
                <li className={`${styles.modeFeatureItem} ${contestType === 'superset' ? styles.modeFeatureItemActive : ''}`}>
                  <Check size={14} style={{ color: '#58a6ff' }} /> Combined scoring (Coding Points + MCQ Points)
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 1: Contest Details */}
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>
                <Trophy size={18} style={{ color: 'var(--accent-green)' }} /> Contest Details
              </div>
              <div className={styles.sectionDesc}>Basic title, overview, and instructions</div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Contest Title *</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Weekly Algorithms Test #1 or Comprehensive Technical Assessment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Description / Overview</label>
            <textarea
              className={styles.textarea}
              placeholder="Provide a brief summary of what this contest covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Student Instructions ({contestType === 'superset' ? 'Interactive Mode' : 'Plain Editor Mode'})</label>
            <textarea
              className={styles.textarea}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Duration (Minutes)</label>
              <input
                type="number"
                min="10"
                max="300"
                className={styles.input}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Start Time</label>
              <input
                type="datetime-local"
                className={styles.input}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>End Time (Deadline)</label>
              <input
                type="datetime-local"
                className={styles.input}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Coding Questions Selection */}
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>
                <BookOpen size={18} style={{ color: 'var(--accent-blue)' }} /> Coding Problems
              </div>
              <div className={styles.sectionDesc}>
                Select programming questions from your problem library
              </div>
            </div>
            <div className={styles.pointsSummaryBadge}>
              Coding Weight: {codingPoints} pts
            </div>
          </div>

          {/* Problem Search */}
          <div className={styles.problemPickerHeader}>
            <div className={styles.searchBox}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.pickerInput}
                placeholder="Search questions by title or tag..."
                value={problemSearch}
                onChange={(e) => setProblemSearch(e.target.value)}
              />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {availableProblems.length} questions available
            </span>
          </div>

          {/* Available Problems Grid */}
          <div className={styles.availableList}>
            {loadingProblems ? (
              <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Loading questions library...
              </div>
            ) : filteredAvailable.length === 0 ? (
              <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No questions found matching &quot;{problemSearch}&quot;
              </div>
            ) : (
              filteredAvailable.map((prob) => {
                const isSelected = selectedProblems.some((s) => s.problemId === prob._id);
                return (
                  <div
                    key={prob._id}
                    className={`${styles.problemCard} ${isSelected ? styles.problemCardSelected : ''}`}
                    onClick={() => handleToggleProblem(prob)}
                  >
                    <div>
                      <div className={styles.cardTitle}>
                        {isSelected ? (
                          <Check size={14} style={{ color: 'var(--accent-green)' }} />
                        ) : (
                          <Plus size={14} style={{ color: 'var(--text-muted)' }} />
                        )}
                        {prob.title}
                      </div>
                      <span
                        className={
                          prob.difficulty === 'Easy'
                            ? styles.diffEasy
                            : prob.difficulty === 'Medium'
                            ? styles.diffMedium
                            : styles.diffHard
                        }
                      >
                        {prob.difficulty}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Questions Review */}
          <div style={{ marginTop: '20px', marginBottom: '10px', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Selected Questions ({selectedProblems.length})
          </div>

          {selectedProblems.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              fontSize: '0.82rem'
            }}>
              No questions selected yet. Click any question above to include it in this test.
            </div>
          ) : (
            <div className={styles.selectedList}>
              {selectedProblems.map((prob, idx) => (
                <div key={prob.problemId} className={styles.selectedRow}>
                  <div className={styles.selectedInfo}>
                    <div className={styles.orderBadge}>#{idx + 1}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                        {prob.title}
                      </div>
                      <span
                        className={
                          prob.difficulty === 'Easy'
                            ? styles.diffEasy
                            : prob.difficulty === 'Medium'
                            ? styles.diffMedium
                            : styles.diffHard
                        }
                      >
                        {prob.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className={styles.pointsInputWrap}>
                    <span>Points:</span>
                    <input
                      type="number"
                      className={styles.pointsInput}
                      value={prob.points}
                      onChange={(e) => handlePointsChange(prob.problemId, Number(e.target.value))}
                      min="10"
                      max="1000"
                    />
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => handleRemoveSelected(prob.problemId)}
                      title="Remove question"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: MCQ Questions Builder (Only in SuperSet Mode) */}
        {contestType === 'superset' && (
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionTitle}>
                  <ListChecks size={18} style={{ color: '#58a6ff' }} /> Multiple Choice Questions (MCQs)
                </div>
                <div className={styles.sectionDesc}>
                  Add theoretical and concept questions. Select the radio button corresponding to the correct answer.
                </div>
              </div>
              <div className={styles.pointsSummaryBadge} style={{ background: 'rgba(88, 166, 255, 0.1)', borderColor: 'rgba(88, 166, 255, 0.3)', color: '#58a6ff' }}>
                MCQ Weight: {mcqPoints} pts
              </div>
            </div>

            {mcqs.map((mcq, mIdx) => {
              const letters = ['A', 'B', 'C', 'D'];
              return (
                <div key={mcq.id} className={styles.mcqCard}>
                  <div className={styles.mcqCardHeader}>
                    <div className={styles.mcqNumberBadge}>
                      <HelpCircle size={15} /> Question #{mIdx + 1}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className={styles.pointsInputWrap}>
                        <span>Points:</span>
                        <input
                          type="number"
                          className={styles.pointsInput}
                          value={mcq.points}
                          onChange={(e) => handleMcqPointsChange(mcq.id, Number(e.target.value))}
                          min="1"
                          max="100"
                        />
                      </div>
                      {mcqs.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => handleRemoveMcq(mcq.id)}
                          title="Delete question"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Question Text *</label>
                    <textarea
                      className={styles.textarea}
                      style={{ minHeight: '65px' }}
                      placeholder="e.g. What is the average time complexity of searching in a balanced BST?"
                      value={mcq.question}
                      onChange={(e) => handleMcqQuestionChange(mcq.id, e.target.value)}
                    />
                  </div>

                  {/* 4 Options */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Options &amp; Correct Answer (Pick the correct option radio)</label>
                    <div className={styles.mcqOptionsList}>
                      {letters.map((letter, optIdx) => {
                        const isCorrect = mcq.correctOption === optIdx;
                        return (
                          <div key={optIdx} className={styles.mcqOptionRow}>
                            <label className={styles.mcqRadioWrap} title="Mark as correct answer">
                              <input
                                type="radio"
                                name={`correct-${mcq.id}`}
                                checked={isCorrect}
                                onChange={() => handleMcqCorrectOptionChange(mcq.id, optIdx)}
                                style={{ accentColor: 'var(--accent-green)', width: '16px', height: '16px' }}
                              />
                            </label>
                            <div className={`${styles.mcqLetterBadge} ${isCorrect ? styles.mcqLetterBadgeCorrect : ''}`}>
                              {letter}
                            </div>
                            <input
                              type="text"
                              className={styles.input}
                              placeholder={`Option ${letter} text...`}
                              value={mcq.options[optIdx] || ''}
                              onChange={(e) => handleMcqOptionChange(mcq.id, optIdx, e.target.value)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Explanation (Optional — shown in results &amp; AI review)</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. In a balanced BST (like AVL or Red-Black), the tree height is O(log n)..."
                      value={mcq.explanation}
                      onChange={(e) => handleMcqExplanationChange(mcq.id, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              className={styles.addMcqBtn}
              onClick={handleAddMcq}
            >
              <Plus size={16} /> Add Multiple Choice Question
            </button>
          </div>
        )}

        {/* Section 4: AI & Submission Settings */}
        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>
                <Sparkles size={18} style={{ color: 'var(--accent-green)' }} /> AI Diagnostic &amp; Recommendation Engine
              </div>
              <div className={styles.sectionDesc}>
                Evaluate student mistakes and recommend personalized courses
              </div>
            </div>
          </div>

          <div className={styles.aiBanner}>
            <Sparkles size={22} className={styles.aiBannerIcon} />
            <div>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={aiEvaluationEnabled}
                  onChange={(e) => setAiEvaluationEnabled(e.target.checked)}
                  style={{ accentColor: 'var(--accent-green)', width: '16px', height: '16px' }}
                />
                <span>Enable AI Error Diagnosis &amp; Smart Course Recommendations</span>
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.4' }}>
                When students submit their solutions, the AI will diagnose why failed test cases occurred, highlight exact algorithmic mistakes (e.g. infinite recursion, array boundary overflow, missing base cases), and recommend relevant courses from the CodeCampus learning catalog.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                style={{ accentColor: 'var(--accent-green)', width: '16px', height: '16px' }}
              />
              <span>Publish contest immediately (make visible in Contests section)</span>
            </label>
          </div>
        </div>

        {/* Total Weight Bar */}
        <div className={styles.summaryRow} style={{ marginBottom: '24px', padding: '16px 20px', background: 'var(--bg-card)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Total Contest Assessment Weight
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Coding: {codingPoints} pts {contestType === 'superset' && `· MCQs: ${mcqPoints} pts`}
            </div>
          </div>
          <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
            {totalPoints} Points Total
          </span>
        </div>

        {/* Footer Actions */}
        <div className={styles.footerActions}>
          <Link href="/instructor/contests" className={styles.cancelBtn}>
            Cancel
          </Link>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting || selectedProblems.length === 0}
          >
            <Trophy size={16} />
            {submitting ? 'Creating Contest...' : `Publish ${contestType === 'superset' ? 'Interactive' : 'Standard'} Contest`}
          </button>
        </div>
      </form>
    </div>
  );
}
