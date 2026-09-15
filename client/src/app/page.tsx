'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Zap, Cpu, Activity, Trophy, Swords, Terminal,
  Code2, Users, CheckCircle2, Play, Shield, Sparkles,
  Layers, HelpCircle, ArrowRight, Check, Compass,
  BookOpen, Eye, Flame, Award, ChevronRight
} from 'lucide-react';
import styles from './page.module.css';

const CODE_SAMPLES: Record<string, { filename: string; code: string }> = {
  python: {
    filename: 'solution.py',
    code: `# Dynamic Programming: Two Sum Target
def two_sum(nums, target):
    seen = {}
    for idx, val in enumerate(nums):
        diff = target - val
        if diff in seen:
            return [seen[diff], idx]
        seen[val] = idx
    return []

if __name__ == "__main__":
    nums = [2, 7, 11, 15]
    print(two_sum(nums, 9))  # Output: [0, 1]`
  },
  cpp: {
    filename: 'solution.cpp',
    code: `// C++20 Hash Map Solution
#include <iostream>
#include <vector>
#include <unordered_map>

std::vector<int> twoSum(const std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); ++i) {
        int complement = target - nums[i];
        if (seen.count(complement)) return {seen[complement], i};
        seen[nums[i]] = i;
    }
    return {};
}`
  },
  typescript: {
    filename: 'solution.ts',
    code: `// TypeScript: Optimized Lookups
function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff)!, i];
    map.set(nums[i], i);
  }
  return [];
}`
  }
};

const STATS = [
  { value: '150+',  label: 'Curated Problems', sub: 'From Easy to Hard DSA' },
  { value: '13+',   label: 'Language Compilers', sub: 'Instant Piston Execution' },
  { value: '2 Modes', label: 'Assessment Types', sub: 'Standard & SuperSet Exams' },
  { value: '100%',  label: 'AI-Proctored Security', sub: 'Incident Telemetry & Audit' },
];

