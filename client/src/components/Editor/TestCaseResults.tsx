'use client';
import { useState } from 'react';
import { Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import styles from './TestCaseResults.module.css';

interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  isHidden: boolean;
  runtime?: number;
}

interface Props {
  testResults: TestResult[];
  passedCount?: number;
  totalCount?: number;
  stderr?: string;
  status?: string;
}

export default function TestCaseResults({ testResults, passedCount, totalCount, stderr, status }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const isAccepted = status === 'Accepted';
  const isRunning = status === 'Running' || status === 'Pending';

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <div className={styles.status}>
          {isRunning ? (
            <span className={styles.runningText}>
              <Clock size={16} /> Judging...
            </span>
          ) : isAccepted ? (
            <span className={styles.passedText}>
              <CheckCircle2 size={16} /> Accepted
            </span>
          ) : (
            <span className={styles.failedText}>
              <XCircle size={16} /> {status || 'Failed'}
            </span>
          )}
        </div>
        {(passedCount !== undefined && totalCount !== undefined) && (
          <div className={styles.counts}>
            {passedCount} / {totalCount} Test Cases Passed
          </div>
        )}
      </div>

      {stderr && (
        <div className={styles.errorBlock}>
          <div className={styles.errorTitle}>
            <AlertCircle size={16} /> {status === 'Runtime Error' ? 'Runtime Error' : 'Compiler Error'}
          </div>
          <pre className={styles.errorContent}>{stderr}</pre>
        </div>
      )}

      <div className={styles.testCaseList}>
        {testResults.map((tc, i) => (
          <div key={i} className={styles.testCaseRow}>
            <div 
              className={styles.testCaseHeader} 
              onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
            >
              <span className={styles.caseTitle}>Case {i + 1}</span>
              <span className={`${styles.badge} ${tc.passed ? styles.badgePassed : styles.badgeFailed}`}>
                {tc.passed ? 'Passed' : 'Failed'}
              </span>
              {tc.isHidden && <span className={`${styles.badge} ${styles.badgeHidden}`}>Hidden</span>}
              {tc.runtime !== undefined && <span className={styles.runtime}>{tc.runtime}ms</span>}
              <span className={styles.expandIcon}>
                {expandedIndex === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </div>

            {expandedIndex === i && (
              <div className={styles.testCaseBody}>
                {tc.isHidden && !tc.passed ? (
                  <div className={styles.hiddenNote}>
                    Details hidden for this test case to prevent hardcoding solutions.
                  </div>
                ) : tc.isHidden && tc.passed ? (
                  <div className={styles.hiddenNote}>
                    All correct! This was a hidden test case.
                  </div>
                ) : (
                  <>
                    <div className={styles.ioGroup}>
                      <span className={styles.ioLabel}>Input</span>
                      <div className={styles.ioValue}>{tc.input}</div>
                    </div>
                    <div className={styles.ioGroup}>
                      <span className={styles.ioLabel}>Expected Output</span>
                      <div className={styles.ioValue}>{tc.expected}</div>
                    </div>
                    <div className={styles.ioGroup}>
                      <span className={styles.ioLabel}>Actual Output</span>
                      <div className={`${styles.ioValue} ${!tc.passed ? styles.wrongValue : ''}`}>
                        {tc.actual || '(no output)'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
