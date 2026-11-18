'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Code2,
  Trophy,
  Swords,
  Target,
  Terminal,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Play,
  Layers,
  ChevronRight,
  Clock
} from 'lucide-react';
import styles from './page.module.css';

interface CodeSample {
  filename: string;
  langName: string;
  lines: ReactNode[];
}

const CODE_SAMPLES: Record<string, CodeSample> = {
  python: {
    filename: 'solution.py',
    langName: 'Python 3',
    lines: [
      <span key="1"><span className={styles.kw}>def</span> <span className={styles.fn}>two_sum</span>(<span className={styles.var}>nums</span>: <span className={styles.type}>list</span>[<span className={styles.type}>int</span>], <span className={styles.var}>target</span>: <span className={styles.type}>int</span>) <span className={styles.op}>-&gt;</span> <span className={styles.type}>list</span>[<span className={styles.type}>int</span>]:</span>,
      <span key="2">{'    '}<span className={styles.var}>lookup</span> <span className={styles.op}>=</span> &#123;&#125;</span>,
      <span key="3">{'    '}<span className={styles.kw}>for</span> <span className={styles.var}>i</span>, <span className={styles.var}>num</span> <span className={styles.kw}>in</span> <span className={styles.fn}>enumerate</span>(<span className={styles.var}>nums</span>):</span>,
      <span key="4">{'        '}<span className={styles.var}>diff</span> <span className={styles.op}>=</span> <span className={styles.var}>target</span> <span className={styles.op}>-</span> <span className={styles.var}>num</span></span>,
      <span key="5">{'        '}<span className={styles.kw}>if</span> <span className={styles.var}>diff</span> <span className={styles.kw}>in</span> <span className={styles.var}>lookup</span>:</span>,
      <span key="6">{'            '}<span className={styles.kw}>return</span> [<span className={styles.var}>lookup</span>[<span className={styles.var}>diff</span>], <span className={styles.var}>i</span>]</span>,
      <span key="7">{'        '}<span className={styles.var}>lookup</span>[<span className={styles.var}>num</span>] <span className={styles.op}>=</span> <span className={styles.var}>i</span></span>,
      <span key="8">{'    '}<span className={styles.kw}>return</span> []</span>,
      <span key="9">&nbsp;</span>,
      <span key="10"><span className={styles.cmt}># Test execution</span></span>,
      <span key="11"><span className={styles.fn}>print</span>(<span className={styles.fn}>two_sum</span>([<span className={styles.num}>2</span>, <span className={styles.num}>7</span>, <span className={styles.num}>11</span>, <span className={styles.num}>15</span>], <span className={styles.num}>9</span>))  <span className={styles.cmt}># Output: [0, 1]</span></span>
    ]
  },
  cpp: {
    filename: 'solution.cpp',
    langName: 'C++ 20',
    lines: [
      <span key="1"><span className={styles.kw}>#include</span> <span className={styles.str}>&lt;vector&gt;</span></span>,
      <span key="2"><span className={styles.kw}>#include</span> <span className={styles.str}>&lt;unordered_map&gt;</span></span>,
      <span key="3">&nbsp;</span>,
      <span key="4"><span className={styles.type}>std::vector</span>&lt;<span className={styles.type}>int</span>&gt; <span className={styles.fn}>twoSum</span>(<span className={styles.kw}>const</span> <span className={styles.type}>std::vector</span>&lt;<span className={styles.type}>int</span>&gt;&amp; <span className={styles.var}>nums</span>, <span className={styles.type}>int</span> <span className={styles.var}>target</span>) &#123;</span>,
      <span key="5">{'    '}<span className={styles.type}>std::unordered_map</span>&lt;<span className={styles.type}>int</span>, <span className={styles.type}>int</span>&gt; <span className={styles.var}>lookup</span>;</span>,
      <span key="6">{'    '}<span className={styles.kw}>for</span> (<span className={styles.type}>int</span> <span className={styles.var}>i</span> <span className={styles.op}>=</span> <span className={styles.num}>0</span>; <span className={styles.var}>i</span> &lt; (<span className={styles.type}>int</span>)<span className={styles.var}>nums</span>.<span className={styles.fn}>size</span>(); <span className={styles.op}>++</span><span className={styles.var}>i</span>) &#123;</span>,
      <span key="7">{'        '}<span className={styles.type}>int</span> <span className={styles.var}>diff</span> <span className={styles.op}>=</span> <span className={styles.var}>target</span> <span className={styles.op}>-</span> <span className={styles.var}>nums</span>[<span className={styles.var}>i</span>];</span>,
      <span key="8">{'        '}<span className={styles.kw}>if</span> (<span className={styles.var}>lookup</span>.<span className={styles.fn}>count</span>(<span className={styles.var}>diff</span>))</span>,
      <span key="9">{'            '}<span className={styles.kw}>return</span> &#123;<span className={styles.var}>lookup</span>[<span className={styles.var}>diff</span>], <span className={styles.var}>i</span>&#125;;</span>,
      <span key="10">{'        '}<span className={styles.var}>lookup</span>[<span className={styles.var}>nums</span>[<span className={styles.var}>i</span>]] <span className={styles.op}>=</span> <span className={styles.var}>i</span>;</span>,
      <span key="11">{'    '}&#125;</span>,
      <span key="12">{'    '}<span className={styles.kw}>return</span> &#123;&#125;;</span>,
      <span key="13">&#125;</span>
    ]
  },
  typescript: {
    filename: 'solution.ts',
    langName: 'TypeScript',
    lines: [
      <span key="1"><span className={styles.kw}>function</span> <span className={styles.fn}>twoSum</span>(<span className={styles.var}>nums</span>: <span className={styles.type}>number</span>[], <span className={styles.var}>target</span>: <span className={styles.type}>number</span>): <span className={styles.type}>number</span>[] &#123;</span>,
      <span key="2">{'  '}<span className={styles.kw}>const</span> <span className={styles.var}>lookup</span> <span className={styles.op}>=</span> <span className={styles.kw}>new</span> <span className={styles.type}>Map</span>&lt;<span className={styles.type}>number</span>, <span className={styles.type}>number</span>&gt;();</span>,
      <span key="3">{'  '}<span className={styles.kw}>for</span> (<span className={styles.kw}>let</span> <span className={styles.var}>i</span> <span className={styles.op}>=</span> <span className={styles.num}>0</span>; <span className={styles.var}>i</span> &lt; <span className={styles.var}>nums</span>.<span className={styles.var}>length</span>; <span className={styles.var}>i</span><span className={styles.op}>++</span>) &#123;</span>,
      <span key="4">{'    '}<span className={styles.kw}>const</span> <span className={styles.var}>diff</span> <span className={styles.op}>=</span> <span className={styles.var}>target</span> <span className={styles.op}>-</span> <span className={styles.var}>nums</span>[<span className={styles.var}>i</span>];</span>,
      <span key="5">{'    '}<span className={styles.kw}>if</span> (<span className={styles.var}>lookup</span>.<span className={styles.fn}>has</span>(<span className={styles.var}>diff</span>)) &#123;</span>,
      <span key="6">{'      '}<span className={styles.kw}>return</span> [<span className={styles.var}>lookup</span>.<span className={styles.fn}>get</span>(<span className={styles.var}>diff</span>)!, <span className={styles.var}>i</span>];</span>,
      <span key="7">{'    '}&#125;</span>,
      <span key="8">{'    '}<span className={styles.var}>lookup</span>.<span className={styles.fn}>set</span>(<span className={styles.var}>nums</span>[<span className={styles.var}>i</span>], <span className={styles.var}>i</span>);</span>,
      <span key="9">{'  '}&#125;</span>,
      <span key="10">{'  '}<span className={styles.kw}>return</span> [];</span>,
      <span key="11">&#125;</span>
    ]
  }
};

