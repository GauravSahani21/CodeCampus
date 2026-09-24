'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import LanguageSelector from '@/components/Editor/LanguageSelector';
import VsCodeTerminal from '@/components/Editor/VsCodeTerminal';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Group, Panel, Separator } from 'react-resizable-panels';
import {
  Play,
  Send,
  RotateCcw,
  Terminal as TerminalIcon,
  FileText,
  History,
  Lightbulb,
  FileCode2,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Check,
  MessageSquare,
  Sparkles,
  ThumbsUp,
  Plus,
  BookOpen,
  Cpu,
  Clock,
  Bug,
  Zap,
} from 'lucide-react';
import FileLanguageIcon from '@/components/Editor/FileLanguageIcon';
import styles from './page.module.css';

const CodeEditor = dynamic(() => import('@/components/Editor/CodeEditor'), { ssr: false });

interface Problem {
  _id: string; title: string; slug: string; difficulty: string;
  tags: string[]; description: string; constraints: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  starterTemplates: Record<string, string>;
  hints: string[];
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

export default function ProblemSolvePage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const { user } = useAuthStore();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState('');
  const [activeLeftTab, setActiveLeftTab] = useState<'question' | 'submissions' | 'discuss' | 'ai-review'>('question');
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

  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // AI Review state
  const [isReviewing, setIsReviewing] = useState(false);
  const [aiReview, setAiReview] = useState<any>(null);

