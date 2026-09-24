'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  Trophy, Sparkles, AlertTriangle, CheckCircle2,
  XCircle, Clock, ArrowRight, ArrowLeft, Target,
  FileCode, Layers, Compass, Shield, ShieldCheck, ShieldAlert,
  HelpCircle, CheckSquare
} from 'lucide-react';
import styles from './results.module.css';

export default function ContestResultsPage() {
  const params = useParams();
  const contestId = params?.id as string;

  const [contest, setContest] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedCode, setExpandedCode] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!contestId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        // Load contest
        const cRes = await api.get(`/contests/${contestId}`);
        setContest(cRes.data);

        // Load submission
        const sRes = await api.get(`/contests/${contestId}/my-submission`);
        if (sRes.data?.submission) {
          setSubmission(sRes.data.submission);
        } else {
          setErrorMsg('No submission found for your account on this contest.');
        }
      } catch (err: any) {
        console.error('Failed to load results:', err);
        setErrorMsg(err.response?.data?.error || 'Failed to load evaluation results');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [contestId]);

  const toggleCode = (probId: string) => {
    setExpandedCode((prev) => ({ ...prev, [probId]: !prev[probId] }));
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', paddingTop: '100px' }}>
        <Sparkles size={40} style={{ color: 'var(--accent-green)', margin: '0 auto 16px' }} />
        <h2>Loading AI Evaluation &amp; Report...</h2>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', paddingTop: '80px' }}>
        <AlertTriangle size={48} style={{ color: 'var(--accent-amber)', margin: '0 auto 16px' }} />
        <h2>No Submission Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {errorMsg || 'You have not submitted solutions for this contest yet.'}
        </p>
        <Link href={`/contests/${contestId}`} className={styles.startCourseBtn}>
          Take Contest Now <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const aiReport = submission.aiReport || {};
  const mistakes: any[] = aiReport.mistakes || [];
  // conceptsToFocus is an array of strings from the service
  const conceptsToFocus: string[] = aiReport.conceptsToFocus || [];
  const recommendedCourses: any[] = aiReport.recommendedCourses || [];
  // summary field (service returns 'summary', not 'overallSummary')
  const overallSummary: string = aiReport.overallSummary || aiReport.summary || '';

  const hasMCQs = (submission.mcqSubmissions && submission.mcqSubmissions.length > 0) || submission.contestType === 'superset';
  const passedMCQs = submission.mcqSubmissions?.filter((m: any) => m.isCorrect).length || 0;
  const totalMCQs = submission.mcqSubmissions?.length || 0;

  return (
    <main className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <Link href="/contests" className={styles.backLink}>
            <ArrowLeft size={14} /> Back to Contests
          </Link>
          <h1 className={styles.title}>
            <Trophy size={28} style={{ color: 'var(--accent-green)' }} />
            Exam Evaluation & AI Learning Report
          </h1>
          <p className={styles.subtitle}>
            {contest?.title || 'Contest'} · Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
            {submission.contestType === 'superset' && (
              <span style={{ marginLeft: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(88,166,255,0.15)', color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 600 }}>
                Interactive Mode (Coding + MCQs)
              </span>
            )}
          </p>
        </div>

        {/* Score Overview Card */}
        <div className={styles.scoreCard}>
          <div className={styles.scoreCircle}>
            <span className={styles.scorePercentage}>{submission.percentage}%</span>
            <span className={styles.scoreText}>Score</span>
          </div>

          <div className={styles.scoreMeta}>
            <div className={styles.scorePoints}>
              {submission.totalScore} / {submission.maxScore} Points Earned
              {hasMCQs && (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, marginLeft: '14px' }}>
                  (Coding: <strong style={{ color: 'var(--accent-green)' }}>{submission.codingScore ?? submission.totalScore}</strong> pts · MCQs: <strong style={{ color: 'var(--accent-blue)' }}>{submission.mcqScore ?? 0}</strong> pts)
                </span>
              )}
            </div>
            <div className={styles.metaTags}>
              <div className={styles.metaTag}>
                <Clock size={14} style={{ color: 'var(--accent-green)' }} />
                <span>Time Spent: {formatSeconds(submission.timeSpentSeconds || 0)}</span>
              </div>
              <div className={styles.metaTag}>
                <Layers size={14} style={{ color: 'var(--accent-blue)' }} />
                <span>
                  Passed Problems:{' '}
                  {submission.problemSubmissions?.filter((p: any) => p.passedAllTests).length} /{' '}
                  {submission.problemSubmissions?.length}
                </span>
              </div>
              {hasMCQs && totalMCQs > 0 && (
                <div className={styles.metaTag}>
                  <CheckSquare size={14} style={{ color: 'var(--accent-green)' }} />
                  <span>
                    Passed MCQs: {passedMCQs} / {totalMCQs}
                  </span>
                </div>
              )}
              <div className={styles.metaTag}>
                <Sparkles size={14} style={{ color: 'var(--accent-green)' }} />
                <span>Status: {submission.status.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Proctoring & Integrity Audit Section */}
        <div className={styles.proctorCard}>
          <div className={styles.proctorTopRow}>
            <div className={styles.proctorTitleWrap}>
              <Shield size={22} style={{ color: 'var(--accent-green)' }} />
              <span className={styles.proctorTitle}>Exam Integrity &amp; Automated Proctoring Audit</span>
            </div>

            {(submission.proctoringData?.violationsCount || 0) === 0 ? (
              <div className={styles.proctorBadgeClean}>
                <ShieldCheck size={14} /> 100% Integrity Score · Verified Clean Session
              </div>
            ) : (
              <div className={styles.proctorBadgeWarn}>
                <ShieldAlert size={14} /> {submission.proctoringData?.violationsCount} Security Incident(s) Logged
              </div>
            )}
          </div>

          <div className={styles.proctorStatsGrid}>
            <div className={styles.proctorStatItem}>
              <div
                className={styles.proctorStatNum}
                style={{
                  color: (submission.proctoringData?.fullscreenExits || 0) > 0 ? '#ff7b72' : 'var(--accent-green)',
                }}
              >
                {submission.proctoringData?.fullscreenExits || 0}
              </div>
              <div className={styles.proctorStatLabel}>Fullscreen Exits</div>
            </div>

            <div className={styles.proctorStatItem}>
              <div
                className={styles.proctorStatNum}
                style={{
                  color: (submission.proctoringData?.tabSwitches || 0) > 0 ? 'var(--accent-amber)' : 'var(--accent-green)',
                }}
              >
                {submission.proctoringData?.tabSwitches || 0}
              </div>
              <div className={styles.proctorStatLabel}>Tab / Window Switches</div>
            </div>

            <div className={styles.proctorStatItem}>
              <div
                className={styles.proctorStatNum}
                style={{
                  color: (submission.proctoringData?.copyPasteAttempts || 0) > 0 ? '#ff7b72' : 'var(--accent-green)',
                }}
              >
                {submission.proctoringData?.copyPasteAttempts || 0}
              </div>
              <div className={styles.proctorStatLabel}>Copy/Paste Blocked</div>
            </div>

            <div className={styles.proctorStatItem}>
              <div className={styles.proctorStatNum} style={{ color: 'var(--accent-blue)' }}>
                {(submission.proctoringData?.violationsCount || 0) === 0 ? 'Verified' : 'Flagged'}
              </div>
              <div className={styles.proctorStatLabel}>Integrity Status</div>
            </div>
          </div>

          {submission.proctoringData?.violationLogs && submission.proctoringData.violationLogs.length > 0 && (
            <div className={styles.proctorLogsBox}>
              <div className={styles.proctorLogsTitle}>Logged Security Events</div>
              {submission.proctoringData.violationLogs.map((log: any, i: number) => (
                <div key={i} className={styles.proctorLogItem}>
                  <div>
                    <strong style={{ color: '#ff7b72' }}>{log.type}</strong>
                    {log.detail && (
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>— {log.detail}</span>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'monospace' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Performance & Mistakes Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <Sparkles size={20} style={{ color: 'var(--accent-green)' }} />
              AI Mistake Diagnosis & Performance Breakdown
            </div>
          </div>

          {/* Overall Summary */}
          {overallSummary && (
            <div className={styles.aiSummaryBox}>
              <strong>AI Diagnostic Summary:</strong> {overallSummary}
            </div>
          )}

          {/* Mistakes Breakdown */}
          {mistakes.length > 0 ? (
            <div className={styles.mistakesList}>
              {mistakes.map((m: any, idx: number) => (
                <div key={idx} className={styles.mistakeCard}>
                  <div className={styles.mistakeHeader}>
                    <div className={styles.mistakeTitle}>
                      <AlertTriangle size={16} style={{ color: 'var(--accent-red)' }} />
                      <span>{m.problemTitle}: {m.mistakeTitle || m.mistakeType || 'Error'}</span>
                    </div>
                  </div>

                  <p className={styles.mistakeText}>
                    <strong>Observation:</strong> {m.explanation || m.description || m.whyItFailed || ''}
                  </p>

                  {(m.fixSuggestion || m.howToFix) && (
                    <div className={styles.fixBox}>
                      <div className={styles.fixLabel}>Recommended Fix:</div>
                      <div>{m.fixSuggestion || m.howToFix}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '16px',
              background: 'rgba(57,211,83,0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(57,211,83,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--accent-green)',
              fontSize: '0.88rem'
            }}>
              <CheckCircle2 size={18} />
              Outstanding work! All test cases passed with no algorithmic errors detected.
            </div>
          )}
        </section>

        {/* Concepts To Focus On */}
        {conceptsToFocus.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Target size={20} style={{ color: 'var(--accent-blue)' }} />
                Key Concepts To Focus On
              </div>
            </div>

            {/* conceptsToFocus is an array of strings */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {conceptsToFocus.map((concept: string, idx: number) => (
                <div key={idx} style={{
                  background: 'rgba(88,166,255,0.1)',
                  border: '1px solid rgba(88,166,255,0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Target size={13} />{concept}
                </div>
              ))}
            </div>
          </section>
        )}


        {/* MCQ Assessment Review (if SuperSet / MCQs present) */}
        {submission.mcqSubmissions && submission.mcqSubmissions.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <HelpCircle size={20} style={{ color: 'var(--accent-blue)' }} />
                Multiple Choice Questions (MCQ) Review
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {submission.mcqSubmissions.filter((m: any) => m.isCorrect).length} of {submission.mcqSubmissions.length} answered correctly · {submission.mcqScore || 0} pts earned
              </span>
            </div>

            {submission.mcqSubmissions.map((mcq: any, idx: number) => {
              const optLabels = ['A', 'B', 'C', 'D'];
              return (
                <div key={idx} className={styles.mcqCard}>
                  <div className={styles.mcqHeader}>
                    <div className={styles.mcqQuestionPrompt}>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 700, marginRight: '8px' }}>
                        Q{idx + 1}.
                      </span>
                      {mcq.questionText}
                    </div>
                    {mcq.isCorrect ? (
                      <span className={styles.mcqBadgeCorrect}>
                        <CheckCircle2 size={13} /> +{mcq.pointsAwarded || mcq.maxPoints} pts
                      </span>
                    ) : (
                      <span className={styles.mcqBadgeWrong}>
                        <XCircle size={13} /> 0 / {mcq.maxPoints} pts
                      </span>
                    )}
                  </div>

                  <div className={styles.mcqOptionsGrid}>
                    {mcq.options?.map((opt: string, optIdx: number) => {
                      const isCandidateChoice = mcq.selectedOption === optIdx;
                      const isCorrectChoice = mcq.correctOption === optIdx;

                      let rowClass = styles.mcqOptionReview;
                      if (isCorrectChoice) {
                        rowClass += ` ${styles.mcqOptionCorrectAnswer}`;
                      } else if (isCandidateChoice && !isCorrectChoice) {
                        rowClass += ` ${styles.mcqOptionWrongSelection}`;
                      }

                      return (
                        <div key={optIdx} className={rowClass}>
                          <span style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: isCorrectChoice
                              ? 'rgba(57, 211, 83, 0.2)'
                              : isCandidateChoice
                              ? 'rgba(248, 81, 73, 0.2)'
                              : 'rgba(255, 255, 255, 0.06)',
                            color: isCorrectChoice
                              ? 'var(--accent-green)'
                              : isCandidateChoice
                              ? '#ff7b72'
                              : 'var(--text-secondary)'
                          }}>
                            {optLabels[optIdx]}
                          </span>
                          <span style={{ flex: 1 }}>{opt}</span>
                          {isCorrectChoice && (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> Correct Answer
                            </span>
                          )}
                          {isCandidateChoice && !isCorrectChoice && (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ff7b72', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={12} /> Your Choice
                            </span>
                          )}
                          {isCandidateChoice && isCorrectChoice && (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              · Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {mcq.explanation && (
                    <div className={styles.mcqExplanationNote}>
                      <strong style={{ color: 'var(--accent-blue)', display: 'block', marginBottom: '4px' }}>
                        Explanation:
                      </strong>
                      {mcq.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* Submitted Solutions Review */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <FileCode size={20} style={{ color: 'var(--text-secondary)' }} />
              Submitted Problem Solutions
            </div>
          </div>

          {submission.problemSubmissions?.map((ps: any, idx: number) => {
            const prob = ps.problemId;
            const isExpanded = expandedCode[prob?._id || idx];
            const passedCases = ps.testResults?.filter((t: any) => t.passed).length || 0;
            const totalCases = ps.testResults?.length || 0;

            return (
              <div key={prob?._id || idx} className={styles.problemResultCard}>
                <div className={styles.problemResultHeader}>
                  <div className={styles.probResultTitle}>
                    {ps.passedAllTests ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--accent-green)' }} />
                    ) : (
                      <XCircle size={18} style={{ color: 'var(--accent-red)' }} />
                    )}
                    <span>{prob?.title || `Problem ${idx + 1}`}</span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      ({ps.pointsEarned} / {ps.pointsPossible} pts · {passedCases}/{totalCases} test cases passed)
                    </span>
                  </div>

                  <button
                    onClick={() => toggleCode(prob?._id || idx)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {isExpanded ? 'Hide Code' : 'View Code'}
                  </button>
                </div>

                {isExpanded && (
                  <pre className={styles.codeSnippet}>{ps.code || '// No code submitted'}</pre>
                )}
              </div>
            );
          })}
        </section>
      </main>
  );
}
