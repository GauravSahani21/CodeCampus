'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { markLessonCompleted, getCompletedLessons } from '@/lib/courseProgress';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Play,
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Code2,
  BrainCircuit,
  Video,
  FileDown,
  Timer,
  RotateCcw,
  Award,
  AlertCircle,
  ExternalLink,
  FileText
} from 'lucide-react';
import styles from './page.module.css';

const CodeEditor = dynamic(() => import('@/components/Editor/CodeEditor'), { ssr: false });
const OutputPanel = dynamic(() => import('@/components/Editor/OutputPanel'), { ssr: false });

interface QuizQuestion {
  question: string;
  type?: 'mcq' | 'true_false';
  options: string[];
  answer: number;
  explanation?: string;
}

interface LessonMaterial {
  title: string;
  url: string;
  fileType: string;
}

interface Lesson {
  _id: string;
  title: string;
  order: number;
  content: string;
  codeLanguage: string;
  codeExample: string;
  videoUrl?: string;
  materials?: LessonMaterial[];
  quiz?: QuizQuestion[];
  duration: number;
}

interface Course {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
  category?: string;
  quizSettings?: {
    timeLimitMinutes: number;
    passingPercent: number;
    maxRetries: number;
  };
  lessons: Lesson[];
}

const FALLBACK_COURSES: Record<string, Course> = {
  'java-full-course': {
    _id: '1', title: 'Java Full Course', slug: 'java-full-course', difficulty: 'Beginner',
    quizSettings: { timeLimitMinutes: 10, passingPercent: 70, maxRetries: 3 },
    lessons: [
      {
        _id: 'l1', title: 'Hello, World! in Java', order: 1, duration: 5, codeLanguage: 'java',
        videoUrl: 'https://www.youtube.com/embed/eIrMbAQSU34',
        materials: [
          { title: 'Java Cheat Sheet (PDF)', url: '#', fileType: 'pdf' },
          { title: 'Starter Code Templates', url: '#', fileType: 'zip' }
        ],
        codeExample: `// Your first Java program\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
        content: `## Welcome to Java!\n\nJava is a robust, object-oriented programming language used by millions of developers for everything from Android apps to enterprise server applications.\n\n### Your First Program\n\nIn Java, all code must reside within a **class**. The entry point for any Java program is the \`main\` method:\n\n\`\`\`java\npublic class Main {\n    public static void main(String[] args)\n    {\n        System.out.println("Hello, World!");\n    }\n}\n\`\`\`\n\n- \`public class Main\`: Defines a class named \`Main\`.\n- \`public static void main(String[] args)\`: The standard main method signature.\n- \`System.out.println()\`: Prints output to the console.\n\n### Try it!\n\nIn the editor below, type the code yourself. Then click **Run** to see the output.`,
        quiz: [
          {
            question: 'What is the entry point method for a Java program?',
            type: 'mcq',
            options: ['start()', 'init()', 'main()', 'run()'],
            answer: 2,
            explanation: 'In Java, execution begins at public static void main(String[] args).'
          },
          {
            question: 'Is Java a purely interpreted language without any byte-code compilation?',
            type: 'true_false',
            options: ['True', 'False'],
            answer: 1,
            explanation: 'False: Java source code is compiled into bytecode (.class) which is executed by the JVM.'
          },
          {
            question: 'Which statement prints text in Java?',
            type: 'mcq',
            options: ['console.log()', 'System.out.println()', 'print()', 'echo()'],
            answer: 1,
            explanation: 'System.out.println() is the standard console output method in Java.'
          },
        ]
      },
      {
        _id: 'l2', title: 'Variables, Types, and Casting', order: 2, duration: 10, codeLanguage: 'java',
        codeExample: `public class Main {\n    public static void main(String[] args) {\n        String name = "Alice";\n        int age = 25;\n        double height = 5.7;\n        boolean isStudent = true;\n        \n        System.out.println(name + " is " + age + " years old.");\n        \n        // Casting\n        int truncatedHeight = (int) height;\n        System.out.println("Height cast to int: " + truncatedHeight);\n    }\n}`,
        content: `## Variables & Data Types\n\nJava is **statically typed**, meaning you must declare the type of a variable before using it.\n\n### Primitive Types\n\n| Type | Size | Example | Description |\n|---|---|---|---|\n| \`int\` | 4 bytes | \`int age = 25;\` | Whole numbers |\n| \`double\` | 8 bytes | \`double height = 5.7;\` | Decimal numbers |\n| \`boolean\` | 1 bit | \`boolean active = true;\` | true or false |\n| \`char\` | 2 bytes | \`char grade = 'A';\` | Single character (single quotes) |\n\n> **Note:** \`String\` is not a primitive type in Java, it is a Class (which is why it starts with a capital S).\n\n### Casting\n\nYou can convert between numeric types:\n\`\`\`java\ndouble pi = 3.14159;\nint intPi = (int) pi; // truncates to 3\n\`\`\`\n`,
        quiz: [
          { question: 'Which of the following is NOT a primitive type in Java?', type: 'mcq', options: ['int', 'double', 'String', 'boolean'], answer: 2, explanation: 'String is a reference type (Class) in java.lang, not a primitive.' },
          { question: 'What is the result of (int) 9.99?', type: 'mcq', options: ['10', '9', '9.99', 'Error'], answer: 1, explanation: 'Casting to int truncates the decimal part, leaving 9.' },
        ]
      },
      {
        _id: 'l3', title: 'Control Flow (If, For, While)', order: 3, duration: 12, codeLanguage: 'java',
        codeExample: `public class Main {\n    public static void main(String[] args) {\n        for (int i = 0; i < 5; i++) {\n            System.out.print(i + " ");\n        }\n        System.out.println();\n    }\n}`,
        content: `## Control Flow\n\n### If-Else Statements\nStandard conditional logic:\n\`\`\`java\nif (score >= 90) {\n    System.out.println("A");\n} else {\n    System.out.println("B");\n}\n\`\`\`\n`,
        quiz: [
          { question: 'What are the three parts of a Java for-loop declaration?', type: 'mcq', options: ['condition, initialization, update', 'initialization, update, condition', 'initialization, condition, update', 'start, stop, step'], answer: 2, explanation: 'for(initialization; condition; update)' },
          { question: 'Which loop is guaranteed to execute at least once?', type: 'mcq', options: ['for loop', 'while loop', 'do-while loop', 'None of the above'], answer: 2, explanation: 'do-while evaluates its condition at the end of the iteration block.' },
        ]
      }
    ]
  },
  'dsa': {
    _id: '2', title: 'Data Structures & Algorithms', slug: 'dsa', difficulty: 'Intermediate',
    quizSettings: { timeLimitMinutes: 15, passingPercent: 75, maxRetries: 3 },
    lessons: [
      {
        _id: 'd1', title: 'Arrays and ArrayLists', order: 1, duration: 15, codeLanguage: 'java',
        codeExample: `import java.util.ArrayList;\n\npublic class Main {\n    public static void main(String[] args) {\n        ArrayList<Integer> list = new ArrayList<>();\n        list.add(10);\n        list.add(20);\n        System.out.println("List size: " + list.size());\n    }\n}`,
        content: `## Arrays vs ArrayLists\n\nIn Java, there is a strict distinction between static arrays and dynamic lists.\n`,
        quiz: [
          { question: 'Which data structure can change its size dynamically in Java?', type: 'mcq', options: ['Array', 'ArrayList', 'Both', 'Neither'], answer: 1, explanation: 'ArrayList dynamically reallocates memory as elements are added.' },
        ]
      },
    ]
  },
};

