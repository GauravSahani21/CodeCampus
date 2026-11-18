'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, ChevronLeft, Check, Plus, Trash2, Eye,
  EyeOff, Zap, Code2, FileText, TestTube, Settings2, X,
  GripVertical, AlertCircle, Info, Star,
} from 'lucide-react';
import api from '@/lib/api';
import styles from './create.module.css';

// ─── Types ──────────────────────────────────────────────────────────────────
interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  isExample: boolean;
  explanation?: string;
}

interface StarterCode {
  python: string;
  java: string;
  cpp: string;
  javascript: string;
}

interface ProblemForm {
  // Step 1
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  // Step 2
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  // Step 3
  testCases: TestCase[];
  // Step 4
  starterCode: StarterCode;
  aiEnabled: boolean;
  aiConcepts: string[];
}

const ALL_TAGS = [
  'Array', 'String', 'Hash Table', 'Two Pointers', 'Sliding Window',
  'Stack', 'Queue', 'Linked List', 'Binary Search', 'Sorting',
  'Tree', 'Graph', 'BFS', 'DFS', 'Dynamic Programming',
  'Greedy', 'Recursion', 'Backtracking', 'Math', 'Bit Manipulation',
];

const STEPS = [
  { id: 1, label: 'Problem Details', icon: FileText  },
  { id: 2, label: 'Description',     icon: Code2     },
  { id: 3, label: 'Test Cases',      icon: TestTube  },
  { id: 4, label: 'Starter Code',    icon: Settings2 },
];

const STARTER_TEMPLATES: StarterCode = {
  python: `def solve():\n    # Read input\n    n = int(input())\n    \n    # Write your solution here\n    \n    # Print output\n    print(result)\n\nif __name__ == "__main__":\n    solve()`,
  java: `import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n        // Read input\n        int n = sc.nextInt();\n        \n        // Write your solution here\n        \n        // Print output\n        System.out.println(result);\n    }\n}`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Read input\n    int n;\n    cin >> n;\n    \n    // Write your solution here\n    \n    // Print output\n    cout << result << endl;\n    \n    return 0;\n}`,
  javascript: `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\nrl.on('line', (line) => lines.push(line.trim()));\nrl.on('close', () => {\n    // Read input\n    const n = parseInt(lines[0]);\n    \n    // Write your solution here\n    \n    // Print output\n    console.log(result);\n});`,
};

const uid = () => Math.random().toString(36).slice(2, 9);

