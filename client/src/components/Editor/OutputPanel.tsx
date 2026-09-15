'use client';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Zap } from 'lucide-react';
import styles from './OutputPanel.module.css';
import TestCaseResults from './TestCaseResults';

interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  isHidden: boolean;
  runtime?: number;
}

interface Props {
  stdout?: string;
  stderr?: string;
  status?: string;
  runtime?: number;
  testResults?: TestResult[];
  isRunning?: boolean;
  passedCount?: number;
  totalCount?: number;
}

const STATUS_COLORS: Record<string, string> = {
  Accepted: 'var(--accent-green)',
  'Wrong Answer': 'var(--accent-red)',
  'Runtime Error': 'var(--accent-orange)',
  'Compile Error': 'var(--accent-orange)',
  'Time Limit Exceeded': 'var(--accent-yellow)',
  Running: 'var(--accent-blue)',
  Pending: 'var(--text-muted)',
};

export default function OutputPanel({ 
  stdout, 
  stderr, 
  status, 
  runtime, 
  testResults, 
  isRunning,
  passedCount,
  totalCount
}: Props) {
  if (isRunning) {
    return (
      <div className={styles.panel}>
        <div className={styles.loading}>
          <div className="spinner" />
          <span>Executing code...</span>
        </div>
      </div>
    );
  }

  // If we have test results, use the dedicated premium results component
  if (testResults && testResults.length > 0) {
    return (
      <div className={styles.panel} style={{ padding: 0 }}>
        <TestCaseResults 
          testResults={testResults}
          passedCount={passedCount}
          totalCount={totalCount}
          stderr={stderr}
          status={status}
        />
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      {status && (
        <div className={styles.statusBar}>
          <span className={styles.statusLabel} style={{ color: STATUS_COLORS[status] || 'var(--text-primary)' }}>
            {status === 'Accepted' ? <CheckCircle2 size={14} color="var(--accent-green)" /> : status === 'Wrong Answer' ? <XCircle size={14} color="var(--accent-red)" /> : status === 'Runtime Error' || status === 'Compile Error' ? <AlertTriangle size={14} color="var(--accent-orange)" /> : <Clock size={14} color="var(--text-muted)" />}{' '}{status}
          </span>
          {runtime && <span className={styles.runtime}><Zap size={12} />{runtime}ms</span>}
        </div>
      )}

      {stdout && (
        <div className={styles.outputSection}>
          <h4 className={styles.sectionTitle}>Output</h4>
          <pre className={styles.output}>{stdout}</pre>
        </div>
      )}

      {stderr && (
        <div className={styles.outputSection}>
          <h4 className={`${styles.sectionTitle} ${styles.errorTitle}`}>Error</h4>
          <pre className={`${styles.output} ${styles.errorOutput}`}>{stderr}</pre>
        </div>
      )}

      {!status && !stdout && !stderr && (
        <div className={styles.empty}>
          <span>Run your code to see the output here</span>
        </div>
      )}
    </div>
  );
}