const PLATFORM_FEATURES = [
  {
    badge: '1v1 Duels',
    icon: Swords,
    color: 'var(--accent-green)',
    title: '1v1 Versus Arena',
    description: 'Face off against friends or peers in live head-to-head coding battles with synchronized countdowns and instant winner verification.',
    tags: ['Live WebSocket Sync', 'Private Room Codes', 'Live Timers'],
    href: '/versus',
    ctaText: 'Enter Versus Arena'
  },
  {
    badge: 'Competitive',
    icon: Trophy,
    color: 'var(--accent-orange)',
    title: 'Dual-Mode Contests',
    description: 'Participate in structured competitive programming exams. Choose between strict lockdown exams or interactive rounds with MCQs.',
    tags: ['Standard & Interactive', 'Proctored Telemetry', 'Live Rankings'],
    href: '/contests',
    ctaText: 'Explore Contests'
  },
  {
    badge: 'Cloud Sandbox',
    icon: Terminal,
    color: 'var(--accent-blue)',
    title: 'Online Web IDE',
    description: 'Instant scratchpad with sub-second compilation across 13+ languages. Test custom inputs and inspect execution runtime and memory.',
    tags: ['13+ Compilers', 'Custom Stdin / Stdout', 'Zero Setup'],
    href: '/ide',
    ctaText: 'Launch Web IDE'
  },
  {
    badge: 'Algorithms',
    icon: Target,
    color: 'var(--accent-purple)',
    title: 'Curated Problem Sets',
    description: 'Solve hundreds of algorithmic challenges categorized by topic and difficulty with integrated testcase verification and instant feedback.',
    tags: ['Topic Categorized', 'LeetCode-Grade Judger', 'Real-time Metrics'],
    href: '/problems',
    ctaText: 'Explore Problems'
  }
];