export default function HomePage() {
  const [selectedLang, setSelectedLang] = useState<'python' | 'cpp' | 'typescript'>('python');
  const [runState, setRunState] = useState<'idle' | 'running' | 'passed'>('idle');
  const [activeModeTab, setActiveModeTab] = useState<'superset' | 'standard'>('superset');

  const handleSimulateRun = () => {
    if (runState === 'running') return;
    setRunState('running');
    setTimeout(() => {
      setRunState('passed');
    }, 850);
  };

  return (
    <div className={styles.page}>
      {/* Background glow ambiance */}
      <div className={styles.heroBg}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
        <div className={styles.grid} />
      </div>

      {/* ─── Hero Section ────────────────────────────── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroBadgeRow}>
            <div className={styles.heroPill}>
              <Sparkles size={13} className={styles.sparkleIcon} />
              <span>Next-Gen Developer Learning &amp; Assessment Platform</span>
            </div>
            <div className={styles.heroModePill}>
              <Award size={12} />
              <span>SuperSet-Style Exams Live</span>
            </div>
          </div>

          <h1 className={styles.heroTitle}>
            Code with Precision.<br />
            <span className={styles.gradientHeading}>Excel in Assessments.</span>
          </h1>

          <p className={styles.heroSub}>
            The high-performance platform for developers mastering algorithms. Practice in a 
            lightning-fast 13+ language cloud IDE, challenge peers in real-time 1v1 duels, 
            and take <strong>SuperSet-style proctored exams</strong> with automated AI mistake diagnosis.
          </p>

          <div className={styles.heroActions}>
            <Link href="/auth/signup" className={`btn btn-primary btn-lg ${styles.primaryCta}`}>
              Start Coding Free <ArrowRight size={16} />
            </Link>
            <Link href="/contests" className={`btn btn-secondary btn-lg ${styles.secondaryCta}`}>
              <Trophy size={16} style={{ color: 'var(--accent-green)' }} />
              Explore Contests
            </Link>
            <Link href="/problems" className={`btn btn-outline btn-lg ${styles.outlineCta}`}>
              Browse 150+ Problems
            </Link>
          </div>

          {/* Quick Feature Strips */}
          <div className={styles.featureStrips}>
            <Link href="/contests" className={styles.featureStrip}>
              <div className={styles.stripIconWrap} style={{ color: 'var(--accent-blue)', background: 'rgba(88,166,255,0.1)' }}>
                <Trophy size={15} />
              </div>
              <span>
                <strong>Dual-Mode Contests:</strong> Blank Editor or SuperSet Exam with Code Execution &amp; MCQs
              </span>
              <span className={styles.stripArrow}>→</span>
            </Link>

            <Link href="/versus" className={styles.featureStrip}>
              <div className={styles.stripIconWrap} style={{ color: 'var(--accent-green)', background: 'rgba(57,211,83,0.1)' }}>
                <Swords size={15} />
              </div>
              <span>
                <strong>Versus Arena:</strong> Live 1v1 multiplayer coding duels with real-time timers
              </span>
              <span className={styles.stripArrow}>→</span>
            </Link>

            <Link href="/learn" className={styles.featureStrip}>
              <div className={styles.stripIconWrap} style={{ color: 'var(--accent-purple)', background: 'rgba(188,140,255,0.1)' }}>
                <Compass size={15} />
              </div>
              <span>
                <strong>AI Diagnostics:</strong> Personalized mistake analysis &amp; targeted course recommendations
              </span>
              <span className={styles.stripArrow}>→</span>
            </Link>
          </div>

          {/* Interactive Code Preview Terminal */}
          <div className={styles.codePreviewWrapper}>
            <div className={styles.codeWindow}>
              {/* Window Header */}
              <div className={styles.codeBar}>
                <div className={styles.windowDots}>
                  <span className={`${styles.dot} ${styles.red}`} />
                  <span className={`${styles.dot} ${styles.yellow}`} />
                  <span className={`${styles.dot} ${styles.green}`} />
                </div>
                
                <div className={styles.langTabs}>
                  <button
                    className={`${styles.langTab} ${selectedLang === 'python' ? styles.langTabActive : ''}`}
                    onClick={() => { setSelectedLang('python'); setRunState('idle'); }}
                  >
                    Python 3
                  </button>
                  <button
                    className={`${styles.langTab} ${selectedLang === 'cpp' ? styles.langTabActive : ''}`}
                    onClick={() => { setSelectedLang('cpp'); setRunState('idle'); }}
                  >
                    C++ 20
                  </button>
                  <button
                    className={`${styles.langTab} ${selectedLang === 'typescript' ? styles.langTabActive : ''}`}
                    onClick={() => { setSelectedLang('typescript'); setRunState('idle'); }}
                  >
                    TypeScript
                  </button>
                </div>

                <div className={styles.codeFileName}>
                  <Code2 size={13} style={{ color: 'var(--accent-blue)' }} />
                  <span>{CODE_SAMPLES[selectedLang].filename}</span>
                </div>
              </div>

              {/* Code Editor Body */}
              <div className={styles.codeBody}>
                <pre className={styles.codeContent}>
                  <code>{CODE_SAMPLES[selectedLang].code}</code>
                </pre>
              </div>

              {/* Terminal Bottom Controls & Simulation */}
              <div className={styles.codeFooter}>
                <div className={styles.runControls}>
                  <button
                    className={`${styles.runBtn} ${runState === 'running' ? styles.runBtnLoading : ''}`}
                    onClick={handleSimulateRun}
                  >
                    <Play size={13} fill="currentColor" />
                    {runState === 'running' ? 'Executing Test Cases...' : 'Run Simulation'}
                  </button>
                  <span className={styles.runHint}>
                    Try clicking <strong>Run Simulation</strong> to test cloud execution
                  </span>
                </div>

                {runState === 'passed' && (
                  <div className={styles.executionBadgeSuccess}>
                    <CheckCircle2 size={14} />
                    <span>3/3 Test Cases Passed · 38ms · 100/100 Pts</span>
                  </div>
                )}
                {runState === 'running' && (
                  <div className={styles.executionBadgeLoading}>
                    <span className={styles.pulseDot} />
                    <span>Compiling in sandbox...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ───────────────────────────────── */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            {STATS.map((s) => (
              <div key={s.label} className={styles.statCard}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
                <div className={styles.statSub}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Dual-Mode Assessment Architecture Spotlight ── */}
      <section className={styles.assessmentSpotlight}>
        <div className="container">
          <div className={`text-center ${styles.sectionHeader}`}>
            <div className={styles.sectionBadge}>
              <Shield size={13} /> Assessment Engine
            </div>
            <h2>Two Powerful Exam Modes for Every Evaluation Need</h2>
            <p>
              Instructors can choose between strict traditional examination lockdown or 
              industry-standard SuperSet assessments with interactive test runners and MCQs.
            </p>
          </div>

          <div className={styles.modeTabs}>
            <button
              className={`${styles.modeTabBtn} ${activeModeTab === 'superset' ? styles.modeTabBtnActive : ''}`}
              onClick={() => setActiveModeTab('superset')}
            >
              <Sparkles size={16} />
              Option 2: SuperSet-Style Exam (Code Runner + MCQs)
            </button>
            <button
              className={`${styles.modeTabBtn} ${activeModeTab === 'standard' ? styles.modeTabBtnActive : ''}`}
              onClick={() => setActiveModeTab('standard')}
            >
              <Shield size={16} />
              Option 1: Standard Blank Editor (Strict Lockdown)
            </button>
          </div>

          <div className={styles.modeShowcaseCard}>
            {activeModeTab === 'superset' ? (
              <div className={styles.modeContentGrid}>
                <div className={styles.modeDetails}>
                  <div className={styles.modeHighlightPill}>
                    <Sparkles size={14} /> Comprehensive Multi-Format Assessment
                  </div>
                  <h3>SuperSet-Style Corporate Evaluation</h3>
                  <p>
                    Replicates top placement and competitive hiring exam environments. Candidates can run 
                    and test their solutions in real time while answering subject matter MCQs.
                  </p>
                  <ul className={styles.modeChecklist}>
                    <li>
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                      <span><strong>Interactive Code Execution:</strong> Run code against sample cases or custom input before submitting.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                      <span><strong>Multiple Choice Questions (MCQs):</strong> Integrated quizzes with custom points, explanations, and instant auto-grading.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                      <span><strong>Dual-Section Navigation:</strong> Seamlessly jump between Coding Section and MCQ Section with question palette.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                      <span><strong>Granular Results Review:</strong> Question-by-question review showing candidate choice, correct answers, and score breakdown.</span>
                    </li>
                  </ul>
                  <div className={styles.modeActionRow}>
                    <Link href="/contests" className="btn btn-primary btn-md">
                      View SuperSet Contests <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                <div className={styles.modeVisual}>
                  <div className={styles.mockExamWindow}>
                    <div className={styles.mockExamNav}>
                      <span className={styles.mockTabActive}>Section 1: Coding (2 Problems)</span>
                      <span className={styles.mockTab}>Section 2: MCQs (10 Questions)</span>
                    </div>
                    <div className={styles.mockExamBody}>
                      <div className={styles.mockConsole}>
                        <div className={styles.mockConsoleHeader}>
                          <span>Test Case Runner</span>
                          <span className={styles.badgePass}>Case 1: Passed (21ms)</span>
                        </div>
                        <div className={styles.mockConsoleOutput}>
                          Input: [2, 7, 11, 15], Target: 9<br />
                          Expected Output: [0, 1]<br />
                          <span style={{ color: 'var(--accent-green)' }}>Actual Output: [0, 1] ✓</span>
                        </div>
                      </div>
                      <div className={styles.mockMcqPreview}>
                        <div className={styles.mockMcqPrompt}>Q1. What is the average time complexity of Hash Map search?</div>
                        <div className={styles.mockMcqOptionSelected}>A. O(1) · Constant Time ✓</div>
                        <div className={styles.mockMcqOption}>B. O(n) · Linear</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.modeContentGrid}>
                <div className={styles.modeDetails}>
                  <div className={styles.modeHighlightPill} style={{ color: '#ff7b72', background: 'rgba(248,81,73,0.1)', borderColor: 'rgba(248,81,73,0.3)' }}>
                    <Shield size={14} /> High-Integrity Screening Exam
                  </div>
                  <h3>Standard Blank Editor Assessment</h3>
                  <p>
                    Built specifically for strict university exams and high-stakes recruitment drives where 
                    candidates must demonstrate pure algorithmic derivation without guess-and-check runs.
                  </p>
                  <ul className={styles.modeChecklist}>
                    <li>
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                      <span><strong>Zero Pre-Execution:</strong> No code running before submission. Evaluates mental tracing and algorithmic maturity.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                      <span><strong>Proctored Environment:</strong> Fullscreen lock enforcement, tab/window switch telemetry, and security incident logs.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                      <span><strong>Copy-Paste Blocking:</strong> Clipboard pasting is completely locked down and logged in real-time.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                      <span><strong>Post-Exam AI Evaluation:</strong> Complete mistake diagnosis with pinpointed conceptual remediation.</span>
                    </li>
                  </ul>
                  <div className={styles.modeActionRow}>
                    <Link href="/instructor/contests/create" className="btn btn-secondary btn-md">
                      Create Blank Assessment <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                <div className={styles.modeVisual}>
                  <div className={styles.mockExamWindow}>
                    <div className={styles.mockExamNav}>
                      <span className={styles.mockTabActive}>Proctored Examination Mode</span>
                      <span className={styles.mockIntegrityBadge}>
                        <Shield size={12} /> 100% Integrity Score
                      </span>
                    </div>
                    <div className={styles.mockExamBody}>
                      <div className={styles.mockStrictNotice}>
                        <strong>Proctor Notice:</strong> Pre-run execution disabled. Write your complete algorithm and click Final Submit when finished.
                      </div>
                      <div className={styles.mockEditorArea}>
                        <code>
                          <span style={{ color: 'var(--text-muted)' }}>// Write your complete solution below</span><br />
                          <span style={{ color: '#f78c6c' }}>class</span> <span style={{ color: '#82aaff' }}>Solution</span> &#123;<br />
                          &nbsp;&nbsp;<span style={{ color: '#f78c6c' }}>public int</span> solve(<span style={{ color: '#f78c6c' }}>int</span> n) &#123; ... &#125;<br />
                          &#125;
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Platform Capabilities (Bento Grid) ────────── */}
      <section className={styles.featuresSection}>
        <div className="container">
          <div className={`text-center ${styles.sectionHeader}`}>
            <div className={styles.sectionBadge}>
              <Zap size={13} /> Features &amp; Architecture
            </div>
            <h2>Engineered for Serious Coders</h2>
            <p>Every tool and workflow you need to build engineering mastery and crack technical rounds.</p>
          </div>

          <div className={styles.bentoGrid}>
            {/* Bento 1: Cloud Compiler */}
            <div className={`${styles.bentoCard} ${styles.bentoWide}`}>
              <div className={styles.bentoIcon} style={{ background: 'rgba(57,211,83,0.1)', color: 'var(--accent-green)' }}>
                <Cpu size={24} />
              </div>
              <h3>13+ Language Cloud Compiler &amp; IDE</h3>
              <p>
                Write real code with full boilerplates and standard input/output. Supports C++, Python, Java, 
                Go, Rust, TypeScript, C#, and more with sub-second execution on isolated sandboxes.
              </p>
              <div className={styles.bentoPills}>
                <span>Python</span><span>C++20</span><span>Java 17</span><span>Go</span><span>Rust</span><span>TypeScript</span>
              </div>
            </div>

            {/* Bento 2: 1v1 Versus */}
            <div className={styles.bentoCard}>
              <div className={styles.bentoIcon} style={{ background: 'rgba(88,166,255,0.1)', color: 'var(--accent-blue)' }}>
                <Swords size={24} />
              </div>
              <h3>1v1 Real-Time Coding Battles</h3>
              <p>
                Challenge friends or peers to synchronous algorithmic duels with live socket tracking and countdown timers.
              </p>
              <Link href="/versus" className={styles.cardLink}>
                Enter Arena →
              </Link>
            </div>

            {/* Bento 3: AI Diagnostics */}
            <div className={styles.bentoCard}>
              <div className={styles.bentoIcon} style={{ background: 'rgba(188,140,255,0.1)', color: 'var(--accent-purple)' }}>
                <Sparkles size={24} />
              </div>
              <h3>AI-Powered Mistake Diagnostics</h3>
              <p>
                Our AI analyzes your submissions, identifies algorithmic bottlenecks, and curates customized lessons.
              </p>
              <Link href="/learn" className={styles.cardLink}>
                Explore Courses →
              </Link>
            </div>

            {/* Bento 4: Automated Proctoring */}
            <div className={styles.bentoCard}>
              <div className={styles.bentoIcon} style={{ background: 'rgba(240,136,62,0.1)', color: 'var(--accent-orange)' }}>
                <Shield size={24} />
              </div>
              <h3>Automated Exam Integrity Audit</h3>
              <p>
                Logs tab switches, fullscreen departures, and copy-paste events to generate verified security reports.
              </p>
            </div>

            {/* Bento 5: Streak & Heatmap */}
            <div className={`${styles.bentoCard} ${styles.bentoWide}`}>
              <div className={styles.bentoIcon} style={{ background: 'rgba(57,211,83,0.1)', color: 'var(--accent-green)' }}>
                <Flame size={24} />
              </div>
              <h3>Consistency Streaks &amp; Activity Heatmap</h3>
              <p>
                Visualize your daily problem-solving dedication with a GitHub-style activity matrix. Build daily habits and climb the global prestige rankings.
              </p>
              <div className={styles.mockHeatmap}>
                {Array.from({ length: 28 }).map((_, i) => (
                  <span
                    key={i}
                    className={styles.heatCell}
                    style={{
                      opacity: i % 4 === 0 ? 0.9 : i % 3 === 0 ? 0.6 : i % 2 === 0 ? 0.3 : 0.1
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Workflow Section: How CodeCampus Works ──────── */}
      <section className={styles.workflowSection}>
        <div className="container">
          <div className={`text-center ${styles.sectionHeader}`}>
            <div className={styles.sectionBadge}>
              <Activity size={13} /> The Learning Loop
            </div>
            <h2>From Practice to Placement</h2>
            <p>A proven cycle designed to accelerate problem-solving intuition and interview readiness.</p>
          </div>

          <div className={styles.workflowGrid}>
            <div className={styles.workflowStep}>
              <div className={styles.stepNumber}>01</div>
              <h3>Practice &amp; Build</h3>
              <p>
                Solve curated problems categorized by topic and difficulty in the full-featured online IDE.
              </p>
            </div>

            <div className={styles.workflowDivider}>
              <ChevronRight size={24} />
            </div>

            <div className={styles.workflowStep}>
              <div className={styles.stepNumber}>02</div>
              <h3>Compete &amp; Assess</h3>
              <p>
                Take live Standard or SuperSet contests with timed constraints and proctored multi-case evaluation.
              </p>
            </div>

            <div className={styles.workflowDivider}>
              <ChevronRight size={24} />
            </div>

            <div className={styles.workflowStep}>
              <div className={styles.stepNumber}>03</div>
              <h3>Diagnose &amp; Master</h3>
              <p>
                Review AI-generated mistake diagnostics and follow targeted course tracks to eliminate weaknesses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ──────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaGlow} />
            <div className={styles.ctaBadge}>
              <Trophy size={14} /> Join the CodeCampus Community
            </div>
            <h2>Ready to Elevate Your Problem-Solving Mastery?</h2>
            <p>
              Join ambitious developers and university students tackling real DSA problems, 
              competing in proctored contests, and building software engineering excellence.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/auth/signup" className="btn btn-primary btn-lg">
                Create Free Account <ArrowRight size={16} />
              </Link>
              <Link href="/contests" className="btn btn-secondary btn-lg">
                Explore Contests
              </Link>
              <Link href="/problems" className="btn btn-outline btn-lg">
                Browse Problems
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