export default function LessonPage() {
  const { slug, lessonId } = useParams() as { slug: string; lessonId: string };
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<{ stdout?: string; stderr?: string; runtime?: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'lesson' | 'editor' | 'materials'>('lesson');
  const [loading, setLoading] = useState(true);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number; percent: number; passed: boolean } | null>(null);
  const [quizTimeRemaining, setQuizTimeRemaining] = useState<number>(300); // 5 mins default
  const [quizTimerActive, setQuizTimerActive] = useState<boolean>(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get(`/learn/${slug}`);
        setCourse(data);
        const foundLesson = data.lessons.find((l: Lesson) => l._id === lessonId) || data.lessons[0];
        setLesson(foundLesson);
        setCode(foundLesson?.codeExample || '');
      } catch {
        const fallback = FALLBACK_COURSES[slug];
        if (fallback) {
          setCourse(fallback);
          const foundLesson = fallback.lessons.find(l => l._id === lessonId) || fallback.lessons[0];
          setLesson(foundLesson || null);
          setCode(foundLesson?.codeExample || '');
        } else {
          toast.error('Course not found');
          router.push('/learn');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, lessonId, router]);

  // Load completed lessons from localStorage
  useEffect(() => {
    setCompletedLessonIds(getCompletedLessons(slug));
  }, [slug, lessonId]);

  // Quiz Timer setup
  useEffect(() => {
    if (lesson?.quiz && lesson.quiz.length > 0) {
      const timeLimitMin = course?.quizSettings?.timeLimitMinutes || 5;
      setQuizTimeRemaining(timeLimitMin * 60);
      setQuizTimerActive(true);
    }
  }, [lesson, course]);

  useEffect(() => {
    if (quizTimerActive && !quizSubmitted && quizTimeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setQuizTimeRemaining(prev => {
          if (prev <= 1) {
            handleQuizSubmit();
            toast.error('Time is up! Submitting quiz automatically.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [quizTimerActive, quizSubmitted, quizTimeRemaining]);

  const syncProgressToBackend = async (completedId: string) => {
    if (!course) return;
    try {
      // Auto-sync with backend enrollment
      await api.post(`/enrollments/${course._id || slug}/progress`, {
        lessonId: completedId,
      });
    } catch {
      // Fallback works silently via local storage
    }
  };

  const handleRun = async () => {
    if (!code.trim() || !lesson) return;
    setIsRunning(true);
    setOutput(null);
    try {
      const { data } = await api.post('/execute', {
        language: lesson.codeLanguage,
        sourceCode: code,
        stdin: ''
      });
      setOutput(data);
    } catch {
      toast.error('Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleQuizSubmit = () => {
    if (!lesson?.quiz || lesson.quiz.length === 0) return;
    const total = lesson.quiz.length;
    const correct = lesson.quiz.filter((q, i) => selectedAnswers[i] === q.answer).length;
    const percent = Math.round((correct / total) * 100);
    const passingThreshold = course?.quizSettings?.passingPercent || 70;
    const passed = percent >= passingThreshold;

    setQuizSubmitted(true);
    setQuizTimerActive(false);
    setQuizScore({ correct, total, percent, passed });

    if (passed) {
      toast.success(`Passed! ${correct}/${total} (${percent}%)`);
      // Sync completion
      markLessonCompleted(slug, lesson._id, course?.lessons.length || 1);
      setCompletedLessonIds(getCompletedLessons(slug));
      syncProgressToBackend(lesson._id);
    } else {
      toast.error(`Score: ${percent}%. Minimum passing is ${passingThreshold}%. Review answers below!`);
    }
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setCurrentQuizIndex(0);
    const timeLimitMin = course?.quizSettings?.timeLimitMinutes || 5;
    setQuizTimeRemaining(timeLimitMin * 60);
    setQuizTimerActive(true);
  };

  const navigateLesson = (dir: 'prev' | 'next') => {
    if (!course || !lesson) return;
    const sorted = [...course.lessons].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(l => l._id === lesson._id);
    const target = dir === 'next' ? sorted[idx + 1] : sorted[idx - 1];

    if (dir === 'next') {
      markLessonCompleted(slug, lesson._id, course.lessons.length);
      setCompletedLessonIds(getCompletedLessons(slug));
      syncProgressToBackend(lesson._id);
    }

    if (target) {
      router.push(`/learn/${slug}/${target._id}`);
      setQuizSubmitted(false);
      setSelectedAnswers({});
      setOutput(null);
      setQuizScore(null);
    }
  };

  const handleCourseComplete = () => {
    if (!course || !lesson) return;
    markLessonCompleted(slug, lesson._id, course.lessons.length);
    setCompletedLessonIds(getCompletedLessons(slug));
    syncProgressToBackend(lesson._id);
    toast.success('Course completed! Congratulations!');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
    </div>
  );
  if (!course || !lesson) return null;

  const sortedLessons = [...course.lessons].sort((a, b) => a.order - b.order);
  const currentIdx = sortedLessons.findIndex(l => l._id === lesson._id);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < sortedLessons.length - 1;

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.courseHeader}>
          <Link href="/learn" className={styles.backLink}><ArrowLeft size={14} /> All Courses</Link>
          <h2 className={styles.courseTitle}>{course.title}</h2>
          <div className={styles.progress}>
            <div className={styles.progressBar} style={{ width: `${((currentIdx + 1) / sortedLessons.length) * 100}%` }} />
          </div>
          <span className={styles.progressText}>{currentIdx + 1} / {sortedLessons.length} lessons</span>
        </div>
        <nav className={styles.lessonList} data-lenis-prevent="true">
          {sortedLessons.map((l, i) => (
            <Link
              key={l._id}
              href={`/learn/${slug}/${l._id}`}
              className={`${styles.lessonItem} ${l._id === lesson._id ? styles.lessonActive : ''} ${completedLessonIds.includes(l._id) ? styles.lessonDone : ''}`}
            >
              <div className={styles.lessonStatusIcon}>
                {completedLessonIds.includes(l._id) ? <CheckCircle2 size={14} /> : i === currentIdx ? <Play size={12} fill="currentColor" /> : <span className={styles.lessonNum}>{i + 1}</span>}
              </div>
              <span className={styles.lessonName}>{l.title}</span>
              <span className={styles.lessonDuration}>{l.duration}m</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.lessonMeta}>
            <h1 className={styles.lessonTitle}>{lesson.title}</h1>
            <span className={styles.duration}><Clock size={12} /> {lesson.duration} min</span>
            {completedLessonIds.includes(lesson._id) && (
              <span className={styles.completedBadge}><CheckCircle2 size={12} /> Completed</span>
            )}
          </div>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${activeTab === 'lesson' ? styles.tabActive : ''}`} onClick={() => setActiveTab('lesson')}>
              <BookOpen size={14} /> Lesson
            </button>
            <button className={`${styles.tab} ${activeTab === 'editor' ? styles.tabActive : ''}`} onClick={() => setActiveTab('editor')}>
              <Code2 size={14} /> Interactive Practice
            </button>
            {lesson.materials && lesson.materials.length > 0 && (
              <button className={`${styles.tab} ${activeTab === 'materials' ? styles.tabActive : ''}`} onClick={() => setActiveTab('materials')}>
                <FileDown size={14} /> Materials ({lesson.materials.length})
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={styles.content} data-lenis-prevent="true">
          {activeTab === 'lesson' && (
            <div className={styles.lessonContent}>
              {/* Optional Video Player */}
              {lesson.videoUrl && (
                <div className={styles.videoPlayerCard}>
                  <div className={styles.videoHeader}>
                    <Video size={16} />
                    <span>Lesson Video Lecture</span>
                  </div>
                  <div className={styles.videoFrameWrapper}>
                    {lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be') ? (
                      <iframe
                        src={lesson.videoUrl}
                        title={lesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className={styles.videoIframe}
                      />
                    ) : (
                      <video src={lesson.videoUrl} controls className={styles.videoTag} />
                    )}
                  </div>
                </div>
              )}

              {/* Markdown Content */}
              <div className={styles.mdContent}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
              </div>

              {/* Inline code example (read-only preview with run shortcut) */}
              {lesson.codeExample && (
                <div className={styles.exampleBlock}>
                  <div className={styles.exampleHeader}>
                    <div className={styles.exampleHeaderLeft}>
                      <Code2 size={14} /> Code Example ({lesson.codeLanguage || 'code'})
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('editor')}>Try it yourself →</button>
                  </div>
                  <pre className={styles.codePreview}>{lesson.codeExample}</pre>
                </div>
              )}

              {/* Interactive Quiz Engine */}
              {lesson.quiz && lesson.quiz.length > 0 && (
                <div className={styles.quiz}>
                  <div className={styles.quizHeaderBar}>
                    <div>
                      <h2 className={styles.quizTitle}><BrainCircuit size={18} /> Interactive Concept Quiz</h2>
                      <p className={styles.quizSub}>Test your understanding. Minimum {course.quizSettings?.passingPercent || 70}% to pass.</p>
                    </div>
                    {quizTimerActive && !quizSubmitted && (
                      <div className={`${styles.timerBadge} ${quizTimeRemaining < 60 ? styles.timerUrgent : ''}`}>
                        <Timer size={14} />
                        <span>{formatTimer(quizTimeRemaining)}</span>
                      </div>
                    )}
                  </div>

                  {/* Score Alert Banner when submitted */}
                  {quizSubmitted && quizScore && (
                    <div className={`${styles.scoreBanner} ${quizScore.passed ? styles.scoreBannerPassed : styles.scoreBannerFailed}`}>
                      <div className={styles.scoreBannerIcon}>
                        {quizScore.passed ? <Award size={28} /> : <AlertCircle size={28} />}
                      </div>
                      <div className={styles.scoreBannerInfo}>
                        <h4>{quizScore.passed ? 'Quiz Passed! Excellent Work!' : 'Keep Practicing! Quiz Not Passed'}</h4>
                        <p>You scored {quizScore.correct} out of {quizScore.total} questions ({quizScore.percent}%). Passing mark is {course.quizSettings?.passingPercent || 70}%.</p>
                      </div>
                    </div>
                  )}

                  {/* Question Navigator */}
                  <div className={styles.quizStepper}>
                    {lesson.quiz.map((_, qIdx) => {
                      const isAnswered = selectedAnswers[qIdx] !== undefined;
                      const isCurrent = currentQuizIndex === qIdx;
                      let stepClass = styles.stepDot;
                      if (isCurrent) stepClass += ` ${styles.stepDotCurrent}`;
                      if (isAnswered) stepClass += ` ${styles.stepDotAnswered}`;
                      return (
                        <button
                          key={qIdx}
                          className={stepClass}
                          onClick={() => setCurrentQuizIndex(qIdx)}
                        >
                          Q{qIdx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Question Card */}
                  {lesson.quiz[currentQuizIndex] && (() => {
                    const q = lesson.quiz[currentQuizIndex];
                    const qi = currentQuizIndex;
                    return (
                      <div className={styles.quizQuestion}>
                        <div className={styles.questionMetaRow}>
                          <span className={styles.questionIndexTag}>Question {qi + 1} of {lesson.quiz!.length}</span>
                          {q.type === 'true_false' && <span className={styles.typeBadge}>True / False</span>}
                        </div>
                        <p className={styles.question}>{q.question}</p>
                        <div className={styles.options}>
                          {q.options.map((opt, oi) => {
                            let optClass = styles.option;
                            if (quizSubmitted) {
                              if (oi === q.answer) optClass = `${styles.option} ${styles.correct}`;
                              else if (selectedAnswers[qi] === oi) optClass = `${styles.option} ${styles.wrong}`;
                            } else if (selectedAnswers[qi] === oi) {
                              optClass = `${styles.option} ${styles.selected}`;
                            }
                            return (
                              <button
                                key={oi}
                                className={optClass}
                                onClick={() => !quizSubmitted && setSelectedAnswers({ ...selectedAnswers, [qi]: oi })}
                              >
                                <span className={styles.optionLetter}>{String.fromCharCode(65 + oi)}</span>
                                <span className={styles.optionText}>{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation on Review */}
                        {quizSubmitted && q.explanation && (
                          <div className={styles.explanationBox}>
                            <strong>Explanation: </strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Quiz Pagination / Action Bar */}
                  <div className={styles.quizNavRow}>
                    <div className={styles.quizPrevNext}>
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={currentQuizIndex === 0}
                        onClick={() => setCurrentQuizIndex(p => Math.max(0, p - 1))}
                      >
                        ← Prev Question
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={currentQuizIndex === (lesson.quiz?.length || 1) - 1}
                        onClick={() => setCurrentQuizIndex(p => Math.min((lesson.quiz?.length || 1) - 1, p + 1))}
                      >
                        Next Question →
                      </button>
                    </div>

                    {!quizSubmitted ? (
                      <button
                        id="quiz-submit-btn"
                        className="btn btn-primary"
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(selectedAnswers).length < (lesson.quiz?.length || 0)}
                      >
                        Submit Quiz ({Object.keys(selectedAnswers).length}/{lesson.quiz.length} Answered)
                      </button>
                    ) : (
                      <button className="btn btn-secondary" onClick={resetQuiz}>
                        <RotateCcw size={14} /> Retake Quiz
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Course Materials preview under lesson */}
              {lesson.materials && lesson.materials.length > 0 && (
                <div className={styles.materialsUnderLesson}>
                  <h3><FileText size={16} /> Course Materials for this Lesson</h3>
                  <div className={styles.materialsList}>
                    {lesson.materials.map((mat, mIdx) => (
                      <a key={mIdx} href={mat.url} target="_blank" rel="noreferrer" className={styles.materialItem}>
                        <div className={styles.materialIcon}><FileDown size={16} /></div>
                        <div className={styles.materialDetails}>
                          <span className={styles.materialTitle}>{mat.title}</span>
                          <span className={styles.materialType}>{mat.fileType.toUpperCase()} File</span>
                        </div>
                        <ExternalLink size={14} className={styles.materialLinkIcon} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Navigation */}
              <div className={styles.navButtons}>
                <button className="btn btn-secondary" disabled={!hasPrev} onClick={() => navigateLesson('prev')}><ArrowLeft size={16} /> Previous Lesson</button>
                {hasNext ? (
                  <button className="btn btn-primary" onClick={() => navigateLesson('next')}>Next Lesson <ArrowRight size={16} /></button>
                ) : (
                  <Link href="/learn" className="btn btn-primary" onClick={handleCourseComplete}><CheckCircle2 size={16} /> Complete Course!</Link>
                )}
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className={styles.editorView}>
              <div className={styles.practiceHeader}>
                <div>
                  <h3 className={styles.practiceTitle}>Hands-On Code Sandbox</h3>
                  <p className={styles.practiceSub}>Write, execute, and experiment with the concepts covered in this lesson.</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setCode(lesson.codeExample || '')}>
                  <RotateCcw size={12} /> Reset to Lesson Example
                </button>
              </div>

              <CodeEditor
                value={code}
                onChange={setCode}
                language={lesson.codeLanguage || 'java'}
                height="420px"
              />

              <div className={styles.runBar}>
                <button id="lesson-run-btn" className="btn btn-primary" onClick={handleRun} disabled={isRunning}>
                  {isRunning ? (
                    <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Running...</>
                  ) : (
                    <><Play size={14} fill="currentColor" /> Run Code</>
                  )}
                </button>
              </div>

              <OutputPanel stdout={output?.stdout} stderr={output?.stderr} runtime={output?.runtime} isRunning={isRunning} />
            </div>
          )}

          {activeTab === 'materials' && (
            <div className={styles.materialsView}>
              <h2 className={styles.materialsHeading}><FileDown size={20} /> Supplementary Files & Resources</h2>
              <p className={styles.materialsSub}>Download cheatsheets, starter templates, and lecture slides provided by the instructor.</p>
              <div className={styles.materialsGrid}>
                {lesson.materials?.map((mat, mIdx) => (
                  <div key={mIdx} className={styles.materialCard}>
                    <div className={styles.materialCardIcon}><FileText size={28} /></div>
                    <div className={styles.materialCardContent}>
                      <h4>{mat.title}</h4>
                      <p>Format: {mat.fileType.toUpperCase()}</p>
                      <a href={mat.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                        <FileDown size={14} /> Download File
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