export default function HomePage() {
  const [selectedLang, setSelectedLang] = useState<'python' | 'cpp' | 'typescript'>('python');
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const handleRun = () => {
    if (isRunning) return;
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasRun(true);
    }, 600);
  };

  return (
    <div className={styles.page}>
      {/* Background glow ambiance */}
      <div className={styles.heroBg}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.grid} />
      </div>

      {/* ─── Hero Section ────────────────────────────── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroContainer}`}>
          

          <h1 className={styles.heroTitle}>
            Master Algorithms.<br />
            <span className={styles.gradientHeading}>Build Coding Confidence.</span>
          </h1>

          <p className={styles.heroSub}>
            Practice DSA in a fast multi-language cloud IDE, uncover your recurring mistakes through 
            data-driven diagnostics, and compete in timed contests.
          </p>

          <div className={styles.heroActions}>
            <Link href="/problems" className={`btn btn-primary btn-lg ${styles.primaryBtn}`}>
              Start Practicing <ArrowRight size={16} />
            </Link>
            <Link href="/contests" className={`btn btn-secondary btn-lg ${styles.secondaryBtn}`}>
              <Trophy size={16} />
              Explore Contests
            </Link>
          </div>

          {/* Simple Code & Diagnostic Preview */}
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <div className={styles.windowControls}>
                <span className={`${styles.dot} ${styles.dotRed}`} />
                <span className={`${styles.dot} ${styles.dotYellow}`} />
                <span className={`${styles.dot} ${styles.dotGreen}`} />
              </div>

              <div className={styles.langSelector}>
                {(['python', 'cpp', 'typescript'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    className={`${styles.langBtn} ${selectedLang === lang ? styles.langBtnActive : ''}`}
                    onClick={() => { setSelectedLang(lang); setHasRun(false); }}
                  >
                    {CODE_SAMPLES[lang].langName}
                  </button>
                ))}
              </div>

              <div className={styles.fileInfo}>
                <Code2 size={13} />
                <span>{CODE_SAMPLES[selectedLang].filename}</span>
              </div>
            </div>

            <div className={styles.previewBody}>
              <div className={styles.codeContainer}>
                <div className={styles.lineNumbers} aria-hidden="true">
                  {CODE_SAMPLES[selectedLang].lines.map((_, idx) => (
                    <span key={idx}>{idx + 1}</span>
                  ))}
                </div>
                <div className={styles.codeLines}>
                  {CODE_SAMPLES[selectedLang].lines.map((line, idx) => (
                    <div key={idx} className={styles.codeLine}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.previewFooter}>
              <button
                type="button"
                className={`btn btn-primary btn-sm ${styles.runButton}`}
                onClick={handleRun}
                disabled={isRunning}
              >
                <Play size={13} fill="currentColor" />
                {isRunning ? 'Running...' : 'Run Code'}
              </button>

              {hasRun ? (
                <div className={styles.statusSuccess}>
                  <CheckCircle2 size={15} />
                  <span>All Test Cases Passed (3/3) · 32ms execution time</span>
                </div>
              ) : (
                <div className={styles.statusDefault}>
                  <Clock size={14} />
                  <span>Click Run Code to execute in the cloud sandbox</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ─── Essential Features ───────────────────────── */}
      <section className={styles.featuresSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Layers size={13} /> Platform Modes
            </div>
            <h2>Core Platform Features</h2>
            <p>Everything you need for practice, real-time competition, and targeted diagnostic growth.</p>
          </div>

          <div className={styles.featureGrid}>
            {PLATFORM_FEATURES.map((item) => {
              const IconComp = item.icon;
              return (
                <div key={item.title} className={styles.featureCard}>
                  <div className={styles.cardTopRow}>
                    <div className={styles.featureIconWrap} style={{ color: item.color }}>
                      <IconComp size={20} />
                    </div>
                    <span className={styles.cardBadge} style={{ color: item.color, borderColor: item.color }}>
                      {item.badge}
                    </span>
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.description}</p>

                  <div className={styles.tagRow}>
                    {item.tags.map((tag) => (
                      <span key={tag} className={styles.featureTag}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Link href={item.href} className={styles.featureLink}>
                    {item.ctaText} <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Simple 3-Step Workflow ──────────────────── */}
      <section className={styles.workflowSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>How It Works</h2>
            <p>Simple, effective, and continuous skill progression.</p>
          </div>

          <div className={styles.workflowRow}>
            <div className={styles.workflowStep}>
              <div className={styles.stepBadge}>1</div>
              <h4>Practice Problems</h4>
              <p>Solve challenges across standard DSA topics with real-time compiler feedback.</p>
            </div>

            <div className={styles.workflowDivider}>
              <ChevronRight size={20} />
            </div>

            <div className={styles.workflowStep}>
              <div className={styles.stepBadge}>2</div>
              <h4>Identify Weaknesses</h4>
              <p>The system evaluates your failed attempts to find recurring topic and error patterns.</p>
            </div>

            <div className={styles.workflowDivider}>
              <ChevronRight size={20} />
            </div>

            <div className={styles.workflowStep}>
              <div className={styles.stepBadge}>3</div>
              <h4>Targeted Improvement</h4>
              <p>Receive tailored practice suggestions to turn your weakest topics into strengths.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

