'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Video,
  FileDown,
  BrainCircuit,
  Image as ImageIcon,
  Check,
  ChevronRight,
  Send,
  HelpCircle,
  Settings,
  Sparkles,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './create.module.css';

interface QuizQuestionForm {
  question: string;
  type: 'mcq' | 'true_false';
  options: string[];
  answer: number;
  explanation: string;
}

interface MaterialForm {
  title: string;
  url: string;
  fileType: string;
}

interface LessonForm {
  title: string;
  order: number;
  duration: number;
  codeLanguage: string;
  content: string;
  codeExample: string;
  videoUrl?: string;
  materials: MaterialForm[];
  quiz: QuizQuestionForm[];
}

export default function CreateCourseWizardPage() {
  const router = useRouter();

  // Wizard current step: 1 (Info), 2 (Media), 3 (Curriculum), 4 (Review)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Course Info
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Data Structures & Algorithms');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('Algorithms, Problem Solving, Java');

  // Step 2: Media & Assets
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1516116211227-bbc03713f03b?q=80&w=600&auto=format&fit=crop');
  const [promotionalVideoUrl, setPromotionalVideoUrl] = useState('');

  // Step 3: Curriculum & Quizzes
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(10);
  const [passingPercent, setPassingPercent] = useState<number>(75);
  const [maxRetries, setMaxRetries] = useState<number>(3);

  const [lessons, setLessons] = useState<LessonForm[]>([
    {
      title: 'Course Introduction & Environment Setup',
      order: 1,
      duration: 15,
      codeLanguage: 'java',
      content: `## Welcome to the Course!\n\nIn this lesson, we will understand the fundamental principles and set up our coding environment.`,
      codeExample: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Ready to learn!");\n    }\n}`,
      videoUrl: '',
      materials: [
        { title: 'Lecture Notes (PDF)', url: 'https://example.com/notes.pdf', fileType: 'pdf' }
      ],
      quiz: [
        {
          question: 'What is the primary objective of this introductory module?',
          type: 'mcq',
          options: ['Mastering quantum computing', 'Setting up environment & core fundamentals', 'Writing production kernels', 'None of the above'],
          answer: 1,
          explanation: 'This first module ensures every student has an operational development environment.'
        }
      ]
    },
  ]);

  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Slug generation helper
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')) {
      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'));
    }
  };

  // Lesson Management
  const addLesson = () => {
    const newIdx = lessons.length + 1;
    setLessons(prev => [
      ...prev,
      {
        title: `Lesson ${newIdx}: New Topic`,
        order: newIdx,
        duration: 15,
        codeLanguage: 'java',
        content: `## Lesson ${newIdx}\n\nWrite detailed tutorial content with code blocks here...`,
        codeExample: `// Code example\npublic class Main {\n    public static void main(String[] args) {\n        // Try your code here\n    }\n}`,
        materials: [],
        quiz: []
      }
    ]);
    setActiveLessonIndex(lessons.length);
  };

  const removeLesson = (index: number) => {
    if (lessons.length <= 1) {
      toast.error('Course must have at least one lesson');
      return;
    }
    setLessons(prev =>
      prev.filter((_, i) => i !== index).map((l, i) => ({ ...l, order: i + 1 }))
    );
    if (activeLessonIndex >= lessons.length - 1) {
      setActiveLessonIndex(Math.max(0, lessons.length - 2));
    }
  };

  const updateActiveLesson = (field: keyof LessonForm, value: any) => {
    setLessons(prev =>
      prev.map((l, i) => (i === activeLessonIndex ? { ...l, [field]: value } : l))
    );
  };

  // Material helpers for active lesson
  const addMaterialToActive = () => {
    const current = lessons[activeLessonIndex];
    updateActiveLesson('materials', [
      ...(current.materials || []),
      { title: 'New Reference Material', url: 'https://example.com/file', fileType: 'pdf' }
    ]);
  };

  const removeMaterialFromActive = (mIdx: number) => {
    const current = lessons[activeLessonIndex];
    updateActiveLesson('materials', (current.materials || []).filter((_, i) => i !== mIdx));
  };

  const updateMaterialInActive = (mIdx: number, field: keyof MaterialForm, value: string) => {
    const current = lessons[activeLessonIndex];
    const updated = (current.materials || []).map((m, i) => i === mIdx ? { ...m, [field]: value } : m);
    updateActiveLesson('materials', updated);
  };

  // Quiz helpers for active lesson
  const addQuizQuestionToActive = () => {
    const current = lessons[activeLessonIndex];
    updateActiveLesson('quiz', [
      ...(current.quiz || []),
      {
        question: 'New Question?',
        type: 'mcq',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        answer: 0,
        explanation: 'Explanation for the correct answer.'
      }
    ]);
  };

  const removeQuizQuestionFromActive = (qIdx: number) => {
    const current = lessons[activeLessonIndex];
    updateActiveLesson('quiz', (current.quiz || []).filter((_, i) => i !== qIdx));
  };

  const updateQuizQuestionInActive = (qIdx: number, field: keyof QuizQuestionForm, value: any) => {
    const current = lessons[activeLessonIndex];
    const updated = (current.quiz || []).map((q, i) => i === qIdx ? { ...q, [field]: value } : q);
    updateActiveLesson('quiz', updated);
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    setErrorMsg('');
    if (step === 1) {
      if (!title.trim()) {
        setErrorMsg('Please enter a course title.');
        return false;
      }
      if (!slug.trim()) {
        setErrorMsg('Please enter a valid URL slug.');
        return false;
      }
      if (!description.trim()) {
        setErrorMsg('Please provide a course description.');
        return false;
      }
    } else if (step === 3) {
      if (lessons.length === 0) {
        setErrorMsg('At least one lesson is required in the curriculum.');
        return false;
      }
      for (let i = 0; i < lessons.length; i++) {
        if (!lessons[i].title.trim() || !lessons[i].content.trim()) {
          setErrorMsg(`Lesson ${i + 1} is missing a title or content.`);
          setActiveLessonIndex(i);
          return false;
        }
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(p => Math.min(4, p + 1));
    }
  };

  // Submit Handler
  const handleFinalSubmit = async (submitStatus: 'draft' | 'pending_approval') => {
    if (!validateStep(1) || !validateStep(3)) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const payload = {
        title,
        slug,
        category,
        description,
        difficulty,
        price,
        tags,
        thumbnail,
        promotionalVideoUrl,
        quizSettings: {
          timeLimitMinutes,
          passingPercent,
          maxRetries,
        },
        approvalStatus: submitStatus,
        isPublished: submitStatus === 'pending_approval' ? false : false,
        lessons,
      };

      await api.post('/learn', payload);

      if (submitStatus === 'pending_approval') {
        toast.success('Course submitted to Admin Approval Queue!');
      } else {
        toast.success('Course saved as draft!');
      }

      router.push('/instructor/courses');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to submit course');
      setSubmitting(false);
    }
  };

  const activeLesson = lessons[activeLessonIndex] || lessons[0];

  return (
    <div className={styles.page}>
      {/* Top Header */}
      <div className={styles.header}>
        <div>
          <Link href="/instructor/courses" className={styles.backLink}>
            <ArrowLeft size={14} /> Back to Courses
          </Link>
          <h1 className={styles.title}>
            <BookOpen size={28} style={{ color: 'var(--accent-green)' }} />
            Course Builder Studio
          </h1>
          <p className={styles.subtitle}>Create interactive curriculum, multimedia lectures, and self-grading quizzes.</p>
        </div>
      </div>

      {/* Step Stepper Header */}
      <div className={styles.wizardStepper}>
        {[
          { step: 1, label: 'Course Info' },
          { step: 2, label: 'Media & Assets' },
          { step: 3, label: 'Curriculum & Quizzes' },
          { step: 4, label: 'Review & Submit' }
        ].map(item => (
          <div
            key={item.step}
            className={`${styles.stepPill} ${currentStep === item.step ? styles.stepPillActive : ''} ${currentStep > item.step ? styles.stepPillDone : ''}`}
            onClick={() => currentStep > item.step && setCurrentStep(item.step)}
          >
            <span className={styles.stepNum}>
              {currentStep > item.step ? <Check size={14} /> : item.step}
            </span>
            <span className={styles.stepText}>{item.label}</span>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: COURSE INFO */}
      {currentStep === 1 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Sparkles size={18} color="#38bdf8" /> Step 1: Course Overview & Details
          </h2>
          <p className={styles.sectionDesc}>Define the title, slug, target difficulty, and pricing for this course.</p>

          <div className={styles.formGrid}>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Course Title *</label>
              <input
                className={styles.input}
                placeholder="e.g. Complete System Design & Scalability Masterclass"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>URL Slug *</label>
              <input
                className={styles.input}
                placeholder="e.g. system-design-masterclass"
                value={slug}
                onChange={e => setSlug(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Category</label>
              <select className={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Web Development">Web Development</option>
                <option value="Systems & Cloud">Systems & Cloud</option>
                <option value="Machine Learning">Machine Learning</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Difficulty Level</label>
              <select className={styles.select} value={difficulty} onChange={e => setDifficulty(e.target.value as any)}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Price (USD) - $0 for Free</label>
              <input
                type="number"
                min="0"
                step="1"
                className={styles.input}
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
              />
            </div>

            <div className={styles.fieldFull}>
              <label className={styles.label}>Course Tags (comma-separated)</label>
              <input
                className={styles.input}
                placeholder="Java, Data Structures, Problem Solving, LeetCode"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
              />
            </div>

            <div className={styles.fieldFull}>
              <label className={styles.label}>Course Description & Learning Outcomes *</label>
              <textarea
                className={styles.textarea}
                rows={4}
                placeholder="Describe what students will learn, prerequisites, and skills gained..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.wizardFooter}>
            <div />
            <button className="btn btn-primary" onClick={handleNextStep}>
              Next: Media & Assets <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MEDIA & ASSETS */}
      {currentStep === 2 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <ImageIcon size={18} color="#a371f7" /> Step 2: Media & Promotional Assets
          </h2>
          <p className={styles.sectionDesc}>Add a course thumbnail and promotional video teaser for student discovery.</p>

          <div className={styles.formGrid}>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Cover / Thumbnail Image URL</label>
              <input
                className={styles.input}
                placeholder="https://example.com/banner.jpg"
                value={thumbnail}
                onChange={e => setThumbnail(e.target.value)}
              />
              {thumbnail && (
                <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', height: 180, maxWidth: 360, background: '#000', border: '1px solid var(--border)' }}>
                  <img src={thumbnail} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div className={styles.fieldFull}>
              <label className={styles.label}>Promotional Teaser Video URL (YouTube Embed or MP4)</label>
              <input
                className={styles.input}
                placeholder="e.g. https://www.youtube.com/embed/eIrMbAQSU34"
                value={promotionalVideoUrl}
                onChange={e => setPromotionalVideoUrl(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.wizardFooter}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
              <ArrowLeft size={16} /> Back: Course Info
            </button>
            <button className="btn btn-primary" onClick={handleNextStep}>
              Next: Curriculum & Quizzes <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CURRICULUM & QUIZZES */}
      {currentStep === 3 && (
        <div className={styles.curriculumLayout}>
          {/* Left Column: Lesson Selector */}
          <div className={styles.lessonsListCol}>
            <div className={styles.lessonsListHeader}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Curriculum ({lessons.length})</span>
              <button className="btn btn-secondary btn-sm" onClick={addLesson}>
                <Plus size={14} /> Add Lesson
              </button>
            </div>

            <div className={styles.lessonSelectorList}>
              {lessons.map((l, idx) => (
                <div
                  key={idx}
                  className={`${styles.lessonSelectorItem} ${activeLessonIndex === idx ? styles.lessonSelectorItemActive : ''}`}
                  onClick={() => setActiveLessonIndex(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', opacity: 0.6 }}>#{idx + 1}</span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {l.title || `Lesson ${idx + 1}`}
                    </span>
                  </div>
                  {lessons.length > 1 && (
                    <button
                      className={styles.miniDeleteBtn}
                      onClick={e => {
                        e.stopPropagation();
                        removeLesson(idx);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Global Quiz Settings */}
            <div style={{ marginTop: 24, padding: 14, borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Settings size={14} color="#38bdf8" /> Quiz Passing Rules
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.78rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: 2 }}>Time Limit (mins)</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.input}
                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                    value={timeLimitMinutes}
                    onChange={e => setTimeLimitMinutes(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: 2 }}>Passing Threshold (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    className={styles.input}
                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                    value={passingPercent}
                    onChange={e => setPassingPercent(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Active Lesson Editor */}
          <div className={styles.activeLessonEditor}>
            <div className={styles.sectionHeaderLine}>
              <span className={styles.lessonOrderPill}>Editing Lesson #{activeLessonIndex + 1}</span>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.fieldFull}>
                <label className={styles.label}>Lesson Title *</label>
                <input
                  className={styles.input}
                  value={activeLesson.title}
                  onChange={e => updateActiveLesson('title', e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  className={styles.input}
                  value={activeLesson.duration}
                  onChange={e => updateActiveLesson('duration', Number(e.target.value))}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Programming Language</label>
                <select
                  className={styles.select}
                  value={activeLesson.codeLanguage}
                  onChange={e => updateActiveLesson('codeLanguage', e.target.value)}
                >
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                </select>
              </div>

              <div className={styles.fieldFull}>
                <label className={styles.label}>Lecture Video URL (Optional - YouTube embed or MP4)</label>
                <input
                  className={styles.input}
                  placeholder="https://www.youtube.com/embed/..."
                  value={activeLesson.videoUrl || ''}
                  onChange={e => updateActiveLesson('videoUrl', e.target.value)}
                />
              </div>

              <div className={styles.fieldFull}>
                <label className={styles.label}>Lesson Markdown Content *</label>
                <textarea
                  className={styles.textarea}
                  rows={8}
                  value={activeLesson.content}
                  onChange={e => updateActiveLesson('content', e.target.value)}
                />
              </div>

              <div className={styles.fieldFull}>
                <label className={styles.label}>Initial Code Sandbox Example</label>
                <textarea
                  className={styles.textarea}
                  rows={6}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                  value={activeLesson.codeExample}
                  onChange={e => updateActiveLesson('codeExample', e.target.value)}
                />
              </div>
            </div>

            {/* Downloadable Materials Sub-section */}
            <div style={{ marginTop: 24, padding: 18, borderRadius: 8, background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileDown size={16} color="#38bdf8" /> Downloadable Files & Notes ({activeLesson.materials?.length || 0})
                </span>
                <button className="btn btn-secondary btn-sm" onClick={addMaterialToActive}>
                  <Plus size={12} /> Add File
                </button>
              </div>

              {(activeLesson.materials || []).map((mat, mIdx) => (
                <div key={mIdx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    className={styles.input}
                    style={{ flex: 2 }}
                    placeholder="Material Title"
                    value={mat.title}
                    onChange={e => updateMaterialInActive(mIdx, 'title', e.target.value)}
                  />
                  <input
                    className={styles.input}
                    style={{ flex: 3 }}
                    placeholder="File Download URL"
                    value={mat.url}
                    onChange={e => updateMaterialInActive(mIdx, 'url', e.target.value)}
                  />
                  <select
                    className={styles.select}
                    style={{ width: 90 }}
                    value={mat.fileType}
                    onChange={e => updateMaterialInActive(mIdx, 'fileType', e.target.value)}
                  >
                    <option value="pdf">PDF</option>
                    <option value="zip">ZIP</option>
                    <option value="code">Code</option>
                    <option value="doc">DOC</option>
                  </select>
                  <button className={styles.miniDeleteBtn} onClick={() => removeMaterialFromActive(mIdx)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Quiz Questions Sub-section */}
            <div style={{ marginTop: 20, padding: 18, borderRadius: 8, background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BrainCircuit size={16} color="#eab308" /> Lesson Quiz Questions ({activeLesson.quiz?.length || 0})
                </span>
                <button className="btn btn-secondary btn-sm" onClick={addQuizQuestionToActive}>
                  <Plus size={12} /> Add Question
                </button>
              </div>

              {(activeLesson.quiz || []).map((q, qIdx) => (
                <div key={qIdx} style={{ padding: 14, borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-blue)' }}>Question #{qIdx + 1}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select
                        className={styles.select}
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        value={q.type}
                        onChange={e => updateQuizQuestionInActive(qIdx, 'type', e.target.value)}
                      >
                        <option value="mcq">Multiple Choice</option>
                        <option value="true_false">True / False</option>
                      </select>
                      <button className={styles.miniDeleteBtn} onClick={() => removeQuizQuestionFromActive(qIdx)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <input
                    className={styles.input}
                    style={{ width: '100%', marginBottom: 8 }}
                    placeholder="Enter question prompt..."
                    value={q.question}
                    onChange={e => updateQuizQuestionInActive(qIdx, 'question', e.target.value)}
                  />

                  {q.type === 'mcq' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="radio"
                            name={`correct-${activeLessonIndex}-${qIdx}`}
                            checked={q.answer === oIdx}
                            onChange={() => updateQuizQuestionInActive(qIdx, 'answer', oIdx)}
                          />
                          <input
                            className={styles.input}
                            style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }}
                            value={opt}
                            onChange={e => {
                              const newOpts = [...q.options];
                              newOpts[oIdx] = e.target.value;
                              updateQuizQuestionInActive(qIdx, 'options', newOpts);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`tf-${activeLessonIndex}-${qIdx}`}
                          checked={q.answer === 0}
                          onChange={() => {
                            updateQuizQuestionInActive(qIdx, 'options', ['True', 'False']);
                            updateQuizQuestionInActive(qIdx, 'answer', 0);
                          }}
                        />
                        True (Correct Answer)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`tf-${activeLessonIndex}-${qIdx}`}
                          checked={q.answer === 1}
                          onChange={() => {
                            updateQuizQuestionInActive(qIdx, 'options', ['True', 'False']);
                            updateQuizQuestionInActive(qIdx, 'answer', 1);
                          }}
                        />
                        False (Correct Answer)
                      </label>
                    </div>
                  )}

                  <input
                    className={styles.input}
                    style={{ width: '100%', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                    placeholder="Explanation for student review (why this answer is correct)..."
                    value={q.explanation || ''}
                    onChange={e => updateQuizQuestionInActive(qIdx, 'explanation', e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className={styles.wizardFooter} style={{ marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setCurrentStep(2)}>
                <ArrowLeft size={16} /> Back: Media & Assets
              </button>
              <button className="btn btn-primary" onClick={handleNextStep}>
                Next: Review & Submit <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & SUBMIT */}
      {currentStep === 4 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <CheckCircle2 size={18} color="#39d353" /> Step 4: Review & Final Submission
          </h2>
          <p className={styles.sectionDesc}>Verify your course syllabus before publishing or submitting to Admin Approval Queue.</p>

          <div className={styles.reviewSummaryCard}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {thumbnail && (
                <div style={{ width: 140, height: 90, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={thumbnail} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span className="badge badge-blue">{category}</span>
                  <span className="badge badge-purple">{difficulty}</span>
                  <span style={{ fontSize: '0.8rem', color: price === 0 ? 'var(--accent-green)' : '#fff', fontWeight: 700 }}>
                    {price === 0 ? 'FREE' : `$${price}`}
                  </span>
                </div>
                <h3 style={{ margin: '4px 0 6px', fontSize: '1.2rem', fontWeight: 800 }}>{title}</h3>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {description}
                </p>
              </div>
            </div>

            <div className={styles.metricsRow} style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div>
                <span className={styles.metricVal}>{lessons.length}</span>
                <span className={styles.metricLabel}>Total Lessons</span>
              </div>
              <div>
                <span className={styles.metricVal}>{lessons.reduce((acc, l) => acc + (l.duration || 0), 0)}m</span>
                <span className={styles.metricLabel}>Total Duration</span>
              </div>
              <div>
                <span className={styles.metricVal}>{lessons.reduce((acc, l) => acc + (l.quiz?.length || 0), 0)}</span>
                <span className={styles.metricLabel}>Quiz Questions</span>
              </div>
              <div>
                <span className={styles.metricVal}>{passingPercent}%</span>
                <span className={styles.metricLabel}>Passing Threshold</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, padding: 18, borderRadius: 8, background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <HelpCircle size={15} /> Submission Guidelines
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Submitting for admin approval places your course into the <strong>Admin Review Queue</strong>. Administrators verify educational quality, quiz coverage, and lecture assets before publicly listing on the platform catalog.
            </p>
          </div>

          <div className={styles.wizardFooter} style={{ marginTop: 28 }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(3)}>
              <ArrowLeft size={16} /> Back: Curriculum
            </button>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-secondary"
                disabled={submitting}
                onClick={() => handleFinalSubmit('draft')}
              >
                Save as Draft
              </button>
              <button
                className="btn btn-primary"
                disabled={submitting}
                onClick={() => handleFinalSubmit('pending_approval')}
              >
                {submitting ? 'Submitting...' : <><Send size={15} /> Submit for Approval</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
