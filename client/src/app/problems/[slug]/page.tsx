'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import LanguageSelector from '@/components/Editor/LanguageSelector';
import LeetCodeConsole from '@/components/Editor/LeetCodeConsole';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Group, Panel, Separator } from 'react-resizable-panels';
import {
  Play,
  Send,
  RotateCcw,
  FileText,
  History,
  Lightbulb,
  FileCode2,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Check,
  MessageSquare,
  ThumbsUp,
  Plus,
  BookOpen,
  X,
  ChevronDown,
  ChevronUp,
  Menu,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  UploadCloud,
  Maximize2,
  Flame,
  Code2,
  Braces,
  HelpCircle,
  Bug,
  Search,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatCode } from '@/lib/codeFormatter';
import FileLanguageIcon from '@/components/Editor/FileLanguageIcon';
import styles from './page.module.css';

const CodeEditor = dynamic(() => import('@/components/Editor/CodeEditor'), { ssr: false });

interface Problem {
  _id: string; title: string; slug: string; difficulty: string;
  tags: string[]; description: string; constraints: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  starterTemplates: Record<string, string>;
  hints: string[];
  questionId?: number;
}

const DEFAULT_TEMPLATES: Record<string, string> = {
  python: `class Solution:
    def solve(self, nums: List[int]) -> bool:
        # Write your solution here
        pass
`,
  javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var solve = function(nums) {
    // Write your solution here
};
`,
  typescript: `function solve(nums: number[]): boolean {
    // Write your solution here
    return false;
}
`,
  cpp: `#include <vector>
using namespace std;

class Solution {
public:
    bool solve(vector<int>& nums) {
        // Write your solution here
        return false;
    }
};
`,
  c: `bool solve(int* nums, int numsSize) {
    // Write your solution here
    return false;
}
`,
  java: `class Solution {
    public boolean solve(int[] nums) {
        // Write your solution here
        return false;
    }
}
`,
  go: `func solve(nums []int) bool {
    // Write your solution here
    return false;
}
`,
  csharp: `public class Solution {
    public bool Solve(int[] nums) {
        // Write your solution here
        return false;
    }
}
`,
};


const LANG_FILE_MAP: Record<string, string> = {
  python: 'Solution.py',
  javascript: 'solution.js',
  typescript: 'solution.ts',
  cpp: 'solution.cpp',
  c: 'solution.c',
  java: 'Solution.java',
  go: 'solution.go',
  csharp: 'Solution.cs',
  rust: 'solution.rs',
};

const formatTimeAgo = (dateInput?: string | Date): string => {
  if (!dateInput) return 'recently';
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (isNaN(diffInSeconds) || diffInSeconds < 0) return 'just now';
  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getAvatarGradient = (name?: string) => {
  const gradients = [
    'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    'linear-gradient(135deg, #059669 0%, #047857 100%)',
    'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
  ];
  if (!name) return gradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
};

export default function ProblemSolvePage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const { user, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState('');
  const [activeLeftTab, setActiveLeftTab] = useState<'question' | 'submissions' | 'discuss'>('question');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  
  const [output, setOutput] = useState<{ 
    stdout?: string; 
    stderr?: string; 
    status?: string; 
    runtime?: number; 
    testResults?: any[]; 
    passedCount?: number; 
    totalCount?: number; 
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [customInput, setCustomInput] = useState('');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcase' | 'result'>('testcase');

  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [showHint, setShowHint] = useState(false);


  // Discussion state
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [discussCategory, setDiscussCategory] = useState<string>('all');
  const [discussSort, setDiscussSort] = useState<'newest' | 'top'>('newest');
  const [discussSearch, setDiscussSearch] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCat, setNewThreadCat] = useState<'question' | 'approach' | 'edge-case' | 'bug'>('question');
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Problem list for Prev / Next / Random navigation
  const [problemList, setProblemList] = useState<Array<{ slug: string; title: string; questionId?: number }>>([]);

  useEffect(() => {
    api.get('/problems?limit=100').then(({ data }) => {
      if (Array.isArray(data?.problems)) {
        const sorted = [...data.problems].sort((a: any, b: any) => {
          const numA = a.questionId || parseInt(a.title?.split('.')[0], 10) || 0;
          const numB = b.questionId || parseInt(b.title?.split('.')[0], 10) || 0;
          return numA - numB;
        });
        setProblemList(sorted);
      }
    }).catch(() => {});
  }, []);

  const currentProblemIndex = problemList.findIndex((p) => p.slug === slug);
  const prevProblem = currentProblemIndex > 0
    ? problemList[currentProblemIndex - 1]
    : (problemList.length > 1 ? problemList[problemList.length - 1] : null);

  const nextProblem = currentProblemIndex !== -1 && currentProblemIndex < problemList.length - 1
    ? problemList[currentProblemIndex + 1]
    : (problemList.length > 1 ? problemList[0] : null);

  const handlePrevProblem = () => {
    if (prevProblem) {
      router.push(`/problems/${prevProblem.slug}`);
    } else if (problemList.length > 0) {
      router.push(`/problems/${problemList[0].slug}`);
    }
  };

  const handleNextProblem = () => {
    if (nextProblem) {
      router.push(`/problems/${nextProblem.slug}`);
    } else if (problemList.length > 0) {
      router.push(`/problems/${problemList[0].slug}`);
    }
  };

  const handleRandomProblem = () => {
    if (problemList.length === 0) return;
    const others = problemList.filter((p) => p.slug !== slug);
    const pool = others.length > 0 ? others : problemList;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    if (picked) {
      router.push(`/problems/${picked.slug}`);
    }
  };

  // Fetch problem on mount or slug change
  useEffect(() => {
    setLoading(true);
    setOutput(null);
    setShowHint(false);
    api.get(`/problems/${slug}`).then(({ data }) => {
      setProblem(data);
      const tmpl = data.starterTemplates?.[language] || DEFAULT_TEMPLATES[language] || '';
      setCode(tmpl);
      setLoading(false);
    }).catch(() => { toast.error('Problem not found'); router.push('/problems'); });
  }, [slug, router]);

  useEffect(() => {
    if (activeLeftTab === 'submissions' && problem && user) {
      setLoadingSubmissions(true);
      api.get(`/submissions?problemId=${problem._id}`)
        .then(({ data }) => { setSubmissionsList(data); })
        .catch(() => { toast.error('Failed to load past submissions'); })
        .finally(() => { setLoadingSubmissions(false); });
    }
  }, [activeLeftTab, problem, user]);

  const fetchDiscussions = useCallback(async () => {
    if (!problem) return;
    setLoadingDiscussions(true);
    try {
      const params = new URLSearchParams();
      if (discussCategory !== 'all') params.append('category', discussCategory);
      if (discussSort === 'top') params.append('sort', 'top');
      const queryStr = params.toString();
      const url = `/discussions/problem/${problem.slug}${queryStr ? `?${queryStr}` : ''}`;
      const { data } = await api.get(url);
      setDiscussions(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoadingDiscussions(false);
    }
  }, [problem, discussCategory, discussSort]);

  useEffect(() => {
    if (activeLeftTab === 'discuss' && problem) {
      fetchDiscussions();
    }
  }, [activeLeftTab, problem, fetchDiscussions]);


  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Sign in to join discussion'); router.push('/auth/login'); return; }
    if (!newThreadTitle.trim() || !newThreadContent.trim()) {
      toast.error('Please enter both title and content');
      return;
    }
    try {
      await api.post('/discussions', {
        problemIdOrSlug: problem?.slug,
        title: newThreadTitle,
        content: newThreadContent,
        category: newThreadCat,
      });
      toast.success('Discussion thread posted!');
      setShowNewThread(false);
      setNewThreadTitle('');
      setNewThreadContent('');
      fetchDiscussions();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to post thread');
    }
  };

  const handleToggleUpvote = async (threadId: string) => {
    if (!user) { toast.error('Sign in to vote'); return; }
    try {
      const { data } = await api.post(`/discussions/${threadId}/upvote`);
      setDiscussions((prev) =>
        prev.map((t) => {
          if (t._id === threadId) {
            const hasUpvoted = data.hasUpvoted;
            const updatedUpvotes = hasUpvoted
              ? [...(t.upvotes || []), user.id]
              : (t.upvotes || []).filter((u: any) => u !== user.id);
            return { ...t, upvotes: updatedUpvotes };
          }
          return t;
        })
      );
    } catch {}
  };

  const handleAddReply = async (threadId: string) => {
    if (!user) { toast.error('Sign in to reply'); return; }
    if (!replyText.trim()) return;
    try {
      const { data } = await api.post(`/discussions/${threadId}/reply`, { content: replyText });
      setDiscussions((prev) => prev.map((t) => (t._id === threadId ? data : t)));
      setReplyText('');
      toast.success('Reply posted!');
    } catch {
      toast.error('Failed to post reply');
    }
  };

  const handleAcceptReply = async (threadId: string, replyId: string) => {
    try {
      const { data } = await api.post(`/discussions/${threadId}/reply/${replyId}/accept`);
      setDiscussions((prev) => prev.map((t) => (t._id === threadId ? data : t)));
      toast.success('Accepted explanation updated!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Action failed');
    }
  };

  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang);
    setCode(problem?.starterTemplates?.[lang] || DEFAULT_TEMPLATES[lang] || '');
    setOutput(null);
  }, [problem]);

  const handleFormatCode = () => {
    if (!code || !code.trim()) {
      toast.error('No code to format');
      return;
    }
    try {
      const formatted = formatCode(code, language);
      setCode(formatted);
      toast.success('Code formatted');
    } catch {
      toast.error('Unable to format code');
    }
  };

  const handleRun = async (overrideStdin?: string) => {
    if (!code.trim()) { toast.error('Write some code first!'); return; }
    setIsRunning(true); setOutput(null); setIsConsoleOpen(true); setActiveConsoleTab('result');
    try {
      const defaultTestInput = (problem as any)?.exampleTestCases?.[0]?.input || (problem as any)?.testCases?.[0]?.input || problem?.examples?.[0]?.input || '';
      const effectiveStdin = typeof overrideStdin === 'string' ? overrideStdin : (customInput.trim() ? customInput : defaultTestInput);
      if (typeof overrideStdin === 'string') setCustomInput(overrideStdin);
      const { data } = await api.post('/execute', { language, sourceCode: code, stdin: effectiveStdin, problemId: problem?._id });
      setOutput(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Execution failed');
    } finally { setIsRunning(false); }
  };

  const handleSubmit = async () => {
    if (!user) { toast.error('Sign in to submit!'); router.push('/auth/login'); return; }
    if (!code.trim() || !problem) return;
    setIsSubmitting(true); setOutput(null); setIsConsoleOpen(true); setActiveConsoleTab('result');
    try {
      const { data } = await api.post('/submissions', { problemId: problem._id, language, sourceCode: code });
      setOutput(data);
      if (data.status === 'Accepted') {
        toast.success('Accepted! All test cases passed.');
        if (data.newBadges && Array.isArray(data.newBadges) && data.newBadges.length > 0) {
          data.newBadges.forEach((b: any) => {
            toast.success(`Badge Unlocked: ${b.name}!`, { duration: 6000 });
          });
        }
        if (problem && !(user as any).solvedProblems?.some((p: any) => p._id === problem._id)) {
          if ((user as any).solvedProblems) {
            (user as any).solvedProblems.push({ _id: problem._id, title: problem.title });
          }
        }
      } else {
        toast.error(data.status ? `${data.status}` : 'Submission rejected');
      }
      if (activeLeftTab === 'submissions') {
        api.get(`/submissions?problemId=${problem._id}`).then(({ data: subs }) => setSubmissionsList(subs));
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || 'Submission failed');
    } finally { setIsSubmitting(false); }
  };

  const toggleHint = () => {
    if (!problem?.hints || problem.hints.length === 0) {
      toast('No hints available for this problem yet.');
      return;
    }
    setShowHint(!showHint);
  };

  if (loading) return (
    <div className={styles.loadingPage}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
    </div>
  );
  if (!problem) return null;

  const isSolved = (user as any)?.solvedProblems?.some((p: any) => p._id === problem._id || p === problem._id) || false;

  return (
    <div className={styles.page}>
      {/* LeetCode Problem Solver Top Navbar */}
      <header className={styles.lcTopBar}>
        {/* Left: CodeCampus Logo, Problem List link, < > random navigation */}
        <div className={styles.lcTopLeft}>
          <Link href="/problems" className={styles.lcBrandLogo} title="CodeCampus Problems">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 8l-4 4 4 4M17 8l4 4-4 4M14 4.5l-4 15" stroke="url(#lcLogo)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="lcLogo" x1="3" y1="4.5" x2="21" y2="19.5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#39d353"/><stop offset="1" stopColor="#58a6ff"/>
                </linearGradient>
              </defs>
            </svg>
          </Link>

          <Link href="/problems" className={styles.lcProblemListBtn}>
            <Menu size={14} />
            <span>Problem List</span>
          </Link>

          <div className={styles.lcNavArrows}>
            <button 
              type="button" 
              className={styles.lcNavArrowBtn} 
              onClick={handlePrevProblem} 
              title={prevProblem ? `Previous: ${prevProblem.title}` : "Previous Problem"}
              disabled={problemList.length <= 1}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              type="button" 
              className={styles.lcNavArrowBtn} 
              onClick={handleNextProblem} 
              title={nextProblem ? `Next: ${nextProblem.title}` : "Next Problem"}
              disabled={problemList.length <= 1}
            >
              <ChevronRight size={16} />
            </button>
            <button 
              type="button" 
              className={styles.lcNavArrowBtn} 
              onClick={handleRandomProblem} 
              title="Pick Random Problem"
              disabled={problemList.length <= 1}
            >
              <Shuffle size={13} />
            </button>
          </div>
        </div>

        {/* Center: Run & Submit Buttons (Centered to the screen) */}
        <div className={styles.lcTopCenter}>
          <button 
            type="button" 
            className={styles.lcTopRunBtn} 
            onClick={() => handleRun()}
            disabled={isRunning || isSubmitting}
            title="Run code against testcase"
          >
            <Play size={12} fill="currentColor" />
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>

          <button 
            type="button" 
            className={styles.lcTopSubmitBtn} 
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            title="Submit solution"
          >
            <UploadCloud size={14} />
            <span>{isSubmitting ? 'Pending...' : 'Submit'}</span>
          </button>
        </div>

        {/* Right: Streak & Profile */}
        <div className={styles.lcTopRight}>
          {user?.stats?.streak !== undefined && (
            <div className={styles.lcTopStreakPill} title={`${user.stats.streak} day streak`}>
              <Flame size={14} color="#f97316" />
              <span>{user.stats.streak}</span>
            </div>
          )}

          {user ? (
            <Link 
              href={user.username ? `/profile/${encodeURIComponent(user.username)}` : '/profile'} 
              className={styles.lcUserAvatar} 
              title={user.username ? `Profile (${user.username})` : 'My Profile'}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} />
              ) : (
                <span>{user.username ? user.username[0]?.toUpperCase() : 'U'}</span>
              )}
            </Link>
          ) : (
            <Link href="/auth/login" className={styles.lcSignInBtn}>
              Sign In
            </Link>
          )}
        </div>
      </header>

      <Group orientation="horizontal" className={styles.splitLayout}>
        {/* LEFT PANEL */}
        <Panel defaultSize={50} minSize={20} className={styles.leftPanel}>
          <div className={styles.leftTabs}>
            <button 
              className={`${styles.leftTab} ${activeLeftTab === 'question' ? styles.activeTab : ''}`}
              onClick={() => setActiveLeftTab('question')}
            >
              <FileText size={14} /> Description
            </button>
            <button 
              className={`${styles.leftTab} ${activeLeftTab === 'submissions' ? styles.activeTab : ''}`}
              onClick={() => setActiveLeftTab('submissions')}
            >
              <History size={14} /> Submissions
            </button>
            <button 
              className={`${styles.leftTab} ${activeLeftTab === 'discuss' ? styles.activeTab : ''}`}
              onClick={() => setActiveLeftTab('discuss')}
            >
              <MessageSquare size={14} /> Discuss {discussions.length > 0 && `(${discussions.length})`}
            </button>
          </div>

          <div className={styles.leftContent} data-lenis-prevent="true">
            {activeLeftTab === 'question' && (
              <>
                <div className={styles.problemHeader}>
                  <h1 className={styles.title}>
                    {problem.questionId
                      ? (/^\d+\./.test(problem.title) ? problem.title : `${problem.questionId}. ${problem.title}`)
                      : problem.title}
                  </h1>
                  {isSolved && <CheckCircle2 size={20} color="var(--accent-green)" />}
                </div>
                
                <div className={styles.badges}>
                  <span className={`${styles.badge} ${
                    problem.difficulty === 'Easy'
                      ? styles.badgeEasy
                      : problem.difficulty === 'Medium'
                      ? styles.badgeMedium
                      : styles.badgeHard
                  }`}>
                    {problem.difficulty}
                  </span>
                  {problem.tags.map(tag => (
                    <span key={tag} className={styles.badgeTopic}>{tag}</span>
                  ))}
                </div>

                {showHint && problem.hints && problem.hints.length > 0 && (
                  <div style={{ background: '#1c1c2e', border: '1px solid #7c3aed', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, color: '#a78bfa', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Lightbulb size={15} /> Hints
                      </span>
                      <button onClick={() => setShowHint(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <X size={15} />
                      </button>
                    </div>
                    {problem.hints.map((h, i) => (
                      <p key={i} style={{ fontSize: '0.9rem', color: '#e6edf3', margin: '6px 0' }}>• {h}</p>
                    ))}
                  </div>
                )}

                <div className={styles.markdownBody}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {problem.description
                      ? (() => {
                          const text = problem.description.replace(/\\n/g, '\n').replace(/\\r/g, '');
                          const escapedTitle = problem.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                          return text.replace(new RegExp(`^#+\\s*${escapedTitle}\\s*\\n*`, 'i'), '').trim();
                        })()
                      : ''}
                  </ReactMarkdown>
                </div>
              </>
            )}

            {activeLeftTab === 'submissions' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: '#fff' }}>My Submissions</h3>
                {!user ? (
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>Please <Link href="/auth/login" style={{ color: '#58a6ff' }}>sign in</Link> to view your submission history.</p>
                ) : loadingSubmissions ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                    <div className="spinner" style={{ width: 28, height: 28 }} />
                  </div>
                ) : submissionsList.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>No submissions yet for this problem. Write your code and click Submit!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {submissionsList.map((sub) => (
                      <div
                        key={sub._id}
                        style={{
                          background: '#161b22',
                          border: '1px solid #30363d',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              color: sub.status === 'Accepted' ? '#39d353' : sub.status === 'Wrong Answer' ? '#f85149' : '#d29922',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}>
                              {sub.status === 'Accepted' ? <Check size={14} /> : <AlertCircle size={14} />} {sub.status}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>• {sub.language}</span>
                            {sub.runtime !== undefined && (
                              <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>• {sub.runtime}ms</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6e7681' }}>
                            {new Date(sub.submittedAt || sub.createdAt).toLocaleString()}
                          </div>
                        </div>
                        {sub.sourceCode && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => {
                              setCode(sub.sourceCode);
                              if (sub.language) setLanguage(sub.language);
                              toast.success('Code restored to editor');
                            }}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* DISCUSSION FORUM TAB */}
            {activeLeftTab === 'discuss' && (() => {
              const filteredDiscussions = discussions.filter((t) => {
                if (!discussSearch.trim()) return true;
                const q = discussSearch.toLowerCase();
                const titleMatch = t.title?.toLowerCase().includes(q);
                const contentMatch = t.content?.toLowerCase().includes(q);
                const authorUsername = typeof t.authorId === 'object' && t.authorId !== null ? t.authorId.username : '';
                const authorMatch = authorUsername?.toLowerCase().includes(q);
                return titleMatch || contentMatch || authorMatch;
              });

              return (
                <div className={styles.discussWrapper}>
                  {/* Header Row */}
                  <div className={styles.discussHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <MessageSquare size={16} color="#38bdf8" />
                      </div>
                      <h3 className={styles.discussHeading}>
                        Community Discussion
                      </h3>
                      <span className={styles.discussCountBadge}>
                        {discussions.length} {discussions.length === 1 ? 'post' : 'posts'}
                      </span>
                    </div>

                    <button
                      className={`${styles.discussNewBtn} ${showNewThread ? styles.discussNewBtnCancel : styles.discussNewBtnPrimary}`}
                      onClick={() => setShowNewThread(!showNewThread)}
                    >
                      {showNewThread ? <X size={14} /> : <Plus size={14} />}
                      {showNewThread ? 'Cancel' : 'New Post'}
                    </button>
                  </div>

                  {/* Search & Sort Bar */}
                  <div className={styles.discussFilterBar}>
                    <div className={styles.discussSearchBox}>
                      <Search size={14} className={styles.discussSearchIcon} />
                      <input
                        type="text"
                        className={styles.discussSearchInput}
                        placeholder="Search questions, approaches, bugs..."
                        value={discussSearch}
                        onChange={(e) => setDiscussSearch(e.target.value)}
                      />
                    </div>

                    <div className={styles.discussSortBar}>
                      <button
                        className={`${styles.discussSortBtn} ${discussSort === 'newest' ? styles.discussSortBtnActive : ''}`}
                        onClick={() => setDiscussSort('newest')}
                        title="Sort by latest posted"
                      >
                        <Clock size={12} /> Newest
                      </button>
                      <button
                        className={`${styles.discussSortBtn} ${discussSort === 'top' ? styles.discussSortBtnActive : ''}`}
                        onClick={() => setDiscussSort('top')}
                        title="Sort by most upvoted"
                      >
                        <Flame size={12} /> Top
                      </button>
                    </div>
                  </div>

                  {/* Category filters */}
                  <div className={styles.discussPillsRow}>
                    {[
                      { id: 'all', label: 'All', icon: MessageSquare, color: '#38bdf8', activeBg: 'rgba(56, 189, 248, 0.15)', activeBorder: '#38bdf8' },
                      { id: 'question', label: 'Question', icon: HelpCircle, color: '#38bdf8', activeBg: 'rgba(56, 189, 248, 0.15)', activeBorder: '#38bdf8' },
                      { id: 'approach', label: 'Approach', icon: Lightbulb, color: '#34d399', activeBg: 'rgba(52, 211, 153, 0.15)', activeBorder: '#34d399' },
                      { id: 'edge-case', label: 'Edge-Case', icon: AlertCircle, color: '#fbbf24', activeBg: 'rgba(251, 191, 36, 0.15)', activeBorder: '#fbbf24' },
                      { id: 'bug', label: 'Bug', icon: Bug, color: '#f43f5e', activeBg: 'rgba(244, 63, 94, 0.15)', activeBorder: '#f43f5e' },
                    ].map((cat) => {
                      const IconComponent = cat.icon;
                      const isActive = discussCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          className={styles.discussCategoryPill}
                          style={{
                            background: isActive ? cat.activeBg : '#161b22',
                            borderColor: isActive ? cat.activeBorder : '#30363d',
                            color: isActive ? cat.color : '#8b949e',
                          }}
                          onClick={() => setDiscussCategory(cat.id)}
                        >
                          <IconComponent size={12} color={isActive ? cat.color : '#8b949e'} />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* New Thread Form */}
                  {showNewThread && (
                    <form onSubmit={handleCreateDiscussion} className={styles.discussNewFormCard}>
                      <div className={styles.discussFormTitle}>
                        <Sparkles size={15} color="#38bdf8" /> Start a Discussion
                      </div>
                      <div className={styles.discussFormSubtitle}>
                        Ask for clarification, share your solution approach, or discuss tricky edge cases.
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <input
                          type="text"
                          placeholder="Title (e.g. O(N) Hash Map approach with memory analysis)"
                          value={newThreadTitle}
                          onChange={(e) => setNewThreadTitle(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            background: '#0d1117',
                            border: '1px solid #30363d',
                            borderRadius: 6,
                            color: '#fff',
                            fontSize: '0.82rem',
                            outline: 'none',
                          }}
                          required
                        />
                      </div>

                      {/* Category Selector Pills in form */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#8b949e', marginBottom: 6, fontWeight: 600 }}>
                          Select Category
                        </label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {[
                            { id: 'question', label: 'Question', icon: HelpCircle, color: '#38bdf8' },
                            { id: 'approach', label: 'Approach', icon: Lightbulb, color: '#34d399' },
                            { id: 'edge-case', label: 'Edge Case', icon: AlertCircle, color: '#fbbf24' },
                            { id: 'bug', label: 'Bug Report', icon: Bug, color: '#f43f5e' },
                          ].map((c) => {
                            const IconComp = c.icon;
                            const isSel = newThreadCat === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setNewThreadCat(c.id as any)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '5px 11px',
                                  fontSize: '0.73rem',
                                  fontWeight: 600,
                                  borderRadius: 6,
                                  border: `1px solid ${isSel ? c.color : '#30363d'}`,
                                  background: isSel ? 'rgba(56, 189, 248, 0.12)' : '#0d1117',
                                  color: isSel ? c.color : '#8b949e',
                                  cursor: 'pointer',
                                }}
                              >
                                <IconComp size={12} color={isSel ? c.color : '#8b949e'} />
                                {c.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <textarea
                          placeholder="Explain your approach, question, or findings... (Markdown supported)"
                          rows={4}
                          value={newThreadContent}
                          onChange={(e) => setNewThreadContent(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            background: '#0d1117',
                            border: '1px solid #30363d',
                            borderRadius: 6,
                            color: '#fff',
                            fontSize: '0.82rem',
                            lineHeight: 1.5,
                            outline: 'none',
                            resize: 'vertical',
                          }}
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setShowNewThread(false)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            background: 'transparent',
                            border: '1px solid #30363d',
                            color: '#8b949e',
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={`${styles.discussNewBtn} ${styles.discussNewBtnPrimary}`}
                          style={{ fontSize: '0.76rem', padding: '6px 14px' }}
                        >
                          <Send size={13} /> Publish Discussion
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Discussion Thread List */}
                  {loadingDiscussions ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 36 }}>
                      <div className="spinner" style={{ width: 28, height: 28 }} />
                    </div>
                  ) : filteredDiscussions.length === 0 ? (
                    <div style={{
                      padding: '36px 20px',
                      textAlign: 'center',
                      background: '#161b22',
                      borderRadius: 10,
                      border: '1px dashed #30363d',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <MessageSquare size={20} color="#38bdf8" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f0f6fc', marginBottom: 4 }}>
                          {discussSearch ? 'No matching discussions found' : 'No discussions yet'}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#8b949e', maxWidth: 320 }}>
                          {discussSearch
                            ? `No posts matched "${discussSearch}". Try clearing your search or picking another category.`
                            : 'Be the first to ask a question, share an optimal solution, or report tricky edge cases!'}
                        </div>
                      </div>
                      {!discussSearch && (
                        <button
                          className={`${styles.discussNewBtn} ${styles.discussNewBtnPrimary}`}
                          style={{ marginTop: 6 }}
                          onClick={() => setShowNewThread(true)}
                        >
                          <Plus size={14} /> Start Discussion
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {filteredDiscussions.map((t) => {
                        const isExpanded = expandedThreadId === t._id;
                        const hasUpvoted = user && t.upvotes?.includes(user.id);
                        const author = typeof t.authorId === 'object' && t.authorId !== null ? t.authorId : null;
                        const authorUsername = author?.username || 'User';
                        const authorAvatar = author?.avatar;
                        const authorRole = author?.role;

                        // Category styles & icon
                        const catStyle = t.category === 'approach'
                          ? { bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.25)', text: '#34d399', icon: Lightbulb }
                          : t.category === 'edge-case'
                          ? { bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.25)', text: '#fbbf24', icon: AlertCircle }
                          : t.category === 'bug'
                          ? { bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.25)', text: '#f43f5e', icon: Bug }
                          : { bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)', text: '#38bdf8', icon: HelpCircle };
                        const CatIcon = catStyle.icon;

                        return (
                          <div key={t._id} className={styles.discussCard}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                              {/* Upvote capsule */}
                              <button
                                className={styles.discussUpvoteCapsule}
                                style={{
                                  background: hasUpvoted ? 'rgba(56, 189, 248, 0.15)' : '#0d1117',
                                  border: `1px solid ${hasUpvoted ? '#38bdf8' : '#30363d'}`,
                                  color: hasUpvoted ? '#38bdf8' : '#8b949e',
                                }}
                                onClick={() => handleToggleUpvote(t._id)}
                                title={hasUpvoted ? 'Remove upvote' : 'Upvote discussion'}
                              >
                                <ThumbsUp size={13} />
                                <span style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                                  {t.upvotes?.length || 0}
                                </span>
                              </button>

                              {/* Thread Body */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Meta row: Author info + Time on left, Category pill + Solved on right */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    {/* Author avatar & link */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      {authorAvatar ? (
                                        <img
                                          src={authorAvatar}
                                          alt={authorUsername}
                                          style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                      ) : (
                                        <div
                                          style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            background: getAvatarGradient(authorUsername),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.62rem',
                                            fontWeight: 700,
                                            color: '#fff',
                                            flexShrink: 0,
                                          }}
                                        >
                                          {authorUsername.charAt(0).toUpperCase()}
                                        </div>
                                      )}

                                      <Link
                                        href={`/profile/${encodeURIComponent(authorUsername)}`}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                          color: '#58a6ff',
                                          fontSize: '0.76rem',
                                          fontWeight: 600,
                                          textDecoration: 'none',
                                        }}
                                        title={`View ${authorUsername}'s profile`}
                                      >
                                        {authorUsername}
                                      </Link>

                                      {authorRole === 'instructor' && (
                                        <span style={{
                                          fontSize: '0.62rem',
                                          fontWeight: 600,
                                          padding: '1px 5px',
                                          borderRadius: 4,
                                          background: 'rgba(168, 85, 247, 0.15)',
                                          border: '1px solid rgba(168, 85, 247, 0.3)',
                                          color: '#c084fc',
                                        }}>
                                          Instructor
                                        </span>
                                      )}
                                      {authorRole === 'admin' && (
                                        <span style={{
                                          fontSize: '0.62rem',
                                          fontWeight: 600,
                                          padding: '1px 5px',
                                          borderRadius: 4,
                                          background: 'rgba(251, 191, 36, 0.15)',
                                          border: '1px solid rgba(251, 191, 36, 0.3)',
                                          color: '#fbbf24',
                                        }}>
                                          Admin
                                        </span>
                                      )}
                                    </div>

                                    <span style={{ fontSize: '0.7rem', color: '#6e7681', display: 'flex', alignItems: 'center', gap: 3 }}>
                                      <Clock size={11} /> {formatTimeAgo(t.createdAt)}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span
                                      style={{
                                        fontSize: '0.66rem',
                                        padding: '2px 7px',
                                        borderRadius: 4,
                                        background: catStyle.bg,
                                        border: `1px solid ${catStyle.border}`,
                                        color: catStyle.text,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.04em',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                      }}
                                    >
                                      <CatIcon size={11} />
                                      {t.category}
                                    </span>

                                    {t.isSolved && (
                                      <span style={{
                                        fontSize: '0.66rem',
                                        color: '#34d399',
                                        background: 'rgba(52, 211, 153, 0.1)',
                                        border: '1px solid rgba(52, 211, 153, 0.25)',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                      }}>
                                        <CheckCircle2 size={11} /> Solved
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Title */}
                                <div
                                  className={styles.discussThreadTitle}
                                  onClick={() => setExpandedThreadId(isExpanded ? null : t._id)}
                                >
                                  {t.title}
                                </div>

                                {/* Snippet */}
                                <div className={styles.discussThreadSnippet}>
                                  {t.content}
                                </div>

                                {/* Footer Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                  <button
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      fontSize: '0.74rem',
                                      fontWeight: 600,
                                      color: isExpanded ? '#38bdf8' : '#58a6ff',
                                      background: isExpanded ? 'rgba(56, 189, 248, 0.1)' : 'rgba(88, 166, 255, 0.08)',
                                      border: `1px solid ${isExpanded ? 'rgba(56, 189, 248, 0.25)' : 'rgba(88, 166, 255, 0.18)'}`,
                                      borderRadius: 6,
                                      padding: '4px 9px',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                    }}
                                    onClick={() => setExpandedThreadId(isExpanded ? null : t._id)}
                                  >
                                    <MessageSquare size={12} />
                                    <span>{t.replies?.length || 0} {t.replies?.length === 1 ? 'reply' : 'replies'}</span>
                                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  </button>

                                  <button
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#8b949e',
                                      fontSize: '0.72rem',
                                      cursor: 'pointer',
                                      padding: '4px 6px',
                                    }}
                                    onClick={() => setExpandedThreadId(t._id)}
                                  >
                                    Reply
                                  </button>
                                </div>

                                {/* Expanded replies section */}
                                {isExpanded && (
                                  <div className={styles.discussRepliesContainer}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                                      {(!t.replies || t.replies.length === 0) ? (
                                        <div style={{
                                          padding: '10px 12px',
                                          background: '#0d1117',
                                          borderRadius: 6,
                                          border: '1px dashed #21262d',
                                          color: '#6e7681',
                                          fontSize: '0.74rem',
                                          textAlign: 'center',
                                        }}>
                                          No replies yet. Share your thoughts or answer below!
                                        </div>
                                      ) : (
                                        t.replies.map((rep: any) => {
                                          const repAuthor = typeof rep.authorId === 'object' && rep.authorId !== null ? rep.authorId : null;
                                          const repUsername = repAuthor?.username || 'User';
                                          const repAvatar = repAuthor?.avatar;
                                          const repRole = repAuthor?.role;

                                          return (
                                            <div
                                              key={rep._id}
                                              className={`${styles.discussReplyCard} ${rep.isAccepted ? styles.discussReplyCardAccepted : ''}`}
                                            >
                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                  {repAvatar ? (
                                                    <img
                                                      src={repAvatar}
                                                      alt={repUsername}
                                                      style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                  ) : (
                                                    <div
                                                      style={{
                                                        width: 18,
                                                        height: 18,
                                                        borderRadius: '50%',
                                                        background: getAvatarGradient(repUsername),
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.6rem',
                                                        fontWeight: 700,
                                                        color: '#fff',
                                                        flexShrink: 0,
                                                      }}
                                                    >
                                                      {repUsername.charAt(0).toUpperCase()}
                                                    </div>
                                                  )}

                                                  <Link
                                                    href={`/profile/${encodeURIComponent(repUsername)}`}
                                                    style={{ color: '#58a6ff', fontSize: '0.74rem', fontWeight: 600, textDecoration: 'none' }}
                                                    title={`View ${repUsername}'s profile`}
                                                  >
                                                    {repUsername}
                                                  </Link>

                                                  {repRole === 'instructor' && (
                                                    <span style={{
                                                      fontSize: '0.6rem',
                                                      padding: '1px 4px',
                                                      borderRadius: 4,
                                                      background: 'rgba(168, 85, 247, 0.15)',
                                                      border: '1px solid rgba(168, 85, 247, 0.3)',
                                                      color: '#c084fc',
                                                      fontWeight: 600,
                                                    }}>
                                                      Instructor
                                                    </span>
                                                  )}

                                                  <span style={{ fontSize: '0.68rem', color: '#6e7681', display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Clock size={10} /> {formatTimeAgo(rep.createdAt)}
                                                  </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                  {rep.isAccepted && (
                                                    <span style={{
                                                      fontSize: '0.68rem',
                                                      color: '#34d399',
                                                      fontWeight: 700,
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      gap: 3,
                                                      background: 'rgba(52, 211, 153, 0.12)',
                                                      padding: '2px 6px',
                                                      borderRadius: 4,
                                                      border: '1px solid rgba(52, 211, 153, 0.3)',
                                                    }}>
                                                      <CheckCircle2 size={11} /> Accepted Solution
                                                    </span>
                                                  )}

                                                  {(user?.id === t.authorId?._id || user?.role === 'instructor' || user?.role === 'admin') && (
                                                    <button
                                                      style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: rep.isAccepted ? '#34d399' : '#6e7681',
                                                        fontSize: '0.68rem',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 3,
                                                        padding: '2px 4px',
                                                      }}
                                                      onClick={() => handleAcceptReply(t._id, rep._id)}
                                                      title="Toggle accepted answer"
                                                    >
                                                      <CheckCircle2 size={11} /> {rep.isAccepted ? 'Accepted' : 'Accept Solution'}
                                                    </button>
                                                  )}
                                                </div>
                                              </div>

                                              <div style={{ fontSize: '0.8rem', color: '#c9d1d9', lineHeight: 1.45, wordBreak: 'break-word' }}>
                                                {rep.content}
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>

                                    {/* Reply input */}
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                                      <div
                                        style={{
                                          width: 24,
                                          height: 24,
                                          borderRadius: '50%',
                                          background: getAvatarGradient(user?.username),
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '0.65rem',
                                          fontWeight: 700,
                                          color: '#fff',
                                          flexShrink: 0,
                                        }}
                                      >
                                        {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                      </div>

                                      <input
                                        type="text"
                                        placeholder="Write a helpful answer or observation... (Enter to reply)"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        style={{
                                          flex: 1,
                                          padding: '7px 11px',
                                          background: '#0d1117',
                                          border: '1px solid #30363d',
                                          borderRadius: 6,
                                          color: '#fff',
                                          fontSize: '0.78rem',
                                          outline: 'none',
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleAddReply(t._id);
                                        }}
                                      />

                                      <button
                                        className={`${styles.discussNewBtn} ${styles.discussNewBtnPrimary}`}
                                        style={{ fontSize: '0.74rem', padding: '6px 12px' }}
                                        onClick={() => handleAddReply(t._id)}
                                      >
                                        <Send size={12} /> Reply
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </Panel>

        <Separator className={styles.resizeHandle} />

        {/* RIGHT PANEL - Modern VS Code Editor & Integrated Terminal */}
        <Panel defaultSize={50} minSize={20} className={styles.rightPanel}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
            {/* VS Code Tabs Bar */}
            <div className={styles.tabsBar}>
              <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingLeft: 8 }}>
                <LanguageSelector value={language} onChange={handleLanguageChange} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8 }}>
                <button 
                  className={styles.headerIconBtn} 
                  title="Format Code"
                  onClick={handleFormatCode}
                >
                  <Braces size={13} />
                </button>

                <button 
                  className={styles.headerIconBtn} 
                  title="Reset to default starter code"
                  onClick={() => {
                    setCode(problem?.starterTemplates?.[language] || DEFAULT_TEMPLATES[language] || '');
                    toast.success('Code reset to default');
                  }}
                >
                  <RotateCcw size={13} />
                </button>

                <button 
                  className={styles.headerIconBtn} 
                  title="Toggle Fullscreen"
                  onClick={() => {
                    if (typeof document !== 'undefined') {
                      if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch(() => {});
                      } else {
                        document.exitFullscreen().catch(() => {});
                      }
                    }
                  }}
                >
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>

            {/* Breadcrumbs Bar */}
            <div className={styles.breadcrumbsBar}>
              <span className={styles.breadcrumbItem}>problems</span>
              <span>›</span>
              <span className={styles.breadcrumbItem}>
                {problem.questionId ? `${problem.questionId}. ${problem.slug}` : problem.slug}
              </span>
              <span>›</span>
              <span className={`${styles.breadcrumbItem} ${styles.breadcrumbActive}`}>
                <FileLanguageIcon language={language} filename={LANG_FILE_MAP[language]} size={12} />
                {LANG_FILE_MAP[language] || 'Solution'}
              </span>
            </div>

            {/* Split Editor and Terminal */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              {isConsoleOpen ? (
                <Group orientation="vertical" style={{ height: '100%', width: '100%' }}>
                  <Panel defaultSize={55} minSize={25} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                    <div className={styles.editorContainer}>
                      <CodeEditor 
                        value={code} 
                        onChange={setCode} 
                        language={language} 
                        height="100%" 
                        borderless={true}
                        onCursorChange={(line, col) => setCursorPos({ line, col })}
                      />
                    </div>
                  </Panel>

                  <Separator className={styles.resizeHandleHorizontal}>
                    <div className={styles.handleBarHorizontal} />
                  </Separator>

                  <Panel defaultSize={45} minSize={20} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }} data-lenis-prevent="true">
                    <LeetCodeConsole
                      problem={problem}
                      output={output}
                      isRunning={isRunning || isSubmitting}
                      customInput={customInput}
                      onCustomInputChange={setCustomInput}
                      onRun={() => handleRun()}
                      onClose={() => setIsConsoleOpen(false)}
                      activeTab={activeConsoleTab}
                      setActiveTab={setActiveConsoleTab}
                    />
                  </Panel>
                </Group>
              ) : (
                <div className={styles.editorContainer}>
                  <CodeEditor 
                    value={code} 
                    onChange={setCode} 
                    language={language} 
                    height="100%" 
                    borderless={true}
                    onCursorChange={(line, col) => setCursorPos({ line, col })}
                  />
                </div>
              )}
            </div>

            {/* LeetCode Clean Bottom Bar */}
            <div className={styles.statusBar} style={{ background: '#1a1a1a', borderTop: '1px solid #282828', height: 28, padding: '0 12px' }}>
              <div className={styles.statusLeft} style={{ gap: 14 }}>
                <button 
                  type="button"
                  className={styles.statusItem}
                  onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                  style={{ background: 'transparent', border: 'none', color: '#8a8a8e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}
                  title="Toggle Testcase Console"
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#eff1f6' }}>Console</span>
                  {isConsoleOpen ? <ChevronDown size={13} color="#8a8a8e" /> : <ChevronUp size={13} color="#8a8a8e" />}
                </button>
                <div className={styles.statusItem} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#8a8a8e' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2cbb5d', display: 'inline-block' }} />
                  <span>Saved</span>
                </div>
                {isRunning && <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Running...</span>}
                {isSubmitting && <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Submitting...</span>}
              </div>

              <div className={styles.statusRight} style={{ fontSize: '0.72rem', color: '#8a8a8e', gap: 12 }}>
                <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
                <span style={{ textTransform: 'uppercase', fontWeight: 600, color: '#eff1f6' }}>{language}</span>
              </div>
            </div>
          </div>
        </Panel>
      </Group>
    </div>
  );
}