const INITIAL_FORM: ProblemForm = {
  title: '',
  difficulty: 'Easy',
  tags: [],
  timeLimitMs: 2000,
  memoryLimitMb: 256,
  description: '',
  inputFormat: '',
  outputFormat: '',
  constraints: '',
  // Starts with only 1 test case by default
  testCases: [
    {
      id: uid(),
      input: '',
      expectedOutput: '',
      isHidden: false,
      isExample: true,
      explanation: '',
    },
  ],
  starterCode: STARTER_TEMPLATES,
  aiEnabled: true,
  aiConcepts: [],
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function CreateProblemPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ProblemForm>(INITIAL_FORM);
  const [activeLanguage, setActiveLanguage] = useState<keyof StarterCode>('python');
  const [previewMode, setPreviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Helpers ────────────────────────────────────────────────────
  const setField = <K extends keyof ProblemForm>(key: K, val: ProblemForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const toggleTag = (tag: string) => {
    setField('tags', form.tags.includes(tag) ? form.tags.filter((t) => t !== tag) : [...form.tags, tag]);
  };

  const toggleAiConcept = (tag: string) => {
    setField('aiConcepts', form.aiConcepts.includes(tag) ? form.aiConcepts.filter((t) => t !== tag) : [...form.aiConcepts, tag]);
  };

  // Test cases: Add case (up to 10)
  const addTestCase = () => {
    if (form.testCases.length >= 10) return;
    setField('testCases', [
      ...form.testCases,
      {
        id: uid(),
        input: '',
        expectedOutput: '',
        isHidden: true,
        isExample: false,
        explanation: '',
      },
    ]);
  };

  // Remove case (keep at least 1)
  const removeTestCase = (id: string) => {
    if (form.testCases.length <= 1) return;
    setField('testCases', form.testCases.filter((tc) => tc.id !== id));
  };

  const updateTestCase = (id: string, field: keyof Omit<TestCase, 'id'>, val: string | boolean) => {
    setField(
      'testCases',
      form.testCases.map((tc) => (tc.id === id ? { ...tc, [field]: val } : tc))
    );
  };

  // Validation
  const validate = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!form.title.trim()) errs.title = 'Title is required';
      if (form.tags.length === 0) errs.tags = 'Select at least one tag';
    }
    if (s === 2) {
      if (!form.description.trim()) errs.description = 'Description is required';
      else if (form.description.trim().length < 20) errs.description = 'Description must be at least 20 characters';
    }
    if (s === 3) {
      if (form.testCases.length === 0) {
        errs.testCases = 'At least one test case is required';
      }
      form.testCases.forEach((tc, i) => {
        if (!tc.input.trim()) errs[`tc_input_${i}`] = 'Input is required';
        if (!tc.expectedOutput.trim()) errs[`tc_output_${i}`] = 'Expected output is required';
      });
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (validate(step)) setStep((s) => Math.min(s + 1, 4));
  };
  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    const token =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('cf_token')
        : null;

    if (!token) {
      alert(
        'You are not currently logged in as an Instructor!\n\nPlease sign in with:\nEmail: instructor@codecampus.com\nPassword: Instructor@123\n\nRedirecting to login...'
      );
      router.push('/auth/login');
      return;
    }

    if (!validate(1) || !validate(2) || !validate(3)) {
      alert('Please fill out all required fields before publishing.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        difficulty: form.difficulty,
        tags: form.tags,
        description: form.description,
        constraints:
          form.constraints ||
          (form.inputFormat ? `Input Format:\n${form.inputFormat}\n\nOutput Format:\n${form.outputFormat}` : ''),
        testCases: form.testCases.map((tc) => ({
          input: tc.input.trim(),
          expectedOutput: tc.expectedOutput.trim(),
          isHidden: tc.isExample ? false : tc.isHidden,
          isExample: tc.isExample,
          explanation: tc.explanation?.trim() || '',
        })),
        starterTemplates: form.starterCode,
        timeLimitMs: form.timeLimitMs,
        memoryLimitMb: form.memoryLimitMb,
        aiEnabled: form.aiEnabled,
        aiConcepts: form.aiConcepts.length > 0 ? form.aiConcepts : form.tags,
        isPublished: true,
      };

      await api.post('/instructor/problems', payload);
      router.push('/instructor/problems');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to create problem';
      alert(`Error: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Counts for summary
  const exampleCount = form.testCases.filter((t) => t.isExample).length;
  const visibleCount = form.testCases.filter((t) => !t.isHidden && !t.isExample).length;
  const hiddenCount  = form.testCases.filter((t) => t.isHidden).length;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Create Problem</h1>
          <p className={styles.pageSubtitle}>Build a coding challenge with test cases and starter code for student submissions</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/instructor/problems')}>
          <X size={14} /> Discard
        </button>
      </div>

      {/* Step indicator */}
      <div className={styles.stepper}>
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className={styles.stepWrapper}>
              <button
                className={`${styles.stepItem} ${active ? styles.stepActive : ''} ${done ? styles.stepDone : ''}`}
                onClick={() => { if (done) setStep(s.id); }}
              >
                <div className={styles.stepCircle}>
                  {done ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} strokeWidth={1.8} />}
                </div>
                <span className={styles.stepLabel}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Form area */}
      <div className={styles.formArea}>
        {/* ── STEP 1: Problem Details ─────────────────────────── */}
        {step === 1 && (
          <div className={styles.formCard} key="step1">
            <h2 className={styles.sectionTitle}>Problem Details</h2>

            <div className={styles.field}>
              <label className={styles.label}>Problem Title <span className={styles.req}>*</span></label>
              <input
                className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                placeholder="e.g. Two Sum, Reverse a Linked List..."
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
              />
              {errors.title && <div className={styles.errorMsg}><AlertCircle size={12} />{errors.title}</div>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Difficulty <span className={styles.req}>*</span></label>
              <div className={styles.diffButtons}>
                {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                  <button
                    key={d}
                    className={`${styles.diffBtn} ${form.difficulty === d ? styles['diffActive_' + d.toLowerCase()] : ''}`}
                    onClick={() => setField('difficulty', d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Tags / Topics <span className={styles.req}>*</span></label>
              <div className={styles.tagGrid}>
                {ALL_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`${styles.tagChip} ${form.tags.includes(tag) ? styles.tagChipActive : ''}`}
                  >
                    {tag}
                    {form.tags.includes(tag) && <Check size={11} strokeWidth={2.5} />}
                  </button>
                ))}
              </div>
              {errors.tags && <div className={styles.errorMsg}><AlertCircle size={12} />{errors.tags}</div>}
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label}>Time Limit (ms)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={form.timeLimitMs}
                  onChange={(e) => setField('timeLimitMs', Number(e.target.value))}
                  min={500} max={10000} step={500}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Memory Limit (MB)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={form.memoryLimitMb}
                  onChange={(e) => setField('memoryLimitMb', Number(e.target.value))}
                  min={64} max={1024} step={64}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Description (NO separate examples) ──────── */}
        {step === 2 && (
          <div className={styles.formCard} key="step2">
            <div className={styles.sectionTitleRow}>
              <div>
                <h2 className={styles.sectionTitle}>Problem Statement</h2>
                <p className={styles.fieldHint} style={{ margin: '4px 0 0' }}>
                  Define the challenge clearly. You will add worked examples and test cases in the next step.
                </p>
              </div>
              <button
                className={styles.previewToggle}
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? <><EyeOff size={13} /> Edit</> : <><Eye size={13} /> Preview</>}
              </button>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Description <span className={styles.req}>*</span></label>
              <div className={styles.infoTip}><Info size={12} />Markdown supported. Explain problem objective clearly.</div>
              {previewMode ? (
                <div
                  className={`${styles.preview} markdownBody`}
                  dangerouslySetInnerHTML={{ __html: form.description.replace(/\n/g, '<br/>') }}
                />
              ) : (
                <textarea
                  className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                  rows={10}
                  placeholder={`Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.`}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                />
              )}
              {errors.description && <div className={styles.errorMsg}><AlertCircle size={12} />{errors.description}</div>}
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label}>Input Format (optional)</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="e.g. First line contains integer n. Second line contains n space-separated integers."
                  value={form.inputFormat}
                  onChange={(e) => setField('inputFormat', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Output Format (optional)</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="e.g. Print two indices separated by a space."
                  value={form.outputFormat}
                  onChange={(e) => setField('outputFormat', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Constraints (optional)</label>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder={`1 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.`}
                value={form.constraints}
                onChange={(e) => setField('constraints', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: Unified Test Cases (Start with 1, add more, toggle example) ─ */}
        {step === 3 && (
          <div className={styles.formCard} key="step3">
            <div className={styles.sectionTitleRow}>
              <div>
                <h2 className={styles.sectionTitle}>Test Cases & Examples</h2>
                <p className={styles.fieldHint} style={{ margin: '4px 0 0' }}>
                  Decide how many test cases to add. Toggle <strong>Example Case</strong> to show it to students as a worked example in the problem description.
                </p>
              </div>
              <span className={styles.tcCount}>{form.testCases.length} test case{form.testCases.length !== 1 ? 's' : ''}</span>
            </div>

            <div className={styles.tcList}>
              {form.testCases.map((tc, i) => (
                <div
                  key={tc.id}
                  className={`${styles.tcCard} ${tc.isExample ? styles.tcExample : tc.isHidden ? styles.tcHidden : styles.tcVisible}`}
                >
                  <div className={styles.tcHeader}>
                    <div className={styles.tcLeft}>
                      <GripVertical size={14} className={styles.grip} />
                      <span className={styles.tcNum}>Test Case {i + 1}</span>
                      {tc.isExample && (
                        <span className={styles.exampleBadge}>
                          <Star size={10} fill="currentColor" /> Example
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Toggle Example */}
                      <button
                        type="button"
                        className={`${styles.exampleToggleBtn} ${tc.isExample ? styles.exampleToggleBtnActive : ''}`}
                        onClick={() => {
                          const nextVal = !tc.isExample;
                          updateTestCase(tc.id, 'isExample', nextVal);
                          if (nextVal) {
                            updateTestCase(tc.id, 'isHidden', false);
                          }
                        }}
                        title={tc.isExample ? "Visible to students as a worked example" : "Click to mark as an example test case"}
                      >
                        <Star size={11} fill={tc.isExample ? 'currentColor' : 'none'} />
                        {tc.isExample ? 'Example Case' : 'Make Example'}
                      </button>

                      {/* Toggle Hidden / Visible (only if not example, because examples are always visible) */}
                      {!tc.isExample && (
                        <button
                          type="button"
                          className={`${styles.tcVisibilityBtn} ${tc.isHidden ? styles.tcVisHidden : styles.tcVisVisible}`}
                          onClick={() => updateTestCase(tc.id, 'isHidden', !tc.isHidden)}
                          title={tc.isHidden ? "Hidden from students (only checked upon submission)" : "Visible in problem tests"}
                        >
                          {tc.isHidden ? <><EyeOff size={11} /> Hidden</> : <><Eye size={11} /> Visible</>}
                        </button>
                      )}

                      {/* Delete test case */}
                      <button
                        type="button"
                        className={styles.tcRemoveBtn}
                        onClick={() => removeTestCase(tc.id)}
                        disabled={form.testCases.length <= 1}
                        title={form.testCases.length <= 1 ? "At least 1 test case is required" : "Remove test case"}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.labelSm}>Standard Input</label>
                      <textarea
                        className={`${styles.codeTextarea} ${errors[`tc_input_${i}`] ? styles.inputError : ''}`}
                        rows={3}
                        placeholder={`4\n1 2 3 4\n5`}
                        value={tc.input}
                        onChange={(e) => updateTestCase(tc.id, 'input', e.target.value)}
                      />
                      {errors[`tc_input_${i}`] && <div className={styles.errorMsg}><AlertCircle size={12} />{errors[`tc_input_${i}`]}</div>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.labelSm}>Expected Output</label>
                      <textarea
                        className={`${styles.codeTextarea} ${errors[`tc_output_${i}`] ? styles.inputError : ''}`}
                        rows={3}
                        placeholder="0 2"
                        value={tc.expectedOutput}
                        onChange={(e) => updateTestCase(tc.id, 'expectedOutput', e.target.value)}
                      />
                      {errors[`tc_output_${i}`] && <div className={styles.errorMsg}><AlertCircle size={12} />{errors[`tc_output_${i}`]}</div>}
                    </div>
                  </div>

                  {/* Optional Explanation for Example Test Cases */}
                  {tc.isExample && (
                    <div className={styles.field} style={{ marginTop: -8 }}>
                      <label className={styles.labelSm}>Explanation for Students (optional)</label>
                      <input
                        className={styles.input}
                        placeholder="e.g. Because nums[0] + nums[2] == 1 + 3 == 4 = target"
                        value={tc.explanation || ''}
                        onChange={(e) => updateTestCase(tc.id, 'explanation', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add more test cases */}
            {form.testCases.length < 10 && (
              <button type="button" className={styles.addTcBtn} onClick={addTestCase}>
                <Plus size={15} strokeWidth={2.5} /> Add Test Case ({form.testCases.length}/10)
              </button>
            )}

            {/* Summary counters */}
            <div className={styles.tcSummary}>
              <div className={styles.tcStat}>
                <Star size={13} style={{ color: 'var(--accent-green)' }} />
                <span>{exampleCount} Example{exampleCount !== 1 ? 's' : ''}</span>
              </div>
              <div className={styles.tcStat}>
                <Eye size={13} />
                <span>{visibleCount} Visible</span>
              </div>
              <div className={styles.tcStat}>
                <EyeOff size={13} />
                <span>{hiddenCount} Hidden</span>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Starter Code ─────────────────────── */}
        {step === 4 && (
          <div className={styles.formCard} key="step4">
            <h2 className={styles.sectionTitle}>Starter Code &amp; Settings</h2>

            {/* Starter Code */}
            <div className={styles.field}>
              <label className={styles.label}>Starter Code Templates</label>
              <p className={styles.fieldHint}>This is the initial code students see when they open the editor.</p>
              <div className={styles.langTabs}>
                {(Object.keys(form.starterCode) as (keyof StarterCode)[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    className={`${styles.langTab} ${activeLanguage === lang ? styles.langTabActive : ''}`}
                    onClick={() => setActiveLanguage(lang)}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <textarea
                className={styles.codeEditor}
                rows={14}
                value={form.starterCode[activeLanguage]}
                onChange={(e) =>
                  setField('starterCode', { ...form.starterCode, [activeLanguage]: e.target.value })
                }
                spellCheck={false}
              />
            </div>

            {/* Summary review */}
            <div className={styles.reviewBox}>
              <div className={styles.reviewTitle}>Review Before Publishing</div>
              <div className={styles.reviewGrid}>
                <div className={styles.reviewItem}><span>Title</span><strong>{form.title || '—'}</strong></div>
                <div className={styles.reviewItem}><span>Difficulty</span>
                  <strong className={`diff-${form.difficulty.toLowerCase()}`}>{form.difficulty}</strong>
                </div>
                <div className={styles.reviewItem}><span>Tags</span><strong>{form.tags.join(', ') || '—'}</strong></div>
                <div className={styles.reviewItem}>
                  <span>Test Cases</span>
                  <strong>{form.testCases.length} total ({exampleCount} example, {visibleCount} visible, {hiddenCount} hidden)</strong>
                </div>
                <div className={styles.reviewItem}><span>Time Limit</span><strong>{form.timeLimitMs}ms</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className={styles.navButtons}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={goPrev}
            disabled={step === 1}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <div className={styles.navRight}>
            {step < 4 ? (
              <button type="button" className={styles.nextBtn} onClick={goNext}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className={styles.publishBtn}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <><div className="spinner" style={{ width: 14, height: 14 }} /> Publishing...</>
                ) : (
                  <><Check size={16} strokeWidth={2.5} /> Publish Problem</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