  // Discussion state
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [discussCategory, setDiscussCategory] = useState<string>('all');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCat, setNewThreadCat] = useState<'question' | 'approach' | 'edge-case' | 'bug'>('question');
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Fetch problem on mount
  useEffect(() => {
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
      const url = `/discussions/problem/${problem.slug}${discussCategory !== 'all' ? `?category=${discussCategory}` : ''}`;
      const { data } = await api.get(url);
      setDiscussions(data);
    } catch {
      // ignore
    } finally {
      setLoadingDiscussions(false);
    }
  }, [problem, discussCategory]);

  useEffect(() => {
    if (activeLeftTab === 'discuss' && problem) {
      fetchDiscussions();
    }
  }, [activeLeftTab, problem, fetchDiscussions]);

  const handleAIReview = async () => {
    if (!code.trim()) {
      toast.error('Code editor is empty');
      return;
    }
    setIsReviewing(true);
    setActiveLeftTab('ai-review');
    try {
      const { data } = await api.post('/execute/ai-review', {
        language,
        sourceCode: code,
        problemTitle: problem?.title,
        problemDescription: problem?.description,
      });
      setAiReview(data);
      toast.success('AI Code Review complete!');
    } catch {
      toast.error('AI review failed. Please try again.');
    } finally {
      setIsReviewing(false);
    }
  };

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

  const handleRun = async (overrideStdin?: string) => {
    if (!code.trim()) { toast.error('Write some code first!'); return; }
    setIsRunning(true); setOutput(null); setIsConsoleOpen(true);
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
    setIsSubmitting(true); setOutput(null); setIsConsoleOpen(true);
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
      <Group orientation="horizontal" className={styles.splitLayout}>
        {/* LEFT PANEL */}
        <Panel defaultSize={45} minSize={20} className={styles.leftPanel}>
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
            <button 
              className={`${styles.leftTab} ${activeLeftTab === 'ai-review' ? styles.activeTab : ''}`}
              onClick={() => setActiveLeftTab('ai-review')}
            >
              <Sparkles size={14} color="#c084fc" /> AI Review
            </button>
          </div>

          <div className={styles.leftContent} data-lenis-prevent="true">
            {activeLeftTab === 'question' && (
              <>
                <div className={styles.problemHeader}>
                  <h1 className={styles.title}>{problem.title}</h1>
                  {isSolved && <span className={styles.solvedIcon}>✓</span>}
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
                      <button onClick={() => setShowHint(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
                    </div>
                    {problem.hints.map((h, i) => (
                      <p key={i} style={{ fontSize: '0.9rem', color: '#e6edf3', margin: '6px 0' }}>• {h}</p>
                    ))}
                  </div>
                )}

                <div className={styles.markdownBody}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {problem.description?.replace(new RegExp(`^#+\\s*${problem.title.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*\\n+`, 'i'), '') || problem.description}
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

            {/* AI CODE REVIEW TAB */}
            {activeLeftTab === 'ai-review' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={18} color="#c084fc" /> AI Code Review
                  </h3>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', fontSize: '0.78rem' }}
                    onClick={handleAIReview}
                    disabled={isReviewing}
                  >
                    {isReviewing ? 'Analyzing...' : 'Re-analyze Code'}
                  </button>
                </div>

                {isReviewing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 12 }}>
                    <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                    <p style={{ fontSize: '0.85rem', color: '#a78bfa' }}>AI engine analyzing asymptotic complexity, logic errors, and optimization avenues...</p>
                  </div>
                ) : !aiReview ? (
                  <div style={{ padding: '30px 16px', textAlign: 'center', background: '#161b22', border: '1px dashed #30363d', borderRadius: 8 }}>
                    <Sparkles size={28} color="#a78bfa" style={{ marginBottom: 8 }} />
                    <p style={{ color: '#e6edf3', fontSize: '0.9rem', marginBottom: 6, fontWeight: 600 }}>Ready to Review Your Solution</p>
                    <p style={{ color: '#8b949e', fontSize: '0.8rem', marginBottom: 16 }}>Click the button below to get an instant AI evaluation of bugs, time/space complexity, and code quality.</p>
                    <button className="btn btn-primary btn-sm" onClick={handleAIReview}>
                      <Sparkles size={14} /> Analyze Code Now
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Score / Grade Header */}
                    <div style={{
                      background: '#161b22',
                      border: '1px solid #30363d',
                      borderRadius: 8,
                      padding: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16
                    }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: aiReview.overallRating === 'A' ? 'rgba(57, 211, 83, 0.15)' : aiReview.overallRating === 'B' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(248, 81, 73, 0.15)',
                        border: `2px solid ${aiReview.overallRating === 'A' ? '#39d353' : aiReview.overallRating === 'B' ? '#38bdf8' : '#f85149'}`,
                        color: aiReview.overallRating === 'A' ? '#39d353' : aiReview.overallRating === 'B' ? '#38bdf8' : '#f85149',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {aiReview.overallRating}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>
                          Overall Solution Rating: Grade {aiReview.overallRating}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#8b949e', marginTop: 2 }}>
                          {aiReview.summary}
                        </div>
                      </div>
                    </div>

                    {/* Complexity Metric Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: '0.72rem', color: '#8b949e', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Clock size={12} color="#38bdf8" /> Time Complexity
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>
                          {aiReview.timeComplexity}
                        </div>
                      </div>
                      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: '0.72rem', color: '#8b949e', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Cpu size={12} color="#c084fc" /> Space Complexity
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c084fc' }}>
                          {aiReview.spaceComplexity}
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: '#8b949e', background: 'rgba(56, 189, 248, 0.05)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                      {aiReview.complexityExplanation}
                    </p>

                    {/* Bugs Identified */}
                    {aiReview.detectedBugs && aiReview.detectedBugs.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '0.85rem', color: '#f85149', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600 }}>
                          <Bug size={14} /> Potential Bugs & Pitfalls
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {aiReview.detectedBugs.map((b: any, idx: number) => (
                            <div key={idx} style={{ background: 'rgba(248, 81, 73, 0.08)', border: '1px solid rgba(248, 81, 73, 0.3)', borderRadius: 6, padding: 10 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#f85149' }}>{b.title}</div>
                              <div style={{ fontSize: '0.75rem', color: '#c9d1d9', marginTop: 3 }}>{b.description}</div>
                              {b.suggestedFix && (
                                <div style={{ fontSize: '0.72rem', color: '#39d353', marginTop: 4 }}>Fix: {b.suggestedFix}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inefficiencies */}
                    {aiReview.inefficiencies && aiReview.inefficiencies.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '0.85rem', color: '#e3b341', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600 }}>
                          <Zap size={14} /> Performance Inefficiencies
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {aiReview.inefficiencies.map((ineff: any, idx: number) => (
                            <div key={idx} style={{ background: 'rgba(227, 179, 65, 0.08)', border: '1px solid rgba(227, 179, 65, 0.3)', borderRadius: 6, padding: 10 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#e3b341' }}>{ineff.title} ({ineff.impact})</div>
                              <div style={{ fontSize: '0.75rem', color: '#c9d1d9', marginTop: 3 }}>{ineff.explanation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {aiReview.improvements && aiReview.improvements.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '0.85rem', color: '#fff', marginBottom: 8, fontWeight: 600 }}>
                          Suggested Improvements
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {aiReview.improvements.map((imp: string, idx: number) => (
                            <li key={idx} style={{ fontSize: '0.78rem', color: '#8b949e' }}>
                              {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

            {/* DISCUSSION FORUM TAB */}
            {activeLeftTab === 'discuss' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquare size={16} color="#38bdf8" /> Community Discussion
                  </h3>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => setShowNewThread(!showNewThread)}
                  >
                    <Plus size={14} /> {showNewThread ? 'Cancel' : 'New Post'}
                  </button>
                </div>

                {/* Category filters */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
                  {['all', 'question', 'approach', 'edge-case', 'bug'].map((cat) => (
                    <button
                      key={cat}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        borderRadius: 14,
                        border: '1px solid #30363d',
                        background: discussCategory === cat ? '#38bdf8' : '#161b22',
                        color: discussCategory === cat ? '#000' : '#8b949e',
                        cursor: 'pointer',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                      onClick={() => setDiscussCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* New Thread Form */}
                {showNewThread && (
                  <form onSubmit={handleCreateDiscussion} style={{ background: '#161b22', border: '1px solid #38bdf8', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', marginBottom: 10 }}>Ask a Question or Share an Approach</h4>
                    <input
                      type="text"
                      placeholder="Title (e.g. O(N) Hash Map approach with edge cases)"
                      value={newThreadTitle}
                      onChange={(e) => setNewThreadTitle(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, color: '#fff', fontSize: '0.8rem', marginBottom: 8 }}
                      required
                    />
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <select
                        value={newThreadCat}
                        onChange={(e: any) => setNewThreadCat(e.target.value)}
                        style={{ padding: '6px 10px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, color: '#fff', fontSize: '0.75rem' }}
                      >
                        <option value="question">Question</option>
                        <option value="approach">Approach</option>
                        <option value="edge-case">Edge Case</option>
                        <option value="bug">Bug Report</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Write your explanation or query in markdown..."
                      rows={4}
                      value={newThreadContent}
                      onChange={(e) => setNewThreadContent(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, color: '#fff', fontSize: '0.8rem', marginBottom: 10, resize: 'vertical' }}
                      required
                    />
                    <button type="submit" className="btn btn-primary btn-sm" style={{ fontSize: '0.78rem' }}>
                      Publish to Discussion
                    </button>
                  </form>
                )}

                {/* Discussion Thread List */}
                {loadingDiscussions ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                    <div className="spinner" style={{ width: 24, height: 24 }} />
                  </div>
                ) : discussions.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#8b949e', fontSize: '0.82rem', background: '#161b22', borderRadius: 8, border: '1px dashed #30363d' }}>
                    No discussions found in this category. Be the first to start a conversation!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {discussions.map((t) => {
                      const isExpanded = expandedThreadId === t._id;
                      const hasUpvoted = user && t.upvotes?.includes(user.id);
                      return (
                        <div key={t._id} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 12 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            {/* Upvote button */}
                            <button
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                                background: hasUpvoted ? 'rgba(56, 189, 248, 0.15)' : '#0d1117',
                                border: `1px solid ${hasUpvoted ? '#38bdf8' : '#30363d'}`,
                                color: hasUpvoted ? '#38bdf8' : '#8b949e',
                                borderRadius: 6,
                                padding: '6px 8px',
                                cursor: 'pointer',
                                minWidth: 36,
                              }}
                              onClick={() => handleToggleUpvote(t._id)}
                              title="Upvote discussion"
                            >
                              <ThumbsUp size={13} />
                              <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{t.upvotes?.length || 0}</span>
                            </button>

                            {/* Thread Body */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                                <span style={{
                                  fontSize: '0.68rem',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: t.category === 'approach' ? 'rgba(57, 211, 83, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                  color: t.category === 'approach' ? '#39d353' : '#38bdf8',
                                  fontWeight: 600,
                                  textTransform: 'uppercase'
                                }}>
                                  {t.category}
                                </span>
                                {t.isSolved && (
                                  <span style={{ fontSize: '0.68rem', color: '#39d353', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                    ✓ Solved
                                  </span>
                                )}
                                <span style={{ fontSize: '0.72rem', color: '#8b949e' }}>
                                  by <strong style={{ color: '#c9d1d9' }}>{t.authorId?.username || 'User'}</strong>
                                </span>
                              </div>

                              <div
                                style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', cursor: 'pointer', marginBottom: 4 }}
                                onClick={() => setExpandedThreadId(isExpanded ? null : t._id)}
                              >
                                {t.title}
                              </div>

                              <p style={{ fontSize: '0.78rem', color: '#8b949e', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                                {t.content}
                              </p>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ fontSize: '0.72rem', padding: '3px 8px', color: '#58a6ff' }}
                                  onClick={() => setExpandedThreadId(isExpanded ? null : t._id)}
                                >
                                  {t.replies?.length || 0} replies {isExpanded ? '▴' : '▾'}
                                </button>
                              </div>

                              {/* Expanded replies section */}
                              {isExpanded && (
                                <div style={{ marginTop: 12, borderTop: '1px solid #30363d', paddingTop: 10 }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                    {(!t.replies || t.replies.length === 0) ? (
                                      <p style={{ fontSize: '0.75rem', color: '#6e7681' }}>No replies yet. Leave your thoughts below!</p>
                                    ) : (
                                      t.replies.map((rep: any) => (
                                        <div
                                          key={rep._id}
                                          style={{
                                            background: rep.isAccepted ? 'rgba(57, 211, 83, 0.08)' : '#0d1117',
                                            border: `1px solid ${rep.isAccepted ? '#39d353' : '#21262d'}`,
                                            borderRadius: 6,
                                            padding: '8px 10px',
                                          }}
                                        >
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <span style={{ fontSize: '0.72rem', color: '#8b949e' }}>
                                              <strong style={{ color: '#fff' }}>{rep.authorId?.username || 'User'}</strong>
                                              {rep.authorId?.role === 'instructor' && (
                                                <span style={{ marginLeft: 4, background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '1px 4px', borderRadius: 4, fontSize: '0.65rem' }}>Instructor</span>
                                              )}
                                            </span>
                                            {(user?.id === t.authorId?._id || user?.role === 'instructor' || user?.role === 'admin') && (
                                              <button
                                                style={{
                                                  background: 'none',
                                                  border: 'none',
                                                  color: rep.isAccepted ? '#39d353' : '#6e7681',
                                                  fontSize: '0.7rem',
                                                  cursor: 'pointer',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 3,
                                                }}
                                                onClick={() => handleAcceptReply(t._id, rep._id)}
                                                title="Toggle accepted answer"
                                              >
                                                <CheckCircle2 size={12} /> {rep.isAccepted ? 'Accepted Solution' : 'Accept as Solution'}
                                              </button>
                                            )}
                                          </div>
                                          <div style={{ fontSize: '0.78rem', color: '#c9d1d9', lineHeight: 1.35 }}>
                                            {rep.content}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>

                                  {/* Reply input */}
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <input
                                      type="text"
                                      placeholder="Write a helpful answer or observation..."
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      style={{ flex: 1, padding: '6px 10px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 6, color: '#fff', fontSize: '0.75rem' }}
                                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddReply(t._id); }}
                                    />
                                    <button
                                      className="btn btn-primary btn-sm"
                                      style={{ fontSize: '0.72rem', padding: '6px 10px' }}
                                      onClick={() => handleAddReply(t._id)}
                                    >
                                      Reply
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
            )}
          </div>
        </Panel>

        <Separator className={styles.resizeHandle} />

        {/* RIGHT PANEL - Modern VS Code Editor & Integrated Terminal */}
        <Panel defaultSize={55} minSize={30} className={styles.rightPanel}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
            {/* VS Code Tabs Bar */}
            <div className={styles.tabsBar}>
              <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <div className={styles.tabItem}>
                  <FileLanguageIcon language={language} filename={LANG_FILE_MAP[language]} size={14} />
                  <span>{LANG_FILE_MAP[language] || 'Solution'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8 }}>
                <LanguageSelector value={language} onChange={handleLanguageChange} />
                
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
                  title={showHint ? "Hide hint" : "Show hint"} 
                  onClick={toggleHint}
                  style={showHint ? { color: '#facc15' } : undefined}
                >
                  <Lightbulb size={13} />
                </button>

                <button 
                  className={styles.headerIconBtn} 
                  title="Toggle Integrated Terminal"
                  onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                  style={isConsoleOpen ? { color: '#38bdf8' } : undefined}
                >
                  <TerminalIcon size={13} />
                </button>

                <button 
                  className={styles.runButton}
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', border: 'none', color: '#fff' }}
                  onClick={handleAIReview}
                  disabled={isReviewing}
                  title="Run AI Code Review on your solution"
                >
                  <Sparkles size={12} />
                  <span>{isReviewing ? 'Analyzing...' : 'AI Review'}</span>
                </button>

                <button 
                  className={styles.runButton}
                  onClick={() => handleRun()}
                  disabled={isRunning || isSubmitting}
                  title="Run code against testcase or stdin"
                >
                  <Play size={12} fill="currentColor" />
                  <span>{isRunning ? 'Running...' : 'Run'}</span>
                </button>

                <button 
                  className={styles.submitButton}
                  onClick={handleSubmit}
                  disabled={isRunning || isSubmitting}
                  title="Submit code for evaluation"
                >
                  <Send size={12} />
                  <span>{isSubmitting ? 'Judging...' : 'Submit'}</span>
                </button>
              </div>
            </div>

            {/* Breadcrumbs Bar */}
            <div className={styles.breadcrumbsBar}>
              <span className={styles.breadcrumbItem}>problems</span>
              <span>›</span>
              <span className={styles.breadcrumbItem}>{problem.slug}</span>
              <span>›</span>
              <span className={`${styles.breadcrumbItem} ${styles.breadcrumbActive}`}>
                <FileLanguageIcon language={language} filename={LANG_FILE_MAP[language]} size={12} />
                {LANG_FILE_MAP[language] || 'Solution'}
              </span>
              {showHint && problem.hints && problem.hints.length > 0 && (
                <div style={{ marginLeft: 'auto', color: '#facc15', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem' }}>
                  <Lightbulb size={12} /> Hint: {problem.hints[0]}
                </div>
              )}
            </div>

            {/* Split Editor and Terminal */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              {isConsoleOpen ? (
                <Group orientation="vertical" style={{ height: '100%', width: '100%' }}>
                  <Panel defaultSize={55} minSize={25} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className={styles.editorContainer}>
                      <CodeEditor 
                        value={code} 
                        onChange={setCode} 
                        language={language} 
                        height="100%" 
                        onCursorChange={(line, col) => setCursorPos({ line, col })}
                      />
                    </div>
                  </Panel>

                  <Separator className={styles.resizeHandleHorizontal}>
                    <div className={styles.handleBarHorizontal} />
                  </Separator>

                  <Panel defaultSize={45} minSize={20} style={{ display: 'flex', flexDirection: 'column' }}>
                    <VsCodeTerminal
                      language={language}
                      isRunning={isRunning || isSubmitting}
                      output={output}
                      onSendInput={(stdinVal) => handleRun(stdinVal)}
                      onClear={() => setOutput(null)}
                      onClose={() => setIsConsoleOpen(false)}
                      onRestart={() => handleRun()}
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
                    onCursorChange={(line, col) => setCursorPos({ line, col })}
                  />
                </div>
              )}
            </div>

            {/* VS Code Bottom Status Bar */}
            <div className={styles.statusBar}>
              <div className={styles.statusLeft}>
                <div className={styles.statusItem}>
                  <GitBranch size={11} />
                  <span>main*</span>
                </div>
                <div className={styles.statusItem}>
                  <AlertCircle size={11} />
                  <span>0</span>
                </div>
                <div 
                  className={`${styles.statusItem} ${styles.statusItemInteractive}`}
                  onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                  title="Toggle Integrated Terminal"
                >
                  <TerminalIcon size={11} />
                  <span>Terminal</span>
                </div>
                {isRunning && <span>Compiling &amp; Running...</span>}
                {isSubmitting && <span>Evaluating Testcases...</span>}
              </div>

              <div className={styles.statusRight}>
                <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
                <span>Spaces: 4</span>
                <span>UTF-8</span>
                <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{language}</span>
              </div>
            </div>
          </div>
        </Panel>
      </Group>
    </div>
  );
}
